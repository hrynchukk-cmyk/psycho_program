import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError, tokenStore } from './api'
import { clearPushToken } from './notifications'

export interface ClientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  practitioner: string | null
}

interface AuthCtx {
  ready: boolean
  user: ClientProfile | null
  login: (email: string, password: string) => Promise<void>
  claim: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<ClientProfile | null>(null)

  useEffect(() => {
    ;(async () => {
      const token = await tokenStore.get()
      if (token) {
        try {
          setUser(await api<ClientProfile>('/api/client/me'))
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) await tokenStore.clear()
        }
      }
      setReady(true)
    })()
  }, [])

  const afterToken = async (token: string) => {
    await tokenStore.set(token)
    setUser(await api<ClientProfile>('/api/client/me'))
  }

  const login: AuthCtx['login'] = async (email, password) => {
    const resp = await api<{ token: string; user: { role: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    if (resp.user.role !== 'CLIENT') {
      throw new ApiError(403, 'Цей застосунок призначений для клієнтів. Скористайтесь акаунтом, на який вас запросили.')
    }
    await afterToken(resp.token)
  }

  const claim: AuthCtx['claim'] = async (email, password) => {
    const resp = await api<{ token: string }>('/api/auth/client/claim', {
      method: 'POST',
      body: { email, password },
    })
    await afterToken(resp.token)
  }

  const logout = async () => {
    await clearPushToken() // прибрати токен на сервері (поки ще авторизовані)
    await tokenStore.clear()
    setUser(null)
  }

  return <Ctx.Provider value={{ ready, user, login, claim, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
