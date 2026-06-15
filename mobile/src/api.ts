import AsyncStorage from '@react-native-async-storage/async-storage'

// Адреса бекенду. За замовчуванням — задеплоєний API; для локальної розробки
// задайте EXPO_PUBLIC_API_URL у .env.
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://psycho-program-api.onrender.com').replace(/\/$/, '')
const TOKEN_KEY = 'pp_token'

export const tokenStore = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (t: string) => AsyncStorage.setItem(TOKEN_KEY, t),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface Opts {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
}

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const token = await tokenStore.get()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || `Помилка ${res.status}`)
  return data as T
}
