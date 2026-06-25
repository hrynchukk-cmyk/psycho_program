// Рушій стандартизованих тестів: підрахунок та інтерпретація, керовані даними.
// Підтримує зворотні питання, множники, субшкали, позитивні шкали (вищий = краще)
// та налаштовану логіку безпеки. Бал питання = значення обраного варіанту
// (за замовчуванням — індекс варіанту 0..n).

export interface Band {
  min: number
  max: number
  label: string
  color: string
}

export interface SubscaleDef {
  key: string
  name: string
  items: number[] // індекси питань (0-based) серед multipleChoice
  multiplier?: number // напр. ×2 для DASS-21
  maxScore: number
  bands: Band[]
}

export interface AssessmentDef {
  key: string
  name: string
  short: string
  source: string
  intervalLabel?: string
  optionScale: number // к-сть варіантів стандартного питання (для зворотних)
  reverseItems?: number[] // індекси зворотних питань
  valueOverrides?: Record<number, number[]> // індекс питання -> значення варіантів
  multiplier?: number // множник загального балу (WHO-5: ×4)
  maxScore: number // макс. бал (після множника)
  higherIsBetter?: boolean // WHO-5: вищий бал = краще
  bands: Band[] // загальна інтерпретація (порожньо, якщо лише субшкали)
  subscales?: SubscaleDef[]
  mcid?: number // мінімальна клінічно значуща зміна (для динаміки)
  riskItemIndex?: number // «червоне» питання (PHQ-9 #9)
  criticalHigh?: number // total >= -> критично
  criticalLow?: number // total <= -> критично (для позитивних шкал)
  note?: string // коротка примітка для психолога
}

// Палітра смуг тяжкості.
const C = {
  ok: '#059669',
  low: '#65a30d',
  mod: '#d97706',
  high: '#ea580c',
  severe: '#dc2626',
}

export const ASSESSMENTS: Record<string, AssessmentDef> = {
  phq9: {
    key: 'phq9',
    name: 'PHQ-9 — шкала депресії',
    short: 'PHQ-9',
    source: 'Pfizer / phqscreeners.com (суспільне надбання)',
    intervalLabel: 'Щотижня',
    optionScale: 4,
    maxScore: 27,
    bands: [
      { min: 0, max: 4, label: 'мінімальна', color: C.ok },
      { min: 5, max: 9, label: 'легка', color: C.low },
      { min: 10, max: 14, label: 'помірна', color: C.mod },
      { min: 15, max: 19, label: 'помірно-важка', color: C.high },
      { min: 20, max: 27, label: 'важка', color: C.severe },
    ],
    mcid: 5,
    riskItemIndex: 8,
    criticalHigh: 20,
    note: 'Поріг ймовірної депресії: ≥10. Питання 9 — про самоушкодження.',
  },
  gad7: {
    key: 'gad7',
    name: 'GAD-7 — шкала тривоги',
    short: 'GAD-7',
    source: 'Pfizer / phqscreeners.com (суспільне надбання)',
    intervalLabel: 'Щотижня',
    optionScale: 4,
    maxScore: 21,
    bands: [
      { min: 0, max: 4, label: 'мінімальна', color: C.ok },
      { min: 5, max: 9, label: 'легка', color: C.low },
      { min: 10, max: 14, label: 'помірна', color: C.mod },
      { min: 15, max: 21, label: 'важка', color: C.severe },
    ],
    mcid: 4,
    note: 'Поріг ймовірного розладу: ≥10.',
  },
  pcl5: {
    key: 'pcl5',
    name: 'PCL-5 — шкала ПТСР (DSM-5)',
    short: 'PCL-5',
    source: 'National Center for PTSD, ptsd.va.gov (вільний)',
    intervalLabel: 'Раз на 2 тижні',
    optionScale: 5,
    maxScore: 80,
    bands: [
      { min: 0, max: 20, label: 'мінімальні симптоми', color: C.ok },
      { min: 21, max: 32, label: 'підпорогові симптоми', color: C.mod },
      { min: 33, max: 80, label: 'ймовірний ПТСР — потрібна клінічна оцінка', color: C.severe },
    ],
    mcid: 10,
    note: 'Поріг ймовірного ПТСР: 33. Клінічно значуща зміна: 5–10 балів.',
  },
  dass21: {
    key: 'dass21',
    name: 'DASS-21 — депресія, тривога, стрес',
    short: 'DASS-21',
    source: 'Lovibond & Lovibond, UNSW (суспільне надбання)',
    intervalLabel: 'Раз на 2 тижні',
    optionScale: 4,
    maxScore: 63, // сума всіх 21 пункту (інформативний загальний бал)
    bands: [], // інтерпретація — за субшкалами
    subscales: [
      {
        key: 'depression',
        name: 'Депресія',
        items: [2, 4, 9, 12, 15, 16, 20],
        multiplier: 2,
        maxScore: 42,
        bands: [
          { min: 0, max: 9, label: 'норма', color: C.ok },
          { min: 10, max: 13, label: 'легка', color: C.low },
          { min: 14, max: 20, label: 'помірна', color: C.mod },
          { min: 21, max: 27, label: 'важка', color: C.high },
          { min: 28, max: 42, label: 'надважка', color: C.severe },
        ],
      },
      {
        key: 'anxiety',
        name: 'Тривога',
        items: [1, 3, 6, 8, 14, 18, 19],
        multiplier: 2,
        maxScore: 42,
        bands: [
          { min: 0, max: 7, label: 'норма', color: C.ok },
          { min: 8, max: 9, label: 'легка', color: C.low },
          { min: 10, max: 14, label: 'помірна', color: C.mod },
          { min: 15, max: 19, label: 'важка', color: C.high },
          { min: 20, max: 42, label: 'надважка', color: C.severe },
        ],
      },
      {
        key: 'stress',
        name: 'Стрес',
        items: [0, 5, 7, 10, 11, 13, 17],
        multiplier: 2,
        maxScore: 42,
        bands: [
          { min: 0, max: 14, label: 'норма', color: C.ok },
          { min: 15, max: 18, label: 'легкий', color: C.low },
          { min: 19, max: 25, label: 'помірний', color: C.mod },
          { min: 26, max: 33, label: 'важкий', color: C.high },
          { min: 34, max: 42, label: 'надважкий', color: C.severe },
        ],
      },
    ],
    note: 'Три субшкали оцінюються окремо (сума × 2).',
  },
  who5: {
    key: 'who5',
    name: 'WHO-5 — індекс благополуччя',
    short: 'WHO-5',
    source: 'ВООЗ / Psychiatric Research Unit, Copenhagen (вільний з атрибуцією)',
    intervalLabel: 'Щотижня',
    optionScale: 6,
    multiplier: 4,
    maxScore: 100,
    higherIsBetter: true,
    bands: [
      { min: 0, max: 28, label: 'дуже низьке — ймовірна депресія', color: C.severe },
      { min: 29, max: 50, label: 'знижене благополуччя', color: C.mod },
      { min: 51, max: 100, label: 'добре благополуччя', color: C.ok },
    ],
    mcid: 10,
    note: 'Нижче 50 — варто оцінити настрій; нижче 28 — показати PHQ-9.',
  },
  pss10: {
    key: 'pss10',
    name: 'PSS-10 — сприйнятий стрес',
    short: 'PSS-10',
    source: 'Cohen et al., 1983 (вільний з атрибуцією)',
    intervalLabel: 'Щотижня',
    optionScale: 5,
    reverseItems: [3, 4, 6, 7], // питання 4,5,7,8 — зворотні
    maxScore: 40,
    bands: [
      { min: 0, max: 13, label: 'низький стрес', color: C.ok },
      { min: 14, max: 26, label: 'помірний стрес', color: C.mod },
      { min: 27, max: 40, label: 'високий стрес', color: C.severe },
    ],
    mcid: 5,
    note: 'Питання 4, 5, 7, 8 — зворотні (рахуються в інверсії).',
  },
  audit: {
    key: 'audit',
    name: 'AUDIT — вживання алкоголю',
    short: 'AUDIT',
    source: 'ВООЗ (AUDIT), вільний',
    intervalLabel: 'За потреби',
    optionScale: 5,
    valueOverrides: { 8: [0, 2, 4], 9: [0, 2, 4] }, // питання 9,10 — 3 варіанти: 0/2/4
    maxScore: 40,
    bands: [
      { min: 0, max: 7, label: 'низький ризик', color: C.ok },
      { min: 8, max: 15, label: 'ризиковане вживання', color: C.mod },
      { min: 16, max: 19, label: 'шкідливе вживання', color: C.high },
      { min: 20, max: 40, label: 'ймовірна залежність', color: C.severe },
    ],
    note: '≥8 — ризиковане вживання; ≥16 — шкідливе; ≥20 — ймовірна залежність.',
  },
}

export interface ScoredScale {
  key: string
  name: string
  total: number
  max: number
  band: Band | undefined
}

export interface AssessmentResult {
  def: AssessmentDef
  total: number
  max: number
  band: Band | undefined
  subscales: ScoredScale[]
  critical: boolean
  riskFlag: boolean
}

function findBand(bands: Band[], v: number): Band | undefined {
  return bands.find((b) => v >= b.min && v <= b.max) ?? (bands.length ? bands[bands.length - 1] : undefined)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function scoreAssessment(
  key: string | null | undefined,
  elements: any[],
  responses: { elementId: string; answer: string }[],
): AssessmentResult | null {
  if (!key) return null
  const def = ASSESSMENTS[key]
  if (!def) return null
  const questions = (elements ?? []).filter((e) => e.type === 'multipleChoice')
  const answerOf = (id: string) => responses.find((r) => r.elementId === id)?.answer

  // Значення кожного питання за його позицією серед питань.
  const vals = questions.map((q, i) => {
    const opts: string[] = q.options ?? []
    const idx = opts.indexOf(answerOf(q.id) ?? '')
    if (idx < 0) return 0
    if (def.valueOverrides?.[i]) return def.valueOverrides[i][idx] ?? 0
    if (def.reverseItems?.includes(i)) return def.optionScale - 1 - idx
    return idx
  })

  const riskFlag = def.riskItemIndex != null && (vals[def.riskItemIndex] ?? 0) > 0
  const rawSum = vals.reduce((a, b) => a + b, 0)
  const total = rawSum * (def.multiplier ?? 1)
  const band = findBand(def.bands, total)

  const subscales: ScoredScale[] = (def.subscales ?? []).map((s) => {
    const sum = s.items.reduce((a, idx) => a + (vals[idx] ?? 0), 0) * (s.multiplier ?? 1)
    return { key: s.key, name: s.name, total: sum, max: s.maxScore, band: findBand(s.bands, sum) }
  })

  const critical =
    riskFlag ||
    (def.criticalHigh != null && total >= def.criticalHigh) ||
    (def.criticalLow != null && total <= def.criticalLow)

  return { def, total, max: def.maxScore, band, subscales, critical, riskFlag }
}

export const CRISIS = {
  title: 'Якщо вам зараз дуже важко',
  intro: 'Ви не самі. Будь ласка, зверніться по підтримку прямо зараз:',
  lines: [
    'Lifeline Ukraine — лінія емоційної підтримки: 7333 (цілодобово, безкоштовно)',
    'Екстрена допомога: 103',
    'Звʼяжіться зі своїм психологом якнайшвидше.',
  ],
}

export const DISCLAIMER = 'Це не діагноз, а орієнтир. Обговоріть результат зі своїм психологом.'
