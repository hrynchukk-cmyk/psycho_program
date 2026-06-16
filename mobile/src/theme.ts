export const colors = {
  brand: '#3d6bef',
  brandDark: '#274ce4',
  brandSoft: '#eef4ff',
  brandSoftBorder: '#c7d7fa',
  brandSoftText: '#4060d4',
  bg: '#f4f6fb',
  card: '#ffffff',
  text: '#111827',
  text2: '#374151',
  sub: '#6b7280',
  faint: '#9ca3af',
  hairline: '#f0f1f4',
  border: '#e5e7eb',
  inputBg: '#f9fafb',
  green: '#059669',
  greenSoft: '#d1fae5',
  amber: '#d97706',
  amberSoft: '#fef3c7',
  blueSoft: '#dbeafe',
  blueText: '#1d4ed8',
  violetSoft: '#ede9fe',
  violetText: '#6d28d9',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  fileTile: '#fff7ed',
  linkTile: '#f0fdf4',
}

export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad'

// Кожен настрій: емодзі, повний і короткий підпис, колір тексту й мʼякий фон пігулки.
export const moods: { key: Mood; emoji: string; label: string; short: string; color: string; soft: string }[] = [
  { key: 'great', emoji: '😄', label: 'Чудово', short: 'Чудово', color: '#059669', soft: '#d1fae5' },
  { key: 'good', emoji: '🙂', label: 'Добре', short: 'Добре', color: '#65a30d', soft: '#ecfccb' },
  { key: 'neutral', emoji: '😐', label: 'Нейтрально', short: 'Нейтр.', color: '#6b7280', soft: '#f3f4f6' },
  { key: 'low', emoji: '😟', label: 'Погано', short: 'Погано', color: '#d97706', soft: '#fef3c7' },
  { key: 'bad', emoji: '😢', label: 'Дуже погано', short: 'Дуже пог.', color: '#dc2626', soft: '#fee2e2' },
]

// Нечутливо до регістру: /api/journal віддає настрій у ВЕРХНЬОМУ регістрі.
export const moodMeta = (k: string) => moods.find((m) => m.key === String(k).toLowerCase()) ?? moods[2]

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : ''

export const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
