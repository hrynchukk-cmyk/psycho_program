import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../api'
import { Button, Card, Loading } from '../ui'
import BreathingExercise from '../components/BreathingExercise'
import CardDeck from '../components/CardDeck'
import { colors } from '../theme'

// Активність відображається за елементами; інформаційні елементи не потребують відповіді.
export default function ActivityScreen({ route, navigation }: any) {
  const { deliveryId, activityId, status } = route.params
  const [activity, setActivity] = useState<any | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [breathing, setBreathing] = useState<{ pattern: number[]; title: string } | null>(null)
  const [deck, setDeck] = useState<{ cards: string[]; title: string } | null>(null)
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
      // Зі звичайної доставки — за її id; з кроку програми (без deliveryId) — за activityId.
      const path = deliveryId
        ? `/api/client/deliveries/${deliveryId}/complete`
        : `/api/client/activities/${activityId}/complete`
      await api(path, { method: 'POST', body: { responses } })
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
      <Card style={{ marginBottom: 4 }}>
        <Text style={styles.kicker}>Активність</Text>
        <Text style={styles.title}>{activity.title}</Text>
        {activity.description ? <Text style={styles.desc}>{activity.description}</Text> : null}
      </Card>

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
          ) : el.type === 'breathing' ? (
            <Pressable
              style={styles.breath}
              onPress={() =>
                setBreathing({
                  pattern: (el.options ?? []).map((s: string) => Number(s)).filter((n: number) => !isNaN(n)),
                  title: el.title || 'Дихальна вправа',
                })
              }
            >
              <Text style={styles.breathIcon}>🫁</Text>
              <Text style={styles.breathTitle}>{el.title || 'Дихальна вправа'}</Text>
              <Text style={styles.breathHint}>Керована анімація з голосом · натисніть, щоб почати</Text>
              <View style={styles.breathBtn}>
                <Text style={styles.breathBtnText}>Почати вправу</Text>
              </View>
            </Pressable>
          ) : el.type === 'cards' ? (
            <Pressable
              style={styles.deck}
              onPress={() => setDeck({ cards: (el.options ?? []).filter((c: string) => c.trim()), title: el.title || 'Колода карток' })}
            >
              <Text style={styles.deckIcon}>🃏</Text>
              <Text style={styles.breathTitle}>{el.title || 'Колода карток'}</Text>
              <Text style={styles.breathHint}>{(el.options ?? []).filter((c: string) => c.trim()).length} карток · гортайте й розмірковуйте</Text>
              <View style={styles.breathBtn}>
                <Text style={styles.breathBtnText}>Відкрити колоду</Text>
              </View>
            </Pressable>
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
                        <View style={[styles.radio, sel && styles.radioSel]}>{sel ? <View style={styles.radioInner} /> : null}</View>
                        <Text style={[styles.optionText, sel && { color: colors.brand, fontWeight: '600' }]}>{opt}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : el.type === 'scale' ? (
                <View style={styles.scaleRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const sel = answers[el.id] === String(n)
                    return (
                      <Pressable key={n} onPress={() => setAns(el.id, String(n))} style={[styles.scaleCell, sel && styles.scaleCellSel]}>
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

      <View style={{ height: 14 }} />
      {done ? (
        <Text style={styles.doneNote}>Активність завершено. Дякуємо!</Text>
      ) : (
        <Button title="Надіслати відповіді" onPress={submit} loading={busy} />
      )}
      <View style={{ height: 28 }} />

      <BreathingExercise
        visible={!!breathing}
        pattern={breathing?.pattern.length ? breathing.pattern : [4, 7, 8]}
        title={breathing?.title}
        onClose={() => setBreathing(null)}
      />
      <CardDeck visible={!!deck} cards={deck?.cards ?? []} title={deck?.title} onClose={() => setDeck(null)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  kicker: { fontSize: 10, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  desc: { fontSize: 13, color: colors.sub, marginTop: 5, lineHeight: 19 },
  block: { marginTop: 12 },
  section: { fontSize: 11, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 6, marginBottom: 2 },
  info: { fontSize: 13, color: colors.brandSoftText, lineHeight: 19, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brandSoftBorder, padding: 12, borderRadius: 10 },
  media: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, alignItems: 'center' },
  mediaIcon: { fontSize: 28 },
  mediaText: { fontSize: 13, color: colors.sub, marginTop: 6, textAlign: 'center' },
  breath: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brandSoftBorder, borderRadius: 14, padding: 18, alignItems: 'center' },
  breathIcon: { fontSize: 34 },
  breathTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' },
  breathHint: { fontSize: 12, color: colors.sub, marginTop: 4, textAlign: 'center' },
  breathBtn: { backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 32, marginTop: 14 },
  breathBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deck: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 18, alignItems: 'center' },
  deckIcon: { fontSize: 34 },
  field: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10, lineHeight: 20 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
  answerRO: { fontSize: 15, color: colors.text, backgroundColor: colors.bg, padding: 12, borderRadius: 10 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: 9, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 7 },
  optionSel: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db', marginRight: 9, alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: colors.brand, backgroundColor: colors.brand },
  radioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  optionText: { fontSize: 14, color: colors.text2, flex: 1 },
  scaleRow: { flexDirection: 'row', gap: 3 },
  scaleCell: { flex: 1, height: 34, borderRadius: 6, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  scaleCellSel: { backgroundColor: colors.brand, borderColor: colors.brand },
  scaleNum: { fontSize: 12, fontWeight: '700', color: colors.text2 },
  doneNote: { textAlign: 'center', color: colors.green, fontWeight: '600', fontSize: 15 },
})
