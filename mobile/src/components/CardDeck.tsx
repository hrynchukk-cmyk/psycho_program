import React, { useRef, useState } from 'react'
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

const SCREEN_W = Dimensions.get('window').width
const SWIPE_THRESHOLD = SCREEN_W * 0.25

// Свайпова колода рефлексивних карток. Картки = масив рядків (промптів).
export default function CardDeck({
  visible,
  onClose,
  title = 'Колода карток',
  cards,
}: {
  visible: boolean
  onClose: () => void
  title?: string
  cards: string[]
}) {
  const [index, setIndex] = useState(0)
  const pos = useRef(new Animated.ValueXY()).current
  const done = index >= cards.length

  const reset = () => pos.setValue({ x: 0, y: 0 })

  const go = (dir: 1 | -1) => {
    const to = dir * SCREEN_W * 1.2
    Animated.timing(pos, { toValue: { x: to, y: 0 }, duration: 200, useNativeDriver: true }).start(() => {
      setIndex((i) => Math.min(cards.length, Math.max(0, i + dir)))
      reset()
    })
  }

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => pos.setValue({ x: g.dx, y: g.dy * 0.2 }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD) go(1)
        else if (g.dx < -SWIPE_THRESHOLD) go(-1)
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start()
      },
    }),
  ).current

  const rotate = pos.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-8deg', '0deg', '8deg'] })

  const restart = () => {
    setIndex(0)
    reset()
  }

  const close = () => {
    restart()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {!done && (
          <View style={styles.progressWrap}>
            <Text style={styles.progressText}>Картка {index + 1} з {cards.length}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.stage}>
          {done ? (
            <View style={styles.doneCard}>
              <Text style={styles.doneEmoji}>🌿</Text>
              <Text style={styles.doneTitle}>Колоду пройдено</Text>
              <Text style={styles.doneHint}>Гарна робота. Поверніться до карток будь-коли.</Text>
              <Pressable style={styles.btn} onPress={restart}>
                <Text style={styles.btnText}>Пройти знову</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* картка-«підкладка» для відчуття стосу */}
              {index + 1 < cards.length && <View style={[styles.card, styles.cardBehind]} />}
              <Animated.View
                {...pan.panHandlers}
                style={[styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
              >
                <Text style={styles.cardNum}>{index + 1}</Text>
                <Text style={styles.cardText}>{cards[index]}</Text>
              </Animated.View>
            </>
          )}
        </View>

        {!done && (
          <View style={styles.controls}>
            <Pressable style={[styles.navBtn, index === 0 && styles.navDisabled]} onPress={() => index > 0 && go(-1)}>
              <Text style={styles.navText}>← Назад</Text>
            </Pressable>
            <Text style={styles.swipeHint}>свайпніть картку</Text>
            <Pressable style={styles.navBtnPrimary} onPress={() => go(1)}>
              <Text style={styles.navTextPrimary}>{index + 1 === cards.length ? 'Завершити' : 'Далі →'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, marginRight: 12 },
  close: { fontSize: 20, color: colors.faint, fontWeight: '600' },
  progressWrap: { paddingHorizontal: 20, marginBottom: 8 },
  progressText: { fontSize: 12, color: colors.sub, marginBottom: 6, fontWeight: '600' },
  progressBar: { height: 5, borderRadius: 3, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.brand },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: SCREEN_W - 56,
    minHeight: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1c2540',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardBehind: { position: 'absolute', top: 32, transform: [{ scale: 0.94 }], opacity: 0.5 },
  cardNum: { position: 'absolute', top: 18, left: 20, fontSize: 13, fontWeight: '800', color: colors.brand },
  cardText: { fontSize: 21, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 30 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8 },
  navBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  navDisabled: { opacity: 0.4 },
  navText: { fontSize: 14, fontWeight: '600', color: colors.text2 },
  navBtnPrimary: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, backgroundColor: colors.brand },
  navTextPrimary: { fontSize: 14, fontWeight: '700', color: '#fff' },
  swipeHint: { fontSize: 11, color: colors.faint },
  doneCard: { alignItems: 'center', padding: 24 },
  doneEmoji: { fontSize: 40 },
  doneTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 10 },
  doneHint: { fontSize: 14, color: colors.sub, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  btn: { backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
