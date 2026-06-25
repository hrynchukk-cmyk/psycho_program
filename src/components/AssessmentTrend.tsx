import { scoreAssessment } from '../lib/assessments'
import type { Activity, Delivery } from '../types'

// Динаміка стандартизованих тестів клієнта: бал кожного проходження у часі,
// поточна інтерпретація та зміна від попереднього разу (клінічно значуща чи ні).

interface Point {
  date: string
  total: number
  color: string
  label: string
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })

function LineChart({ points, max, color }: { points: Point[]; max: number; color: string }) {
  const width = 320
  const height = 110
  const padL = 26
  const padR = 10
  const padT = 10
  const padB = 20
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const n = points.length
  const stepX = n > 1 ? innerW / (n - 1) : 0
  const xFor = (i: number) => padL + (n > 1 ? i * stepX : innerW / 2)
  const yFor = (v: number) => padT + (1 - Math.min(v, max) / (max || 1)) * innerH
  const line = points.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.total).toFixed(1)}`).join(' ')
  const labelEvery = Math.max(1, Math.ceil(n / 5))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[0, max].map((g) => (
        <g key={g}>
          <line x1={padL} y1={yFor(g)} x2={width - padR} y2={yFor(g)} stroke="#f0f1f4" strokeWidth={1} />
          <text x={2} y={yFor(g) + 4} fontSize={10} fill="#9ca3af">
            {g}
          </text>
        </g>
      ))}
      {n > 1 && <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(p.total)} r={3.5} fill={p.color} stroke="#fff" strokeWidth={1.5} />
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <text key={`l${i}`} x={xFor(i)} y={height - 5} fontSize={9.5} fill="#9ca3af" textAnchor="middle">
            {fmt(p.date)}
          </text>
        ) : null,
      )}
    </svg>
  )
}

export default function AssessmentTrends({
  deliveries,
  activities,
  clientId,
}: {
  deliveries: Delivery[]
  activities: Activity[]
  clientId: string
}) {
  // Згрупувати завершені проходження тестів цього клієнта за ключем тесту.
  const byKey: Record<string, { points: Point[]; max: number; defName: string; mcid?: number; higherIsBetter?: boolean }> = {}
  for (const d of deliveries) {
    if (d.clientId !== clientId || d.kind !== 'activity' || d.status !== 'completed' || !d.completedAt) continue
    const act = activities.find((a) => a.id === d.refId)
    if (!act?.assessmentKey) continue
    const res = scoreAssessment(act.assessmentKey, act.elements, d.responses ?? [])
    if (!res) continue
    const entry = (byKey[act.assessmentKey] ??= {
      points: [],
      max: res.max,
      defName: res.def.name,
      mcid: res.def.mcid,
      higherIsBetter: res.def.higherIsBetter,
    })
    entry.points.push({
      date: d.completedAt,
      total: res.total,
      color: res.band?.color ?? '#6b7280',
      label: res.band?.label ?? '—',
    })
  }

  const keys = Object.keys(byKey)
  if (keys.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-1 font-semibold text-gray-900">Динаміка тестів</h3>
      <p className="mb-4 text-xs text-gray-500">Як змінюються бали стандартизованих шкал від проходження до проходження.</p>
      <div className="grid gap-5 md:grid-cols-2">
        {keys.map((k) => {
          const t = byKey[k]
          const pts = [...t.points].sort((a, b) => +new Date(a.date) - +new Date(b.date))
          const last = pts[pts.length - 1]
          const prev = pts.length > 1 ? pts[pts.length - 2] : undefined
          const change = prev ? last.total - prev.total : undefined
          // Покращення: для позитивних шкал — зростання; інакше — спад.
          const improved = change != null && (t.higherIsBetter ? change > 0 : change < 0)
          const significant = change != null && t.mcid != null && Math.abs(change) >= t.mcid
          return (
            <div key={k} className="rounded-lg border border-gray-100 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gray-800">{t.defName.split('—')[0].trim()}</span>
                <span className="text-sm font-bold" style={{ color: last.color }}>
                  {last.total}/{t.max} · {last.label}
                </span>
              </div>
              <LineChart points={pts} max={t.max} color={last.color} />
              {change != null && (
                <div className="mt-1 text-xs">
                  <span className={improved ? 'text-emerald-600' : change === 0 ? 'text-gray-400' : 'text-red-600'}>
                    {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {change > 0 ? '+' : ''}
                    {change} від минулого разу
                  </span>
                  {significant && <span className="ml-1 text-gray-500">· клінічно значуща зміна</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
