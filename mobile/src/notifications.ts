import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './api'
import { navRef } from './navRef'

// Показувати сповіщення навіть коли застосунок відкритий.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const REMINDER_PREF_KEY = 'pp_journal_reminder'
const REMINDER_ID_KEY = 'pp_journal_reminder_id'

export interface ReminderPref {
  enabled: boolean
  hour: number
  minute: number
}
const DEFAULT_PREF: ReminderPref = { enabled: false, hour: 20, minute: 0 }

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Сповіщення',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted || current.status === 'granted') return true
  const req = await Notifications.requestPermissionsAsync()
  return req.granted || req.status === 'granted'
}

// Реєструє пристрій для віддалених пушів і надсилає Expo-токен на бекенд.
// Тихо пропускається в Expo Go / без дозволу / без projectId (потрібен білд).
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return
    if (!(await ensurePermission())) return
    await ensureAndroidChannel()

    const projectId =
      (Constants?.expoConfig as any)?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId
    if (!projectId) return // віддалені пуші доступні лише у dev/standalone-білді з EAS projectId

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    if (token) await api('/api/client/push-token', { method: 'POST', body: { token } }).catch(() => {})
  } catch (e) {
    console.log('Push token registration skipped:', (e as Error)?.message)
  }
}

export async function clearPushToken(): Promise<void> {
  try {
    await api('/api/client/push-token', { method: 'DELETE' }).catch(() => {})
  } catch {
    /* ignore */
  }
}

export async function getReminderPref(): Promise<ReminderPref> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_PREF_KEY)
    if (raw) return { ...DEFAULT_PREF, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_PREF
}

// Вмикає/вимикає щоденне локальне нагадування про щоденник о вказаній годині.
// Повертає true, якщо все вдалося (для enabled потрібен дозвіл на сповіщення).
export async function setJournalReminder(pref: ReminderPref): Promise<boolean> {
  await AsyncStorage.setItem(REMINDER_PREF_KEY, JSON.stringify(pref))

  // Прибрати попереднє заплановане нагадування.
  const prevId = await AsyncStorage.getItem(REMINDER_ID_KEY)
  if (prevId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(prevId)
    } catch {
      /* ignore */
    }
    await AsyncStorage.removeItem(REMINDER_ID_KEY)
  }

  if (!pref.enabled) return true

  try {
    if (!(await ensurePermission())) return false
    await ensureAndroidChannel()
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Щоденник', body: 'Час записати, як минув ваш день 🌿' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: pref.hour,
        minute: pref.minute,
      },
    })
    await AsyncStorage.setItem(REMINDER_ID_KEY, id)
    return true
  } catch (e) {
    console.log('Schedule reminder failed:', (e as Error)?.message)
    return false
  }
}

// Перехід по натисканню на пуш (за полем data.screen).
let listenerAttached = false
export function initNotificationRouting() {
  if (listenerAttached) return
  listenerAttached = true
  Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const screen = (response.notification.request.content.data as any)?.screen
      const target = screen === 'Journal' ? 'Journal' : 'Home'
      if (navRef.isReady()) (navRef as any).navigate('Tabs', { screen: target })
    } catch {
      /* ignore */
    }
  })
}
