import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../api'
import { Button, Card, Empty, Loading } from '../ui'
import { colors, formatDateTime, moods, moodMeta } from '../theme'

export default function JournalScreen() {
  const [entries, setEntries] = useState<any[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [mood, setMood] = useState('good')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setEntries(await api('/api/journal'))
    } catch {
      setEntries([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const save = async () => {
    if (!body.trim()) return
    setBusy(true)
    try {
      await api('/api/journal', {
        method: 'POST',
        body: { mood: mood.toUpperCase(), title: title.trim() || undefined, body: body.trim(), tags: [] },
      })
      setTitle('')
      setBody('')
      setMood('good')
      setAdding(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!entries) return <Loading />

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Щоденник</Text>
        {!adding && <Button title="+ Запис" variant="secondary" onPress={() => setAdding(true)} />}
      </View>
      <Text style={styles.sub}>Записуйте, як минає ваш день. Психолог бачить ці записи.</Text>

      {adding && (
        <Card style={{ marginTop: 14 }}>
          <Text style={styles.formLabel}>Як ви почуваєтесь?</Text>
          <View style={styles.moodRow}>
            {moods.map((m) => {
              const sel = mood === m.key
              return (
                <Pressable key={m.key} onPress={() => setMood(m.key)} style={[styles.moodBtn, sel && { borderColor: m.color, backgroundColor: '#fff' }]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, sel && { color: m.color, fontWeight: '700' }]}>{m.label}</Text>
                </Pressable>
              )
            })}
          </View>
          <TextInput style={styles.input} placeholder="Заголовок (необовʼязково)" placeholderTextColor={colors.faint} value={title} onChangeText={setTitle} />
          <TextInput
            style={[styles.input, { height: 110, textAlignVertical: 'top', marginTop: 10 }]}
            multiline
            placeholder="Що сьогодні сталося? Що ви відчували?"
            placeholderTextColor={colors.faint}
            value={body}
            onChangeText={setBody}
          />
          <View style={styles.formActions}>
            <View style={{ flex: 1 }}>
              <Button title="Скасувати" variant="ghost" onPress={() => setAdding(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Зберегти" onPress={save} loading={busy} disabled={!body.trim()} />
            </View>
          </View>
        </Card>
      )}

      <View style={{ height: 12 }} />
      {entries.length === 0 && !adding && (
        <Empty title="Записів ще немає" hint="Натисніть «+ Запис», щоб додати перший." />
      )}

      {entries.map((e) => {
        const m = moodMeta(e.mood)
        return (
          <Card key={e.id} style={{ marginBottom: 12 }}>
            <View style={styles.entryHead}>
              <Text style={styles.entryMood}>{m.emoji} <Text style={{ color: m.color, fontWeight: '700' }}>{m.label}</Text></Text>
              <Text style={styles.entryDate}>{formatDateTime(e.createdAt)}</Text>
            </View>
            {e.title ? <Text style={styles.entryTitle}>{e.title}</Text> : null}
            <Text style={styles.entryBody}>{e.body}</Text>
            {e.reply ? (
              <View style={styles.reply}>
                <Text style={styles.replyLabel}>Відповідь психолога</Text>
                <Text style={styles.replyText}>{e.reply}</Text>
              </View>
            ) : null}
          </Card>
        )
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.sub, marginTop: 4 },
  formLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  moodBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', width: '30%' },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 11, color: colors.sub, marginTop: 2 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  entryMood: { fontSize: 14 },
  entryDate: { fontSize: 12, color: colors.faint },
  entryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  entryBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  reply: { marginTop: 12, backgroundColor: colors.brandSoft, borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: colors.brand },
  replyLabel: { fontSize: 12, fontWeight: '700', color: colors.brandDark, marginBottom: 3 },
  replyText: { fontSize: 14, color: colors.text, lineHeight: 19 },
})
