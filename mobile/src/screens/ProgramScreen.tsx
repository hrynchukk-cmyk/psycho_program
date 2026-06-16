import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card } from '../ui'
import { colors } from '../theme'

const modeLabel = (mode: string, days: number, first: boolean) => {
  if (mode === 'immediately') return first ? 'Відкрито одразу' : 'Після попередньої'
  if (mode === 'afterPrevious') return `Через ${days} дн. після попередньої`
  return `Через ${days} дн. від старту`
}

export default function ProgramScreen({ route }: any) {
  const { delivery } = route.params
  const program = delivery.program
  const steps: any[] = program?.steps ?? []
  const statusLabel = delivery.status === 'completed' ? 'Завершено' : delivery.status === 'inProgress' ? 'В процесі' : 'Нове'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Хедер-картка */}
      <Card style={{ marginBottom: 14 }}>
        <Text style={styles.headerIcon}>🧘</Text>
        <Text style={styles.title}>{program?.title}</Text>
        {program?.description ? <Text style={styles.desc}>{program.description}</Text> : null}
        <View style={styles.chip}>
          <Text style={styles.chipText}>{statusLabel} · {steps.length} кроків</Text>
        </View>
      </Card>

      <Text style={styles.section}>Кроки програми</Text>

      {/* Таймлайн в одній картці */}
      <Card style={{ padding: 14 }}>
        {steps.map((s, i) => (
          <View key={s.id} style={styles.stepRow}>
            <View style={styles.railCol}>
              <View style={styles.dot}>
                <Text style={styles.dotNum}>{i + 1}</Text>
              </View>
              {i < steps.length - 1 && <View style={styles.line} />}
            </View>
            <View style={{ flex: 1, paddingTop: 1, paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
              <Text style={styles.stepTitle}>{s.activityTitle}</Text>
              {s.activityDescription ? <Text style={styles.stepDesc} numberOfLines={2}>{s.activityDescription}</Text> : null}
              <Text style={styles.stepMeta}>{modeLabel(s.mode, s.days, i === 0)}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={styles.note}>
        Активності надходитимуть за розкладом. Коли крок стане доступним, ви побачите його на головному екрані.
      </Text>
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  headerIcon: { fontSize: 28, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.sub, marginTop: 5, lineHeight: 19 },
  chip: { alignSelf: 'flex-start', backgroundColor: colors.brandSoft, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.brand },
  section: { fontSize: 11, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.7 },
  stepRow: { flexDirection: 'row', gap: 10 },
  railCol: { width: 24, alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  dotNum: { color: '#fff', fontWeight: '800', fontSize: 11 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  stepDesc: { fontSize: 12, color: colors.sub, marginTop: 2, lineHeight: 17 },
  stepMeta: { fontSize: 11, color: colors.faint, marginTop: 5 },
  note: { fontSize: 12, color: colors.sub, marginTop: 14, lineHeight: 18 },
})
