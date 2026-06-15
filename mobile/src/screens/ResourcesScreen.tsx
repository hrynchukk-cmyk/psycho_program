import React, { useCallback, useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../api'
import { Card, Empty, Loading } from '../ui'
import { colors } from '../theme'

export default function ResourcesScreen() {
  const [items, setItems] = useState<any[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await api('/api/client/resources'))
    } catch {
      setItems([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!items) return <Loading />

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.h1}>Матеріали</Text>
      <Text style={styles.sub}>Файли та посилання, якими поділився ваш психолог.</Text>
      <View style={{ height: 12 }} />

      {items.length === 0 && <Empty title="Матеріалів поки немає" hint="Коли психолог поділиться файлом чи посиланням, воно зʼявиться тут." />}

      {items.map((r) => (
        <Pressable key={r.id} onPress={() => r.url && Linking.openURL(r.url)}>
          <Card style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{r.kind === 'link' ? '🔗' : '📄'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.meta}>{r.kind === 'link' ? r.url : `${r.fileType ?? 'Файл'}${r.size ? ' · ' + r.size : ''}`}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.sub, marginTop: 4 },
  iconBox: { width: 42, height: 42, borderRadius: 11, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.faint, marginTop: 2 },
})
