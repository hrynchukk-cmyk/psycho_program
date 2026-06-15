import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

const modeLabel = (mode: string, days: number, first: boolean) => {
  if (mode === 'immediately') return first ? 'Доступно одразу' : 'Після попередньої'
  if (mode === 'afterPrevious') return `Через ${days} дн. після попередньої`
  return `Через ${days} дн. від старту`
}

export default function ProgramScreen({ route }: any) {
  const { delivery } = route.params
  const program = delivery.program
  const steps: any[] = program?.steps ?? []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{program?.title}</Text>
      {program?.description ? <Text style={styles.desc}>{program.description}</Text> : null}
      <Text style={styles.section}>Кроки програми</Text>

      {steps.map((s, i) => (
        <View key={s.id} style={styles.stepRow}>
          <View style={styles.railCol}>
            <View style={styles.dot}>
              <Text style={styles.dotNum}>{i + 1}</Text>
            </View>
            {i < steps.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>{s.activityTitle}</Text>
            {s.activityDescription ? <Text style={styles.stepDesc} numberOfLines={2}>{s.activityDescription}</Text> : null}
            <Text style={styles.stepMeta}>⏱ {modeLabel(s.mode, s.days, i === 0)}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.note}>
        Активності програми надходитимуть за розкладом. Коли крок стане доступним, ви побачите його на головному екрані.
      </Text>
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.sub, marginTop: 6, lineHeight: 20 },
  section: { fontSize: 13, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', marginTop: 20, marginBottom: 12, letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row' },
  railCol: { width: 40, alignItems: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  dotNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  stepCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 12, marginLeft: 8 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepDesc: { fontSize: 13, color: colors.sub, marginTop: 3, lineHeight: 18 },
  stepMeta: { fontSize: 12, color: colors.faint, marginTop: 8 },
  note: { fontSize: 13, color: colors.sub, marginTop: 8, lineHeight: 19 },
})
