import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { api, API_BASE, tokenStore } from '../api'
import { Button, Card, Empty, Loading } from '../ui'
import { colors, formatDateTime, moods, moodMeta } from '../theme'
import { useVoiceRecorder, readBase64, formatClock } from '../useVoiceRecorder'

// Відтворення голосової нотатки (захищене аудіо — з токеном у заголовках).
function VoiceNote({ entryId, durationSec }: { entryId: string; durationSec?: number }) {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    tokenStore.get().then(setToken)
  }, [])
  const source = useMemo(
    () => (token ? { uri: `${API_BASE}/api/journal/${entryId}/audio`, headers: { Authorization: `Bearer ${token}` } } : null),
    [token, entryId],
  )
  const player = useAudioPlayer(source)
  const status = useAudioPlayerStatus(player)
  const playing = status?.playing ?? false

  return (
    <Pressable
      style={styles.voiceNote}
      onPress={() => {
        if (playing) player.pause()
        else {
          if ((status?.currentTime ?? 0) >= (status?.duration ?? 1) - 0.1) player.seekTo(0)
          player.play()
        }
      }}
    >
      <View style={styles.playBtn}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶︎'}</Text>
      </View>
      <Text style={styles.voiceText}>Голосова нотатка{durationSec ? ` · ${durationSec} с` : ''}</Text>
    </Pressable>
  )
}

function TranscriptBlock({ status, text }: { status?: string | null; text?: string }) {
  if (!status && !text) return null
  return (
    <View style={styles.transcript}>
      <Text style={styles.transcriptLabel}>Транскрипція</Text>
      {status === 'pending' && !text ? (
        <Text style={styles.transcriptPending}>Розшифровуємо аудіо…</Text>
      ) : status === 'failed' && !text ? (
        <Text style={styles.transcriptPending}>Транскрипцію не виконано.</Text>
      ) : (
        <Text style={styles.transcriptText}>{text}</Text>
      )}
    </View>
  )
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<any[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [mood, setMood] = useState('good')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [recorded, setRecorded] = useState<{ uri: string; durationSec: number } | null>(null)
  const recorder = useVoiceRecorder()

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

  const toggleRecord = async () => {
    if (recorder.isRecording) {
      const result = await recorder.stop()
      if (result) setRecorded(result)
    } else {
      const ok = await recorder.start()
      if (!ok) Alert.alert('Потрібен доступ до мікрофона', 'Дозвольте доступ у налаштуваннях, щоб записувати голосові нотатки.')
    }
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setMood('good')
    setRecorded(null)
    setAdding(false)
  }

  const save = async () => {
    if (!body.trim() && !recorded) return
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        mood: mood.toUpperCase(),
        title: title.trim() || undefined,
        body: body.trim(),
        tags: [],
      }
      if (recorded) {
        payload.audioBase64 = await readBase64(recorded.uri)
        payload.audioMime = 'audio/m4a'
        payload.audioDurationSec = recorded.durationSec
      }
      await api('/api/journal', { method: 'POST', body: payload })
      resetForm()
      await load()
    } catch {
      Alert.alert('Помилка', 'Не вдалося зберегти запис. Спробуйте ще раз.')
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

          {/* Голосовий запис */}
          {recorded ? (
            <View style={styles.recordedRow}>
              <Text style={styles.recordedText}>🎙 Запис готовий · {recorded.durationSec} с</Text>
              <Pressable onPress={() => setRecorded(null)} hitSlop={8}>
                <Text style={styles.recordedRemove}>Видалити</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={toggleRecord} style={[styles.recordBtn, recorder.isRecording && styles.recordBtnActive]}>
              <View style={[styles.recordDot, recorder.isRecording && styles.recordDotActive]} />
              <Text style={[styles.recordText, recorder.isRecording && { color: colors.danger }]}>
                {recorder.isRecording ? `Запис… ${formatClock(recorder.durationMillis)} — натисніть, щоб зупинити` : 'Записати голосову нотатку'}
              </Text>
            </Pressable>
          )}

          <View style={styles.formActions}>
            <View style={{ flex: 1 }}>
              <Button title="Скасувати" variant="ghost" onPress={resetForm} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Зберегти" onPress={save} loading={busy} disabled={!body.trim() && !recorded} />
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
            {e.body ? <Text style={styles.entryBody}>{e.body}</Text> : null}
            {e.audio ? <VoiceNote entryId={e.id} durationSec={e.audio.durationSec} /> : null}
            {e.transcript || e.transcriptStatus ? <TranscriptBlock status={e.transcriptStatus} text={e.transcript} /> : null}
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
  // Запис у формі
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 10 },
  recordBtnActive: { borderColor: colors.danger, backgroundColor: '#fef2f2' },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger },
  recordDotActive: { opacity: 0.9 },
  recordText: { fontSize: 14, color: colors.text, flex: 1 },
  recordedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.brandSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 10 },
  recordedText: { fontSize: 14, color: colors.brandDark, fontWeight: '600' },
  recordedRemove: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  // Голосова нотатка у записі
  voiceNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 10, padding: 10, marginTop: 10 },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 14 },
  voiceText: { fontSize: 13, color: colors.sub, fontWeight: '500' },
  transcript: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  transcriptLabel: { fontSize: 12, fontWeight: '700', color: colors.faint, marginBottom: 3 },
  transcriptPending: { fontSize: 13, color: colors.faint, fontStyle: 'italic' },
  transcriptText: { fontSize: 14, color: colors.text, lineHeight: 19 },
})
