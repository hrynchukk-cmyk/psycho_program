import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import * as Speech from 'expo-speech'
import { colors } from '../theme'

const MIN_SCALE = 0.5

// Аудіо: голосові підказки (ElevenLabs) + фонова музика. Програються нативно.
const SOUNDS = {
  inhale: require('../../assets/audio/inhale.mp3'),
  hold: require('../../assets/audio/hold.mp3'),
  exhale: require('../../assets/audio/exhale.mp3'),
  done: require('../../assets/audio/done.mp3'),
  ambient: require('../../assets/audio/ambient.mp3'),
}
// Текст для фолбеку на системний TTS, якщо аудіо не вдалось завантажити.
const FALLBACK: Record<string, string> = { inhale: 'Вдихніть', hold: 'Затримайте', exhale: 'Видихніть', done: 'Вправу завершено. Чудова робота' }

type SoundKey = 'inhale' | 'hold' | 'exhale'
type Phase = { label: string; sound: SoundKey; sec: number; to: number }

function buildPhases(pattern: number[]): Phase[] {
  const inhale = pattern[0] ?? 4
  const hold = pattern[1] ?? 0
  const exhale = pattern[2] ?? 4
  const rest = pattern[3] ?? 0
  const phases: Phase[] = [{ label: 'Вдих', sound: 'inhale', sec: inhale, to: 1 }]
  if (hold > 0) phases.push({ label: 'Затримка', sound: 'hold', sec: hold, to: 1 })
  phases.push({ label: 'Видих', sound: 'exhale', sec: exhale, to: MIN_SCALE })
  if (rest > 0) phases.push({ label: 'Пауза', sound: 'hold', sec: rest, to: MIN_SCALE })
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
  const players = useRef<Record<string, AudioPlayer> | null>(null)

  // Завантаження плеєрів один раз.
  useEffect(() => {
    try {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
      const p: Record<string, AudioPlayer> = {}
      for (const key of Object.keys(SOUNDS)) p[key] = createAudioPlayer((SOUNDS as any)[key])
      p.ambient.loop = true
      p.ambient.volume = 0.3
      players.current = p
    } catch {
      players.current = null
    }
    return () => {
      Object.values(players.current ?? {}).forEach((pl) => {
        try {
          pl.remove()
        } catch {}
      })
      players.current = null
    }
  }, [])

  const clearTick = () => {
    if (tick.current) clearInterval(tick.current)
    tick.current = null
  }

  const cleanup = () => {
    stopped.current = true
    clearTick()
    scale.stopAnimation()
    Speech.stop()
    try {
      players.current?.ambient?.pause()
    } catch {}
  }

  useEffect(() => () => cleanup(), [])

  const playCue = (key: string) => {
    if (mutedRef.current) return
    const pl = players.current?.[key]
    if (pl) {
      pl.seekTo(0)
        .then(() => pl.play())
        .catch(() => {
          try {
            pl.play()
          } catch {}
        })
      return
    }
    if (FALLBACK[key]) Speech.speak(FALLBACK[key], { language: 'uk-UA', rate: 0.85 })
  }

  const startCountdown = (sec: number) => {
    clearTick()
    setCount(sec)
    tick.current = setInterval(() => setCount((c) => (c > 1 ? c - 1 : c)), 1000)
  }

  const runPhase = (pIdx: number, cyc: number) => {
    if (stopped.current) return
    const ph = phases[pIdx]
    setPhaseLabel(ph.label)
    playCue(ph.sound)
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
    playCue('done')
    setTimeout(() => {
      try {
        players.current?.ambient?.pause()
      } catch {}
    }, 4000)
  }

  const start = () => {
    stopped.current = false
    setCycle(1)
    setState('running')
    if (!mutedRef.current) {
      try {
        players.current?.ambient?.seekTo(0)
        players.current?.ambient?.play()
      } catch {}
    }
    runPhase(0, 1)
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    if (next) {
      Speech.stop()
      try {
        players.current?.ambient?.pause()
      } catch {}
    } else if (state === 'running') {
      try {
        players.current?.ambient?.play()
      } catch {}
    }
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
        <Pressable style={styles.mute} onPress={toggleMute} hitSlop={12}>
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
  root: { flex: 1, backgroundColor: '#241813', alignItems: 'center', justifyContent: 'center', padding: 24 },
  close: { position: 'absolute', top: 52, right: 22 },
  closeIcon: { color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: '600' },
  mute: { position: 'absolute', top: 52, left: 22 },
  muteIcon: { fontSize: 20 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  cycle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6, fontWeight: '600' },
  stage: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  ring: { width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: 'rgba(232,192,106,0.45)', alignItems: 'center', justifyContent: 'center' },
  orb: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(232,192,106,0.30)' },
  centerText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  phase: { color: '#fff', fontSize: 26, fontWeight: '800' },
  count: { color: 'rgba(255,255,255,0.7)', fontSize: 17, marginTop: 4, fontWeight: '600' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 18, paddingHorizontal: 8 },
  doneHint: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 18 },
  btn: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48 },
  btnText: { color: colors.brandDark, fontSize: 16, fontWeight: '700' },
  btnGhost: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnGhostText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
})
