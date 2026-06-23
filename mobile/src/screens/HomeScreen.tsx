import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../api'
import { useAuth } from '../auth'
import { Card, Empty, Loading, Pill } from '../ui'
import { Avatar } from '../components/Logo'
import { colors, serif } from '../theme'

const statusPill = (s: string) => {
  if (s === 'completed') return <Pill text="Завершено" bg={colors.greenSoft} color={colors.green} />
  if (s === 'inProgress') return <Pill text="В процесі" bg={colors.brandSoft} color={colors.brand} />
  return <Pill text="Нове" bg={colors.goldSoft} color={colors.eyebrow} />
}

function ItemCard({ icon, tint, status, title, desc, meta, onPress }: any) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={[styles.iconTile, { backgroundColor: tint }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.pillRow}>{statusPill(status)}</View>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          {desc ? <Text style={styles.cardDesc} numberOfLines={1}>{desc}</Text> : null}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </Card>
    </Pressable>
  )
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth()
  const [items, setItems] = useState<any[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await api('/api/client/deliveries'))
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

  const programs = items.filter((i) => i.kind === 'program')
  const activities = items.filter((i) => i.kind === 'activity')
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : '·'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.hello}>Вітаємо, {user?.firstName}</Text>
          {user?.practitioner ? <Text style={styles.headerSub}>Психолог: {user.practitioner}</Text> : null}
        </View>
        <Avatar initials={initials} size={44} />
      </Card>

      {programs.length > 0 && <Text style={styles.section}>Програми</Text>}
      {programs.map((d) => (
        <ItemCard
          key={d.id}
          icon="🧘"
          tint={colors.goldSoft}
          status={d.status}
          title={d.program?.title ?? 'Програма'}
          desc={d.program?.description}
          meta={`📋 ${d.program?.steps?.length ?? 0} кроків`}
          onPress={() => navigation.navigate('Program', { delivery: d })}
        />
      ))}

      {activities.length > 0 && <Text style={styles.section}>Активності</Text>}
      {activities.map((d) => (
        <ItemCard
          key={d.id}
          icon="📝"
          tint={colors.brandSoft}
          status={d.status}
          title={d.activity?.title ?? 'Активність'}
          desc={d.activity?.description}
          meta={`${d.activity?.elements?.filter((e: any) => e.type !== 'pageBreak').length ?? 0} елементів`}
          onPress={() => navigation.navigate('Activity', { deliveryId: d.id, activityId: d.activity?.id, status: d.status })}
        />
      ))}

      {items.length === 0 && (
        <Empty title="Поки що немає завдань" hint="Коли психолог надішле вам активність чи програму, вона зʼявиться тут." />
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6, paddingVertical: 16 },
  hello: { fontSize: 22, fontFamily: serif, color: colors.text },
  headerSub: { fontSize: 12, color: colors.sub, marginTop: 4 },
  section: { fontSize: 11, fontWeight: '700', color: colors.eyebrow, textTransform: 'uppercase', marginTop: 18, marginBottom: 8, letterSpacing: 1 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10, padding: 12 },
  iconTile: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 19 },
  pillRow: { flexDirection: 'row', marginBottom: 5 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 12, color: colors.sub, marginTop: 2 },
  meta: { fontSize: 11, color: colors.faint, marginTop: 5 },
})
