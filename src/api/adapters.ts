// Перетворення між форматом бекенду (enum-и у ВЕРХНЬОМУ регістрі, вкладені
// зв'язки) і типами фронтенду (рядки в нижньому регістрі, плоскі масиви id).
import type {
  Activity,
  ActivityElement,
  Client,
  ClientStatus,
  Delivery,
  DeliveryMode,
  DeliveryStatus,
  ElementType,
  Group,
  JournalEntry,
  Mood,
  Note,
  Program,
  ProgramStep,
  ResourceItem,
  Task,
  ThreadComment,
} from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const lower = (s: string) => s.toLowerCase()

const ELEMENT_TO_API: Record<ElementType, string> = {
  section: 'SECTION',
  text: 'TEXT',
  shortAnswer: 'SHORT_ANSWER',
  longAnswer: 'LONG_ANSWER',
  multipleChoice: 'MULTIPLE_CHOICE',
  scale: 'SCALE',
  video: 'VIDEO',
  image: 'IMAGE',
  pageBreak: 'PAGE_BREAK',
  breathing: 'BREATHING',
}
const ELEMENT_FROM_API = Object.fromEntries(
  Object.entries(ELEMENT_TO_API).map(([k, v]) => [v, k]),
) as Record<string, ElementType>

const MODE_TO_API: Record<DeliveryMode, string> = {
  immediately: 'IMMEDIATELY',
  afterPrevious: 'AFTER_PREVIOUS',
  afterStart: 'AFTER_START',
}
const MODE_FROM_API = Object.fromEntries(
  Object.entries(MODE_TO_API).map(([k, v]) => [v, k]),
) as Record<string, DeliveryMode>

export const toApiStatus = (s: ClientStatus) => s.toUpperCase()
export const toApiMood = (m: Mood) => m.toUpperCase()
export const toApiElementType = (t: ElementType) => ELEMENT_TO_API[t]
export const toApiMode = (m: DeliveryMode) => MODE_TO_API[m]

export const adaptClient = (c: any): Client => ({
  id: c.id,
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  status: lower(c.status) as ClientStatus,
  createdAt: c.createdAt,
})

export const adaptGroup = (g: any): Group => ({
  id: g.id,
  name: g.name,
  description: g.description ?? '',
  memberIds: (g.members ?? []).map((m: any) => m.clientId),
  autoSendEnabled: g.autoSendEnabled,
  autoSendActivityIds: g.autoSendActivityIds ?? [],
  autoSendProgramIds: g.autoSendProgramIds ?? [],
  createdAt: g.createdAt,
})

const adaptElement = (e: any): ActivityElement => ({
  id: e.id,
  type: ELEMENT_FROM_API[e.type],
  title: e.title ?? '',
  options: e.options && e.options.length ? e.options : undefined,
})

export const adaptActivity = (a: any): Activity => ({
  id: a.id,
  title: a.title,
  description: a.description ?? '',
  elements: (a.elements ?? []).map(adaptElement),
  pageBreaksEnabled: a.pageBreaksEnabled,
  isPremade: a.isPremade,
  category: a.category ?? undefined,
  updatedAt: a.updatedAt,
})

const adaptStep = (s: any): ProgramStep => ({
  id: s.id,
  activityId: s.activityId,
  mode: MODE_FROM_API[s.mode],
  days: s.days,
})

export const adaptProgram = (p: any): Program => ({
  id: p.id,
  title: p.title,
  description: p.description ?? '',
  steps: (p.steps ?? []).map(adaptStep),
  isPremade: p.isPremade,
  updatedAt: p.updatedAt,
})

export const adaptResource = (r: any): ResourceItem => ({
  id: r.id,
  kind: lower(r.kind) as 'file' | 'link',
  name: r.name,
  url: r.url ?? undefined,
  fileType: r.fileType ?? undefined,
  size: r.size ?? undefined,
  sharedWithClientIds: (r.shares ?? []).map((s: any) => s.clientId),
  createdAt: r.createdAt,
})

export const adaptTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  description: t.description ?? undefined,
  clientId: t.clientId ?? null,
  dueDate: t.dueDate ?? undefined,
  done: t.done,
  createdAt: t.createdAt,
})

export const adaptNote = (n: any): Note => ({
  id: n.id,
  title: n.title,
  body: n.body ?? '',
  clientId: n.clientId ?? null,
  createdAt: n.createdAt,
})

export const adaptJournal = (j: any): JournalEntry => ({
  id: j.id,
  clientId: j.clientId,
  date: j.date,
  mood: lower(j.mood) as Mood,
  title: j.title ?? undefined,
  body: j.body,
  tags: j.tags ?? [],
  reviewed: j.reviewed,
  reply: j.reply ?? undefined,
  createdAt: j.createdAt,
  audio: j.audio ?? null,
  transcript: j.transcript ?? undefined,
  transcriptStatus: j.transcriptStatus ?? null,
})

export const adaptComment = (c: any): ThreadComment => ({
  id: c.id,
  deliveryId: c.deliveryId,
  elementId: c.elementId ?? null,
  author: lower(c.author) as 'practitioner' | 'client',
  text: c.text,
  createdAt: c.createdAt,
})

export const adaptDelivery = (d: any): Delivery => ({
  id: d.id,
  kind: lower(d.kind) as 'activity' | 'program',
  refId: d.refId,
  clientId: d.clientId,
  sentAt: d.sentAt,
  status: (d.status === 'IN_PROGRESS' ? 'inProgress' : lower(d.status)) as DeliveryStatus,
  completedAt: d.completedAt ?? undefined,
  responses: d.responses ?? undefined,
})
