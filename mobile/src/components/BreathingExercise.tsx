import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Speech from 'expo-speech'
import { colors } from '../theme'

const MIN_SCALE = 0.5

type Phase = { label: string; say: string; sec: number; to: number }

// Будує фази з патерну: [вдих, затримка, видих] або [вдих, затримка, видих, пауза].
function buildPhases(pattern: number[]): Phase[] {
  const inhale = pattern[0] ?? 4
  const hold = pattern[1] ?? 0
  const exhale = pattern[2] ?? 4
  const rest = pattern[3] ?? 0
  const phases: Phase[] = [{ label: 'Вдих', say: 'Вдихніть', sec: inhale, to: 1 }]
  if (hold > 0) phases.push({ label: 'Затримка', say: 'Затримайте', sec: hold, to: 1 })
  phases.push({ label: 'Видих', say: 'Видихніть', sec: exhale, to: MIN_SCALE })
  if (rest > 0) phases.push({ label: 'Пауза', say: 'Пауза', sec: rest, to: MIN_SCALE })
  return phases
}

export default function BreathingExercise({
  visible,
  onClose,
  pattern = [4, 7, 8],
  cycles = 4,
  title = 'Дихальна вправа 4-7-8',
}: {
  visible: boolean
  onClose: () => void
  pattern?: number[]
  cycles?: number
  title?: string
}) {
  const phases = buildPhases(pattern)
  const scale = useRef(new Animated.Value(MIN_SCALE)).current
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const [phaseLabel, setPhaseLabel] = useState('Готові?')
  const [count, setCount] = useState(0)
  const [cycle, setCycle] = useState(1)
  const [muted, setMuted] = useState(false)

  const stopped = useRef(false)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)
  const mutedRef = useRef(false)
  mutedRef.current = muted

  const clearTick = () => {
    if (tick.current) clearInterval(tick.current)
    tick.current = null
  }

  const cleanup = () => {
    stopped.current = true
    clearTick()
    scale.stopAnimation()
    Speech.stop()
  }

  useEffect(() => () => cleanup(), [])

  const speak = (text: string) => {
    if (mutedRef.current) return
    Speech.stop()
    Speech.speak(text, { language: 'uk-UA', rate: 0.85, pitch: 1.0 })
  }

  const startCountdown = (sec: number) => {
    clearTick()
    setCount(sec)
    tick.current = setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : c))
    }, 1000)
  }

  const runPhase = (pIdx: number, cyc: number) => {
    if (stopped.current) return
    const ph = phases[pIdx]
    setPhaseLabel(ph.label)
    speak(ph.say)
    startCountdown(ph.sec)

    Animated.timing(scale, {
      toValue: ph.to,
      duration: ph.sec * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || stopped.current) return
      clearTick()
      let nextP = pIdx + 1
      let nextC = cyc
      if (nextP >= phases.length) {
        nextP = 0
        nextC = cyc + 1
      }
      if (nextC > cycles) {
        finish()
        return
      }
      setCycle(nextC)
      runPhase(nextP, nextC)
    })
  }

  const finish = () => {
    clearTick()
    setState('done')
    setPhaseLabel('Готово')
    if (!mutedRef.current) Speech.speak('Чудово. Вправу завершено.', { language: 'uk-UA', rate: 0.85 })
  }

  const start = () => {
    stopped.current = false
    setCycle(1)
    setState('running')
    runPhase(0, 1)
  }

  const close = () => {
    cleanup()
    setState('idle')
    setPhaseLabel('Готові?')
    scale.setValue(MIN_SCALE)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.close} onPress={close} hitSlop={12}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Pressable style={styles.mute} onPress={() => setMuted((m) => !m)} hitSlop={12}>
          <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>

        <Text style={styles.title}>{title}</Text>
        {state === 'running' && <Text style={styles.cycle}>Цикл {cycle} / {cycles}</Text>}

        <View style={styles.stage}>
          <Animated.View style={[styles.ring, { transform: [{ scale }] }]}>
            <View style={styles.orb} />
          </Animated.View>
          <View style={styles.centerText} pointerEvents="none">
            <Text style={styles.phase}>{phaseLabel}</Text>
            {state === 'running' && <Text style={styles.count}>{count}</Text>}
          </View>
        </View>

        {state === 'idle' && (
          <>
            <Text style={styles.hint}>Сядьте зручно. Дихайте за кругом і голосом: вдих 4 с · затримка 7 с · видих 8 с.</Text>
            <Pressable style={styles.btn} onPress={start}>
              <Text style={styles.btnText}>Почати</Text>
            </Pressable>
          </>
        )}
        {state === 'running' && (
          <Pressable style={styles.btnGhost} onPress={close}>
            <Text style={styles.btnGhostText}>Зупинити</Text>
          </Pressable>
        )}
        {state === 'done' && (
          <>
            <Text style={styles.doneHint}>🌿 Гарна робота. Поверніться до своїх відчуттів.</Text>
            <Pressable style={styles.btn} onPress={close}>
              <Text style={styles.btnText}>Завершити</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16204f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  close: { position: 'absolute', top: 52, right: 22 },
  closeIcon: { color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: '600' },
  mute: { position: 'absolute', top: 52, left: 22 },
  muteIcon: { fontSize: 20 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  cycle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6, fontWeight: '600' },
  stage: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  ring: { width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: 'rgba(125,155,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  orb: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(98,134,255,0.35)' },
  centerText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  phase: { color: '#fff', fontSize: 26, fontWeight: '800' },
  count: { color: 'rgba(255,255,255,0.7)', fontSize: 17, marginTop: 4, fontWeight: '600' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 18, paddingHorizontal: 8 },
  doneHint: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 18 },
  btn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnGhost: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnGhostText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
})
