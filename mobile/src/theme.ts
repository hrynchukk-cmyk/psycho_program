export const colors = {
  brand: '#3d6bef',
  brandDark: '#274ce4',
  brandSoft: '#eef4ff',
  bg: '#f4f6fb',
  card: '#ffffff',
  text: '#111827',
  sub: '#6b7280',
  faint: '#9ca3af',
  border: '#e5e7eb',
  green: '#059669',
  greenSoft: '#d1fae5',
  amber: '#b45309',
  amberSoft: '#fef3c7',
  blueSoft: '#dbeafe',
  blueText: '#1d4ed8',
  violetSoft: '#ede9fe',
  violetText: '#6d28d9',
  danger: '#dc2626',
}

export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad'

export const moods: { key: Mood; emoji: string; label: string; color: string }[] = [
  { key: 'great', emoji: '😄', label: 'Чудово', color: '#059669' },
  { key: 'good', emoji: '🙂', label: 'Добре', color: '#65a30d' },
  { key: 'neutral', emoji: '😐', label: 'Нейтрально', color: '#6b7280' },
  { key: 'low', emoji: '😟', label: 'Погано', color: '#d97706' },
  { key: 'bad', emoji: '😢', label: 'Дуже погано', color: '#dc2626' },
]

export const moodMeta = (k: string) => moods.find((m) => m.key === k) ?? moods[2]

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : ''

export const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
