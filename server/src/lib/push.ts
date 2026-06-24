import { prisma } from './prisma.js'

interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
}

// Валідний Expo push-токен має характерний префікс.
const isExpoToken = (t?: string | null): t is string =>
  !!t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))

// Надсилає одне сповіщення через Expo Push API. Тихо ігнорує помилки —
// пуш ніколи не має ламати основний запит.
export async function sendExpoPush(token: string, payload: PushPayload): Promise<void> {
  if (!isExpoToken(token)) return
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    })
  } catch (e) {
    console.error('Expo push send failed:', e)
  }
}

// Сповістити клієнта за його id. Якщо токена немає — нічого не робить.
// Викликати без await (fire-and-forget): void notifyClient(...).
export async function notifyClient(clientId: string, payload: PushPayload): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { expoPushToken: true },
    })
    if (client?.expoPushToken) await sendExpoPush(client.expoPushToken, payload)
  } catch (e) {
    console.error('notifyClient failed:', e)
  }
}
