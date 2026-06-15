import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../auth'
import { Button, Card } from '../ui'
import { colors } from '../theme'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : ''

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.practitioner ? <Text style={styles.practitioner}>Психолог: {user.practitioner}</Text> : null}
      </Card>

      <View style={{ height: 16 }} />
      <Button title="Вийти" variant="secondary" onPress={logout} />
      <Text style={styles.version}>Psycho Program · клієнтський застосунок</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.brandDark },
  name: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 12 },
  email: { fontSize: 14, color: colors.sub, marginTop: 3 },
  practitioner: { fontSize: 13, color: colors.faint, marginTop: 8 },
  version: { textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 24 },
})
