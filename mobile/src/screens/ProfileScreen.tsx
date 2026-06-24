import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useAuth } from '../auth'
import { Card } from '../ui'
import { Avatar } from '../components/Logo'
import { colors, serif } from '../theme'
import { getReminderPref, setJournalReminder, type ReminderPref } from '../notifications'

const TIME_PRESETS = [
  { hour: 9, minute: 0, label: '09:00' },
  { hour: 13, minute: 0, label: '13:00' },
  { hour: 18, minute: 0, label: '18:00' },
  { hour: 20, minute: 0, label: '20:00' },
  { hour: 21, minute: 0, label: '21:00' },
]

function NotificationsCard() {
  const [pref, setPref] = useState<ReminderPref>({ enabled: false, hour: 20, minute: 0 })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getReminderPref().then(setPref)
  }, [])

  const apply = async (next: ReminderPref) => {
    setBusy(true)
    const prev = pref
    setPref(next)
    const ok = await setJournalReminder(next)
    if (!ok && next.enabled) {
      setPref(prev)
      Alert.alert('Потрібен дозвіл', 'Дозвольте сповіщення в налаштуваннях телефону, щоб отримувати нагадування.')
    }
    setBusy(false)
  }

  return (
    <Card style={{ marginTop: 12 }}>
      <View style={styles.notifHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>🔔 Нагадування про щоденник</Text>
          <Text style={styles.notifSub}>Щоденне сповіщення, щоб не забути зробити запис</Text>
        </View>
        <Switch
          value={pref.enabled}
          disabled={busy}
          onValueChange={(v) => apply({ ...pref, enabled: v })}
          trackColor={{ true: colors.gold }}
          thumbColor="#fff"
        />
      </View>
      {pref.enabled && (
        <View style={styles.timeRow}>
          {TIME_PRESETS.map((t) => {
            const sel = pref.hour === t.hour && pref.minute === t.minute
            return (
              <Pressable
                key={t.label}
                onPress={() => apply({ ...pref, hour: t.hour, minute: t.minute })}
                style={[styles.timeChip, sel && styles.timeChipSel]}
              >
                <Text style={[styles.timeChipText, sel && { color: colors.brandDark, fontWeight: '800' }]}>{t.label}</Text>
              </Pressable>
            )
          })}
        </View>
      )}
    </Card>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : ''

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Шапка профілю */}
      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Avatar initials={initials} size={64} />
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      {/* Інформація */}
      {user?.practitioner ? (
        <Card style={{ marginTop: 12, padding: 0 }}>
          <View style={styles.row}>
            <View style={[styles.rowTile, { backgroundColor: colors.goldSoft }]}>
              <Text style={styles.rowIcon}>🧑‍⚕️</Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>ВАШ ПСИХОЛОГ</Text>
              <Text style={styles.rowValue}>{user.practitioner}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Сповіщення */}
      <NotificationsCard />

      {/* Вихід */}
      <Card style={{ marginTop: 12, padding: 0 }}>
        <Pressable style={styles.logoutRow} onPress={logout}>
          <View style={styles.logoutLeft}>
            <View style={[styles.rowTile, { backgroundColor: colors.dangerSoft }]}>
              <Text style={styles.rowIcon}>🚪</Text>
            </View>
            <Text style={styles.logoutText}>Вийти</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Card>

      <Text style={styles.version}>Psycho Program · клієнтський застосунок</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontFamily: serif, color: colors.text, marginTop: 12 },
  email: { fontSize: 13, color: colors.sub, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  rowTile: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 15 },
  rowLabel: { fontSize: 10, color: colors.eyebrow, marginBottom: 2, letterSpacing: 0.8, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  chevron: { fontSize: 20, color: colors.faint },
  version: { textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 24 },
  notifHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  notifSub: { fontSize: 12, color: colors.sub, marginTop: 2, lineHeight: 16 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  timeChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: colors.inputBg },
  timeChipSel: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  timeChipText: { fontSize: 13, fontWeight: '600', color: colors.text2 },
})
