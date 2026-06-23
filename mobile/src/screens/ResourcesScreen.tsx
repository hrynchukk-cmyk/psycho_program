import React, { useCallback, useState } from 'react'
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../api'
import { Card, Empty, Loading } from '../ui'
import { colors, serif } from '../theme'

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
          <Card style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', padding: 11 }}>
            <View style={[styles.iconBox, { backgroundColor: r.kind === 'link' ? colors.linkTile : colors.fileTile }]}>
              <Text style={styles.icon}>{r.kind === 'link' ? '🔗' : '📄'}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>{r.kind === 'link' ? r.url : `${r.fileType ?? 'Файл'}${r.size ? ' · ' + r.size : ''}`}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </Pressable>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontFamily: serif, color: colors.text },
  sub: { fontSize: 14, color: colors.sub, marginTop: 4 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  icon: { fontSize: 18 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.faint, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.faint, marginLeft: 8 },
})
