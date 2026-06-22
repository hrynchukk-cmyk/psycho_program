// Конфіг стандартизованих тестів (вільні шкали) + підрахунок та інтерпретація.
// Бал кожного питання = індекс обраного варіанту (0..3).

export interface Band {
  min: number
  max: number
  label: string
  color: string
}

export interface AssessmentDef {
  key: string
  name: string
  short: string
  maxScore: number
  bands: Band[]
  riskItemIndex?: number // індекс «червоного» питання (напр. суїцид у PHQ-9)
  criticalTotal?: number // загальний поріг для тривоги психолога
}

export const ASSESSMENTS: Record<string, AssessmentDef> = {
  phq9: {
    key: 'phq9',
    name: 'PHQ-9 — шкала депресії',
    short: 'PHQ-9',
    maxScore: 27,
    bands: [
      { min: 0, max: 4, label: 'мінімальна', color: '#059669' },
      { min: 5, max: 9, label: 'легка', color: '#65a30d' },
      { min: 10, max: 14, label: 'помірна', color: '#d97706' },
      { min: 15, max: 19, label: 'помірно-важка', color: '#ea580c' },
      { min: 20, max: 27, label: 'важка', color: '#dc2626' },
    ],
    riskItemIndex: 8,
    criticalTotal: 20,
  },
  gad7: {
    key: 'gad7',
    name: 'GAD-7 — шкала тривоги',
    short: 'GAD-7',
    maxScore: 21,
    bands: [
      { min: 0, max: 4, label: 'мінімальна', color: '#059669' },
      { min: 5, max: 9, label: 'легка', color: '#65a30d' },
      { min: 10, max: 14, label: 'помірна', color: '#d97706' },
      { min: 15, max: 21, label: 'важка', color: '#dc2626' },
    ],
    criticalTotal: 15,
  },
}

export interface AssessmentResult {
  def: AssessmentDef
  total: number
  max: number
  band: Band
  critical: boolean
  riskFlag: boolean
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
  let total = 0
  let riskFlag = false
  questions.forEach((q, i) => {
    const idx = (q.options ?? []).indexOf(answerOf(q.id) ?? '')
    const s = idx >= 0 ? idx : 0
    total += s
    if (def.riskItemIndex === i && s > 0) riskFlag = true
  })
  const band = def.bands.find((b) => total >= b.min && total <= b.max) ?? def.bands[def.bands.length - 1]
  const critical = riskFlag || (def.criticalTotal != null && total >= def.criticalTotal)
  return { def, total, max: def.maxScore, band, critical, riskFlag }
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
