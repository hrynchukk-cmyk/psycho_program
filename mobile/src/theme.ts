import { Platform } from 'react-native'

// Палітра «еспресо й вершки»: тепла, спокійна, для простору турботи про себе.
// Темний еспресо для тексту/кнопок, кремові поверхні, золотий акцент і теракота
// для рубрик. Усі попередні ключі збережені (перемаплені у теплі тони), щоб
// нічого не зламати; нові акценти — gold/eyebrow/cream.
export const colors = {
  brand: '#6B3F24', // насичений коричневий — основний акцент (текст/іконки)
  brandDark: '#2E1E12', // еспресо — заливка основних кнопок
  brandSoft: '#F4ECDD', // тепла бежева мʼяка поверхня
  brandSoftBorder: '#E7DCC9',
  brandSoftText: '#A0683A', // теракота
  bg: '#F5EFE6', // кремовий фон екрана
  card: '#FFFDF9', // кремова картка
  text: '#2E1E12', // еспресо (основний текст)
  text2: '#5C4433', // середній коричневий (вторинний)
  sub: '#9E8B7A', // приглушений таупе
  faint: '#A89A85', // ледь помітний таупе (неактивні таби, підказки)
  hairline: '#F0E8DB',
  border: '#E7DCC9', // бежева рамка
  inputBg: '#FBF7F0', // кремовий інпут
  green: '#3E7A4E',
  greenSoft: '#E4EFE3',
  amber: '#A0683A', // тепла теракота
  amberSoft: '#F7EBD0',
  blueSoft: '#F4ECDD',
  blueText: '#6B3F24',
  violetSoft: '#F4E6D6',
  violetText: '#A0683A',
  danger: '#C0392B',
  dangerSoft: '#FBEEE9',
  fileTile: '#F7EBD0', // тепла золотиста плитка
  linkTile: '#E4EFE3', // мʼяка зелена плитка
  // Нові акценти
  gold: '#C4933A', // золото — серце, виділення
  goldSoft: '#F7EBD0',
  goldText: '#EBC979', // золотий текст на темних кнопках
  eyebrow: '#A0683A', // теракота — підписи-рубрики (UPPERCASE)
  cream: '#FFFDF9',
}

// Зарубка-шрифт із засічками для брендових заголовків (як Georgia в макеті).
// Без бандлу шрифтів: системні засічки на кожній платформі.
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' })

export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad'

// Кожен настрій: емодзі, повний і короткий підпис, колір тексту й мʼякий фон пігулки.
export const moods: { key: Mood; emoji: string; label: string; short: string; color: string; soft: string }[] = [
  { key: 'great', emoji: '😊', label: 'Чудово', short: 'Чудово', color: '#3E7A4E', soft: '#E4EFE3' },
  { key: 'good', emoji: '🙂', label: 'Добре', short: 'Добре', color: '#6B8E3D', soft: '#EDF0DF' },
  { key: 'neutral', emoji: '😐', label: 'Нейтрально', short: 'Нейтр.', color: '#9E8B7A', soft: '#F0E8DB' },
  { key: 'low', emoji: '😟', label: 'Погано', short: 'Погано', color: '#A0683A', soft: '#F7EBD0' },
  { key: 'bad', emoji: '😢', label: 'Дуже погано', short: 'Дуже пог.', color: '#C0392B', soft: '#FBEEE9' },
]

// Нечутливо до регістру: /api/journal віддає настрій у ВЕРХНЬОМУ регістрі.
export const moodMeta = (k: string) => moods.find((m) => m.key === String(k).toLowerCase()) ?? moods[2]

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : ''

export const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
