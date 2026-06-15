import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors } from './theme'

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
}) {
  const isPrimary = variant === 'primary'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.brand} />
      ) : (
        <Text style={[styles.btnText, isPrimary ? { color: '#fff' } : { color: colors.brand }]}>{title}</Text>
      )}
    </Pressable>
  )
}

export function Pill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  )
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.brand },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { fontSize: 15, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyHint: { marginTop: 6, fontSize: 14, color: colors.sub, textAlign: 'center' },
})
