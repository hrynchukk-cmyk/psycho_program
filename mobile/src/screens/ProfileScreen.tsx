import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../auth'
import { Card } from '../ui'
import { Avatar } from '../components/Logo'
import { colors } from '../theme'

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
            <View style={[styles.rowTile, { backgroundColor: colors.brandSoft }]}>
              <Text style={styles.rowIcon}>🧑‍⚕️</Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>Ваш психолог</Text>
              <Text style={styles.rowValue}>{user.practitioner}</Text>
            </View>
          </View>
        </Card>
      ) : null}

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
  name: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  email: { fontSize: 13, color: colors.sub, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  rowTile: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 15 },
  rowLabel: { fontSize: 10, color: colors.faint, marginBottom: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  chevron: { fontSize: 20, color: '#d1d5db' },
  version: { textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 24 },
})
