import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  Activity,
  Client,
  Delivery,
  Group,
  JournalEntry,
  Note,
  Program,
  ResourceItem,
  Task,
  ThreadComment,
} from '../types'
import { api, ApiError, tokenStore } from '../api/client'
import {
  adaptActivity,
  adaptClient,
  adaptComment,
  adaptDelivery,
  adaptGroup,
  adaptJournal,
  adaptNote,
  adaptProgram,
  adaptResource,
  adaptTask,
  toApiElementType,
  toApiMode,
  toApiMood,
  toApiStatus,
} from '../api/adapters'

// Тимчасові id для нових елементів конструктора (React-ключі до збереження).
let counter = 100
export const uid = (prefix: string) => `${prefix}-${++counter}`

export interface AuthUser {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

interface Store {
  // --- авторизація ---
  ready: boolean
  authenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => void

  // --- дані ---
  clients: Client[]
  groups: Group[]
  activities: Activity[]
  programs: Program[]
  resources: ResourceItem[]
  tasks: Task[]
  notes: Note[]
  deliveries: Delivery[]
  comments: ThreadComment[]
  journal: JournalEntry[]

  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Promise<void>
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>
  addGroup: (g: Omit<Group, 'id' | 'createdAt'>) => Promise<void>
  updateGroup: (id: string, patch: Partial<Group>) => Promise<void>
  addGroupMember: (groupId: string, clientId: string) => Promise<void>
  removeGroupMember: (groupId: string, clientId: string) => Promise<void>
  addActivity: (a: Omit<Activity, 'id' | 'updatedAt'>) => Promise<string>
  updateActivity: (id: string, patch: Partial<Activity>) => void
  saveActivity: (activity: Activity) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  copyPremadeActivity: (id: string) => Promise<string>
  addProgram: (p: Omit<Program, 'id' | 'updatedAt'>) => Promise<string>
  updateProgram: (id: string, patch: Partial<Program>) => void
  saveProgram: (program: Program) => Promise<void>
  deleteProgram: (id: string) => Promise<void>
  copyPremadeProgram: (id: string) => Promise<string>
  addResource: (r: Omit<ResourceItem, 'id' | 'createdAt'>) => Promise<void>
  updateResource: (id: string, patch: Partial<ResourceItem>) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'done'>) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addNote: (n: {
    title: string
    body: string
    clientId: string | null
    audio?: { base64: string; mime: string; durationSec: number } | null
  }) => Promise<void>
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  sendToClients: (kind: 'activity' | 'program', refId: string, clientIds: string[]) => Promise<void>
  addComment: (deliveryId: string, elementId: string | null, text: string) => Promise<void>
  reopenDelivery: (id: string) => Promise<void>
  markJournalReviewed: (id: string, reviewed: boolean) => Promise<void>
  replyToJournal: (id: string, reply: string) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])

  // --- завантаження колекцій ---
  const reloadClients = async () => setClients((await api<any[]>('/api/clients')).map(adaptClient))
  const reloadGroups = async () => setGroups((await api<any[]>('/api/groups')).map(adaptGroup))
  const reloadActivities = async () => setActivities((await api<any[]>('/api/activities')).map(adaptActivity))
  const reloadPrograms = async () => setPrograms((await api<any[]>('/api/programs')).map(adaptProgram))
  const reloadResources = async () => setResources((await api<any[]>('/api/resources')).map(adaptResource))
  const reloadTasks = async () => setTasks((await api<any[]>('/api/tasks')).map(adaptTask))
  const reloadNotes = async () => setNotes((await api<any[]>('/api/notes')).map(adaptNote))
  const reloadJournal = async () => setJournal((await api<any[]>('/api/journal')).map(adaptJournal))
  const reloadDeliveries = async () => {
    const ds = await api<any[]>('/api/deliveries')
    setDeliveries(ds.map(adaptDelivery))
    setComments(ds.flatMap((d) => (d.comments ?? []).map(adaptComment)))
  }

  async function loadAll() {
    await Promise.all([
      reloadClients(),
      reloadGroups(),
      reloadActivities(),
      reloadPrograms(),
      reloadResources(),
      reloadTasks(),
      reloadNotes(),
      reloadJournal(),
      reloadDeliveries(),
    ])
  }

  // Відновлення сесії за збереженим токеном.
  useEffect(() => {
    ;(async () => {
      if (!tokenStore.get()) {
        setReady(true)
        return
      }
      try {
        const me = await api<{ user: AuthUser }>('/api/auth/me')
        setUser(me.user)
        await loadAll()
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) tokenStore.clear()
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const afterAuth = async (resp: { token: string; user: AuthUser }) => {
    tokenStore.set(resp.token)
    setUser(resp.user)
    await loadAll()
  }

  const store: Store = {
    ready,
    authenticated: !!user,
    user,

    login: async (email, password) => {
      const resp = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      await afterAuth(resp)
    },
    register: async (data) => {
      const resp = await api<{ token: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: data,
      })
      await afterAuth(resp)
    },
    logout: () => {
      tokenStore.clear()
      setUser(null)
      setClients([])
      setGroups([])
      setActivities([])
      setPrograms([])
      setResources([])
      setTasks([])
      setNotes([])
      setDeliveries([])
      setComments([])
      setJournal([])
    },

    clients,
    groups,
    activities,
    programs,
    resources,
    tasks,
    notes,
    deliveries,
    comments,
    journal,

    addClient: async (c) => {
      await api('/api/clients', { method: 'POST', body: { firstName: c.firstName, lastName: c.lastName, email: c.email } })
      await reloadClients()
    },
    updateClient: async (id, patch) => {
      const body: Record<string, unknown> = { ...patch }
      if (patch.status) body.status = toApiStatus(patch.status)
      await api(`/api/clients/${id}`, { method: 'PATCH', body })
      await reloadClients()
    },

    addGroup: async (g) => {
      await api('/api/groups', { method: 'POST', body: { name: g.name, description: g.description } })
      await reloadGroups()
    },
    updateGroup: async (id, patch) => {
      await api(`/api/groups/${id}`, { method: 'PATCH', body: patch })
      await reloadGroups()
    },
    addGroupMember: async (groupId, clientId) => {
      await api(`/api/groups/${groupId}/members`, { method: 'POST', body: { clientId } })
      await Promise.all([reloadGroups(), reloadDeliveries()])
    },
    removeGroupMember: async (groupId, clientId) => {
      await api(`/api/groups/${groupId}/members/${clientId}`, { method: 'DELETE' })
      await reloadGroups()
    },

    addActivity: async (a) => {
      const created = await api<any>('/api/activities', {
        method: 'POST',
        body: {
          title: a.title,
          description: a.description,
          pageBreaksEnabled: a.pageBreaksEnabled,
          elements: a.elements.map((e) => ({ type: toApiElementType(e.type), title: e.title, options: e.options ?? [] })),
        },
      })
      const activity = adaptActivity(created)
      setActivities((xs) => [activity, ...xs])
      return activity.id
    },
    // Локальне редагування чернетки конструктора (без запиту). Збереження — saveActivity.
    updateActivity: (id, patch) =>
      setActivities((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    saveActivity: async (activity) => {
      const updated = await api<any>(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        body: {
          title: activity.title,
          description: activity.description,
          pageBreaksEnabled: activity.pageBreaksEnabled,
          elements: activity.elements.map((e) => ({ type: toApiElementType(e.type), title: e.title, options: e.options ?? [] })),
        },
      })
      const next = adaptActivity(updated)
      setActivities((xs) => xs.map((x) => (x.id === next.id ? next : x)))
    },
    deleteActivity: async (id) => {
      await api(`/api/activities/${id}`, { method: 'DELETE' })
      setActivities((xs) => xs.filter((x) => x.id !== id))
    },
    copyPremadeActivity: async (id) => {
      const created = adaptActivity(await api<any>(`/api/activities/${id}/copy`, { method: 'POST' }))
      setActivities((xs) => [created, ...xs])
      return created.id
    },

    addProgram: async (p) => {
      const created = adaptProgram(
        await api<any>('/api/programs', { method: 'POST', body: { title: p.title, description: p.description, steps: [] } }),
      )
      setPrograms((xs) => [created, ...xs])
      return created.id
    },
    updateProgram: (id, patch) =>
      setPrograms((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    saveProgram: async (program) => {
      const updated = adaptProgram(
        await api<any>(`/api/programs/${program.id}`, {
          method: 'PATCH',
          body: {
            title: program.title,
            description: program.description,
            steps: program.steps.map((s) => ({ activityId: s.activityId, mode: toApiMode(s.mode), days: s.days })),
          },
        }),
      )
      setPrograms((xs) => xs.map((x) => (x.id === updated.id ? updated : x)))
    },
    deleteProgram: async (id) => {
      await api(`/api/programs/${id}`, { method: 'DELETE' })
      setPrograms((xs) => xs.filter((x) => x.id !== id))
    },
    copyPremadeProgram: async (id) => {
      const created = adaptProgram(await api<any>(`/api/programs/${id}/copy`, { method: 'POST' }))
      setPrograms((xs) => [created, ...xs])
      return created.id
    },

    addResource: async (r) => {
      await api('/api/resources', {
        method: 'POST',
        body: { kind: r.kind.toUpperCase(), name: r.name, url: r.url, fileType: r.fileType, size: r.size },
      })
      await reloadResources()
    },
    updateResource: async (id, patch) => {
      // Єдина редагована властивість ресурсу — список доступу.
      if (patch.sharedWithClientIds) {
        await api(`/api/resources/${id}/shares`, { method: 'PUT', body: { clientIds: patch.sharedWithClientIds } })
        await reloadResources()
      }
    },
    deleteResource: async (id) => {
      await api(`/api/resources/${id}`, { method: 'DELETE' })
      setResources((xs) => xs.filter((x) => x.id !== id))
    },

    addTask: async (t) => {
      await api('/api/tasks', {
        method: 'POST',
        body: { title: t.title, clientId: t.clientId ?? undefined, dueDate: t.dueDate ?? undefined },
      })
      await reloadTasks()
    },
    toggleTask: async (id) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const updated = adaptTask(await api<any>(`/api/tasks/${id}`, { method: 'PATCH', body: { done: !task.done } }))
      setTasks((xs) => xs.map((x) => (x.id === id ? updated : x)))
    },
    deleteTask: async (id) => {
      await api(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks((xs) => xs.filter((x) => x.id !== id))
    },

    addNote: async (n) => {
      const body: Record<string, unknown> = { title: n.title, body: n.body, clientId: n.clientId ?? undefined }
      if (n.audio) {
        body.audioBase64 = n.audio.base64
        body.audioMime = n.audio.mime
        body.audioDurationSec = n.audio.durationSec
      }
      await api('/api/notes', { method: 'POST', body })
      await reloadNotes()
    },
    updateNote: async (id, patch) => {
      await api(`/api/notes/${id}`, { method: 'PATCH', body: patch })
      await reloadNotes()
    },
    deleteNote: async (id) => {
      await api(`/api/notes/${id}`, { method: 'DELETE' })
      setNotes((xs) => xs.filter((x) => x.id !== id))
    },

    sendToClients: async (kind, refId, clientIds) => {
      await api('/api/deliveries', { method: 'POST', body: { kind: kind.toUpperCase(), refId, clientIds } })
      await reloadDeliveries()
    },
    addComment: async (deliveryId, elementId, text) => {
      const created = adaptComment(
        await api<any>(`/api/deliveries/${deliveryId}/comments`, { method: 'POST', body: { elementId, text } }),
      )
      setComments((xs) => [...xs, created])
    },
    reopenDelivery: async (id) => {
      const updated = adaptDelivery(await api<any>(`/api/deliveries/${id}/reopen`, { method: 'POST' }))
      setDeliveries((xs) => xs.map((x) => (x.id === id ? updated : x)))
    },

    markJournalReviewed: async (id, reviewed) => {
      const updated = adaptJournal(await api<any>(`/api/journal/${id}`, { method: 'PATCH', body: { reviewed } }))
      setJournal((xs) => xs.map((x) => (x.id === id ? updated : x)))
    },
    replyToJournal: async (id, reply) => {
      const updated = adaptJournal(await api<any>(`/api/journal/${id}`, { method: 'PATCH', body: { reply } }))
      setJournal((xs) => xs.map((x) => (x.id === id ? updated : x)))
    },
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

export const clientName = (c?: Client) => (c ? `${c.firstName} ${c.lastName}` : '—')
