import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../api'
import { Button, Loading } from '../ui'
import { colors } from '../theme'

// Активність відображається посторінково за елементами (як у вебі):
// без page breaks — кожен елемент окремо; інформаційні елементи не потребують відповіді.
export default function ActivityScreen({ route, navigation }: any) {
  const { deliveryId, activityId, status } = route.params
  const [activity, setActivity] = useState<any | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const done = status === 'completed'

  useEffect(() => {
    api(`/api/client/activities/${activityId}`).then(setActivity).catch(() => setActivity(null))
  }, [activityId])

  if (!activity) return <Loading />

  const setAns = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }))

  const submit = async () => {
    setBusy(true)
    try {
      const responses = Object.entries(answers).map(([elementId, answer]) => ({ elementId, answer }))
      await api(`/api/client/deliveries/${deliveryId}/complete`, { method: 'POST', body: { responses } })
      Alert.alert('Готово', 'Відповіді надіслано вашому психологу.', [{ text: 'OK', onPress: () => navigation.goBack() }])
    } catch {
      Alert.alert('Помилка', 'Не вдалося надіслати. Спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  const visible = activity.elements.filter((e: any) => e.type !== 'pageBreak')

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{activity.title}</Text>
      {activity.description ? <Text style={styles.desc}>{activity.description}</Text> : null}

      {visible.map((el: any) => (
        <View key={el.id} style={styles.block}>
          {el.type === 'section' ? (
            <Text style={styles.section}>{el.title}</Text>
          ) : el.type === 'text' ? (
            <Text style={styles.info}>{el.title}</Text>
          ) : el.type === 'video' || el.type === 'image' ? (
            <View style={styles.media}>
              <Text style={styles.mediaIcon}>{el.type === 'video' ? '🎬' : '🖼️'}</Text>
              <Text style={styles.mediaText}>{el.title}</Text>
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>{el.title}</Text>
              {done ? (
                <Text style={styles.answerRO}>{answers[el.id] || '—'}</Text>
              ) : el.type === 'multipleChoice' ? (
                <View>
                  {(el.options ?? []).map((opt: string) => {
                    const sel = answers[el.id] === opt
                    return (
                      <Pressable key={opt} onPress={() => setAns(el.id, opt)} style={[styles.option, sel && styles.optionSel]}>
                        <View style={[styles.radio, sel && styles.radioSel]} />
                        <Text style={[styles.optionText, sel && { color: colors.brandDark, fontWeight: '600' }]}>{opt}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : el.type === 'scale' ? (
                <View style={styles.scaleRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const sel = answers[el.id] === String(n)
                    return (
                      <Pressable key={n} onPress={() => setAns(el.id, String(n))} style={[styles.scaleDot, sel && styles.scaleDotSel]}>
                        <Text style={[styles.scaleNum, sel && { color: '#fff' }]}>{n}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <TextInput
                  style={[styles.input, el.type === 'longAnswer' && { height: 96, textAlignVertical: 'top' }]}
                  multiline={el.type === 'longAnswer'}
                  value={answers[el.id] ?? ''}
                  onChangeText={(v) => setAns(el.id, v)}
                  placeholder="Ваша відповідь…"
                  placeholderTextColor={colors.faint}
                />
              )}
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 8 }} />
      {done ? (
        <Text style={styles.doneNote}>Активність завершено. Дякуємо!</Text>
      ) : (
        <Button title="Надіслати відповіді" onPress={submit} loading={busy} />
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.sub, marginTop: 6, marginBottom: 6, lineHeight: 20 },
  block: { marginTop: 14 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  info: { fontSize: 14, color: colors.sub, lineHeight: 20, backgroundColor: colors.brandSoft, padding: 12, borderRadius: 12 },
  media: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, alignItems: 'center' },
  mediaIcon: { fontSize: 28 },
  mediaText: { fontSize: 13, color: colors.sub, marginTop: 6, textAlign: 'center' },
  field: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
  answerRO: { fontSize: 15, color: colors.text, backgroundColor: colors.bg, padding: 12, borderRadius: 10 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  optionSel: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.faint, marginRight: 10 },
  radioSel: { borderColor: colors.brand, backgroundColor: colors.brand },
  optionText: { fontSize: 15, color: colors.text, flex: 1 },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scaleDot: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  scaleDotSel: { backgroundColor: colors.brand, borderColor: colors.brand },
  scaleNum: { fontSize: 14, fontWeight: '600', color: colors.text },
  doneNote: { textAlign: 'center', color: colors.green, fontWeight: '600', fontSize: 15 },
})
