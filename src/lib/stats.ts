import type { Activity, Client, Delivery, JournalEntry, Mood, Task } from '../types'

export const MOOD_SCORE: Record<Mood, number> = { bad: 1, low: 2, neutral: 3, good: 4, great: 5 }

const ms = 86400000
export const daysSince = (iso?: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / ms) : Infinity)
const withinDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() <= days * ms

// ---- Рівень практики ----
export function practiceStats(d: {
  clients: Client[]
  deliveries: Delivery[]
  journal: JournalEntry[]
  tasks: Task[]
}) {
  const active = d.clients.filter((c) => c.status === 'active')
  const invited = d.clients.filter((c) => c.status === 'invited')
  const sent7 = d.deliveries.filter((x) => withinDays(x.sentAt, 7))
  const activityDeliveries = d.deliveries.filter((x) => x.kind === 'activity')
  const completed = activityDeliveries.filter((x) => x.status === 'completed')
  const completionPct = activityDeliveries.length
    ? Math.round((completed.length / activityDeliveries.length) * 100)
    : 0
  const unreviewedJournal = d.journal.filter((j) => !j.reviewed).length
  const overdueTasks = d.tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length
  return {
    active: active.length,
    invited: invited.length,
    sent7: sent7.length,
    completionPct,
    completed: completed.length,
    totalActivities: activityDeliveries.length,
    unreviewedJournal,
    overdueTasks,
  }
}

// Останя активність клієнта = найсвіжіший запис журналу або завершена активність.
export function clientLastActive(clientId: string, journal: JournalEntry[], deliveries: Delivery[]): string | null {
  const dates: number[] = []
  journal.forEach((j) => j.clientId === clientId && dates.push(new Date(j.createdAt).getTime()))
  deliveries.forEach(
    (x) => x.clientId === clientId && x.completedAt && dates.push(new Date(x.completedAt).getTime()),
  )
  return dates.length ? new Date(Math.max(...dates)).toISOString() : null
}

export function clientEngagement(clientId: string, journal: JournalEntry[], deliveries: Delivery[]) {
  const entries = journal.filter((j) => j.clientId === clientId)
  const entries7 = entries.filter((j) => withinDays(j.createdAt, 7)).length
  const entries28 = entries.filter((j) => withinDays(j.createdAt, 28)).length
  const acts = deliveries.filter((x) => x.clientId === clientId && x.kind === 'activity')
  const completed = acts.filter((x) => x.status === 'completed').length
  const programs = deliveries.filter((x) => x.clientId === clientId && x.kind === 'program').length
  const lastActive = clientLastActive(clientId, journal, deliveries)
  return {
    entries: entries.length,
    entries7,
    perWeek: Math.round((entries28 / 4) * 10) / 10,
    lastActive,
    lastActiveDays: daysSince(lastActive ?? undefined),
    completed,
    totalActivities: acts.length,
    completionPct: acts.length ? Math.round((completed / acts.length) * 100) : 0,
    programs,
  }
}

// Клієнти, що «затихли»: немає активності понад `days` днів (серед активних).
export function atRiskClients(clients: Client[], journal: JournalEntry[], deliveries: Delivery[], days = 7) {
  return clients
    .filter((c) => c.status === 'active')
    .map((c) => ({ client: c, lastActive: clientLastActive(c.id, journal, deliveries) }))
    .filter((x) => daysSince(x.lastActive ?? undefined) >= days)
    .sort((a, b) => daysSince(a.lastActive ?? undefined) - daysSince(b.lastActive ?? undefined) === 0 ? 0 : daysSince(b.lastActive ?? undefined) - daysSince(a.lastActive ?? undefined))
}

// ---- Настрій ----
export function moodSeries(journal: JournalEntry[], clientId: string) {
  return journal
    .filter((j) => j.clientId === clientId)
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((j) => ({
      date: new Date(j.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }),
      value: MOOD_SCORE[j.mood],
    }))
}

export function moodDistribution(entries: JournalEntry[]) {
  const order: Mood[] = ['great', 'good', 'neutral', 'low', 'bad']
  return order.map((m) => ({ mood: m, count: entries.filter((e) => e.mood === m).length }))
}

export function avgMood(entries: JournalEntry[]): number | null {
  if (!entries.length) return null
  return Math.round((entries.reduce((s, e) => s + MOOD_SCORE[e.mood], 0) / entries.length) * 10) / 10
}

// ---- Шкали: до/після ----
const num = (s?: string) => {
  const n = Number(s)
  return isNaN(n) ? null : n
}

export interface PrePost {
  activityId: string
  activityTitle: string
  count: number
  avgBefore: number
  avgAfter: number
  avgDelta: number
}

// Для кожної активності з парою шкал «…ДО…»/«…ПІСЛЯ…» рахуємо середню зміну.
export function prePostInsights(clientId: string, deliveries: Delivery[], activities: Activity[]): PrePost[] {
  const byActivity = new Map<string, { before: number[]; after: number[]; title: string }>()
  const completed = deliveries.filter(
    (d) => d.clientId === clientId && d.kind === 'activity' && d.status === 'completed' && d.responses,
  )
  for (const d of completed) {
    const act = activities.find((a) => a.id === d.refId)
    if (!act) continue
    const beforeEl = act.elements.find((e) => e.type === 'scale' && /\bДО\b|до вправи/i.test(e.title))
    const afterEl = act.elements.find((e) => e.type === 'scale' && /ПІСЛЯ|після/i.test(e.title))
    if (!beforeEl || !afterEl) continue
    const b = num(d.responses!.find((r) => r.elementId === beforeEl.id)?.answer)
    const a = num(d.responses!.find((r) => r.elementId === afterEl.id)?.answer)
    if (b == null || a == null) continue
    const cur = byActivity.get(act.id) ?? { before: [], after: [], title: act.title }
    cur.before.push(b)
    cur.after.push(a)
    byActivity.set(act.id, cur)
  }
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  return [...byActivity.entries()].map(([activityId, v]) => ({
    activityId,
    activityTitle: v.title,
    count: v.before.length,
    avgBefore: Math.round(avg(v.before) * 10) / 10,
    avgAfter: Math.round(avg(v.after) * 10) / 10,
    avgDelta: Math.round((avg(v.after) - avg(v.before)) * 10) / 10,
  }))
}

// Найпопулярніші теги журналу клієнта.
export function topTags(entries: JournalEntry[], limit = 6) {
  const counts = new Map<string, number>()
  entries.forEach((e) => (e.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}
