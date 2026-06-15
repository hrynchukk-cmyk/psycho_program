import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../api'
import { useAuth } from '../auth'
import { Card, Empty, Loading, Pill } from '../ui'
import { colors } from '../theme'

const statusPill = (s: string) => {
  if (s === 'completed') return <Pill text="Завершено" bg={colors.greenSoft} color={colors.green} />
  if (s === 'inProgress') return <Pill text="В процесі" bg={colors.blueSoft} color={colors.blueText} />
  return <Pill text="Нове" bg={colors.amberSoft} color={colors.amber} />
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

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!items) return <Loading />

  const programs = items.filter((i) => i.kind === 'program')
  const activities = items.filter((i) => i.kind === 'activity')

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.hello}>Вітаємо, {user?.firstName}! 👋</Text>
      <Text style={styles.sub}>Ваш простір з вправами та програмами{user?.practitioner ? ` від ${user.practitioner}` : ''}.</Text>

      {programs.length > 0 && <Text style={styles.section}>Програми</Text>}
      {programs.map((d) => (
        <Pressable key={d.id} onPress={() => navigation.navigate('Program', { delivery: d })}>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>🗺️</Text>
              </View>
              {statusPill(d.status)}
            </View>
            <Text style={styles.cardTitle}>{d.program?.title ?? 'Програма'}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{d.program?.description}</Text>
            <Text style={styles.meta}>{d.program?.steps?.length ?? 0} кроків · натисніть, щоб відкрити</Text>
          </Card>
        </Pressable>
      ))}

      {activities.length > 0 && <Text style={styles.section}>Активності</Text>}
      {activities.map((d) => (
        <Pressable key={d.id} onPress={() => navigation.navigate('Activity', { deliveryId: d.id, activityId: d.activity?.id, status: d.status })}>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>📝</Text>
              </View>
              {statusPill(d.status)}
            </View>
            <Text style={styles.cardTitle}>{d.activity?.title ?? 'Активність'}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{d.activity?.description}</Text>
            <Text style={styles.meta}>
              {(d.activity?.elements?.filter((e: any) => e.type !== 'pageBreak').length ?? 0)} елементів
            </Text>
          </Card>
        </Pressable>
      ))}

      {items.length === 0 && (
        <Empty title="Поки що немає завдань" hint="Коли психолог надішле вам активність чи програму, вона зʼявиться тут." />
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hello: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.sub, marginTop: 4, marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', marginTop: 18, marginBottom: 8, letterSpacing: 0.5 },
  card: { marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.sub, marginTop: 3, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.faint, marginTop: 10 },
})
