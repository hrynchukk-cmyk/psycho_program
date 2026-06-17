import type { ReactNode } from 'react'

// Прості SVG-графіки без зовнішніх залежностей, у стилі панелі.

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = '#3d6bef',
  min,
  max,
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
  min?: number
  max?: number
}) {
  if (values.length === 0) return <div style={{ width, height }} />
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const span = hi - lo || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const pts = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - lo) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.length > 0 && (
        <circle
          cx={(values.length - 1) * stepX}
          cy={height - ((values[values.length - 1] - lo) / span) * (height - 4) - 2}
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  )
}

// Лінійний графік настрою (вісь Y 1–5) з підписами дат.
export function MoodLineChart({ points }: { points: { date: string; value: number }[] }) {
  const width = 560
  const height = 180
  const padL = 28
  const padB = 22
  const padT = 10
  const padR = 10
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const n = points.length
  const stepX = n > 1 ? innerW / (n - 1) : 0
  const yFor = (v: number) => padT + (1 - (v - 1) / 4) * innerH
  const xFor = (i: number) => padL + i * stepX

  const line = points.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`).join(' ')
  const moodEmoji = ['', '😢', '😟', '😐', '🙂', '😄']
  const labelEvery = Math.max(1, Math.ceil(n / 6))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[1, 2, 3, 4, 5].map((g) => (
        <g key={g}>
          <line x1={padL} y1={yFor(g)} x2={width - padR} y2={yFor(g)} stroke="#f0f1f4" strokeWidth={1} />
          <text x={4} y={yFor(g) + 4} fontSize={11}>
            {moodEmoji[g]}
          </text>
        </g>
      ))}
      {n > 1 && <polyline points={line} fill="none" stroke="#3d6bef" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3} fill="#3d6bef" />
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <text key={`l${i}`} x={xFor(i)} y={height - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
            {p.date}
          </text>
        ) : null,
      )}
    </svg>
  )
}

// Горизонтальні смуги (розподіл / завершення).
export function BarList({ items }: { items: { label: ReactNode; value: number; max: number; color?: string; caption?: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-gray-700">{it.label}</span>
            <span className="font-medium text-gray-900">{it.caption ?? it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${it.max ? Math.round((it.value / it.max) * 100) : 0}%`, backgroundColor: it.color ?? '#3d6bef' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatCard({ label, value, accent, hint }: { label: string; value: ReactNode; accent?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? 'text-brand-600' : 'text-gray-900'}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}
