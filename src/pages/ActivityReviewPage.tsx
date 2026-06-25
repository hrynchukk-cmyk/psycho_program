import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, RotateCcw, Send } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, PageHeader } from '../components/ui'
import { scoreAssessment, CRISIS, DISCLAIMER } from '../lib/assessments'
import type { Activity, Delivery } from '../types'
import { AlertTriangle } from 'lucide-react'

// Підсумок стандартизованого тесту: бал, інтерпретація і (за потреби) кризовий блок.
function AssessmentSummary({ activity, delivery }: { activity: Activity; delivery: Delivery }) {
  const result = scoreAssessment(activity.assessmentKey, activity.elements, delivery.responses ?? [])
  if (!result) return null
  const { def, band } = result
  const accent = band?.color ?? '#6b7280'
  const pct = result.max ? Math.round((result.total / result.max) * 100) : 0
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Результат · {def.short}</div>
          {def.intervalLabel && <div className="text-xs text-gray-400">Інтервал: {def.intervalLabel}</div>}
        </div>

        {result.subscales.length > 0 ? (
          // Субшкали (напр. DASS-21): окрема смуга на кожну.
          <div className="mt-3 space-y-3">
            {result.subscales.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="font-semibold" style={{ color: s.band?.color }}>
                    {s.total} · {s.band?.label}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.max ? Math.round((s.total / s.max) * 100) : 0}%`, backgroundColor: s.band?.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <div
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-[5px]"
              style={{ borderColor: accent }}
            >
              <span className="text-3xl font-extrabold leading-none" style={{ color: accent }}>
                {result.total}
              </span>
              <span className="text-xs text-gray-400">з {result.max}</span>
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-lg font-bold" style={{ color: accent }}>
                {def.name.split('—')[0].trim()}: {band?.label ?? '—'}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
              </div>
            </div>
          </div>
        )}

        {def.note && <p className="mt-3 text-xs text-gray-500">{def.note}</p>}
        <p className="mt-1 text-xs text-gray-400">
          {DISCLAIMER} · Джерело: {def.source}
        </p>
      </div>
      {result.critical && (
        <div className="border-t border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertTriangle size={18} /> Критичний показник — потрібна увага
          </div>
          <p className="mt-1 text-sm text-red-800">
            {result.riskFlag
              ? 'Клієнт відзначив думки про самоушкодження (п. 9). '
              : ''}
            Загальний бал у зоні ризику. Клієнту в застосунку показано кризові ресурси.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {CRISIS.lines.map((l) => (
              <li key={l}>• {l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CommentThread({ deliveryId, elementId }: { deliveryId: string; elementId: string | null }) {
  const { comments, addComment } = useStore()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const thread = comments.filter((c) => c.deliveryId === deliveryId && c.elementId === elementId)

  const post = () => {
    if (!text.trim()) return
    addComment(deliveryId, elementId, text.trim())
    setText('')
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {thread.length === 0 && !open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
          <MessageSquare size={13} /> Залишити коментар
        </button>
      ) : (
        <div className="space-y-2">
          {thread.map((c) => (
            <div key={c.id} className={`flex ${c.author === 'practitioner' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
                  c.author === 'practitioner' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className={`mb-0.5 text-xs ${c.author === 'practitioner' ? 'text-brand-200' : 'text-gray-500'}`}>
                  {c.author === 'practitioner' ? 'Ви' : 'Клієнт'} · {formatDate(c.createdAt)}
                </div>
                {c.text}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && post()}
              placeholder="Відповісти у гілці…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
            <Button onClick={post} disabled={!text.trim()}>
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ActivityReviewPage() {
  const { deliveryId } = useParams()
  const { deliveries, activities, clients, reopenDelivery } = useStore()
  const delivery = deliveries.find((d) => d.id === deliveryId)

  if (!delivery) return <EmptyState title="Доставку не знайдено" />
  const activity = activities.find((a) => a.id === delivery.refId)
  const client = clients.find((c) => c.id === delivery.clientId)
  if (!activity || !client) return <EmptyState title="Дані не знайдено" />

  const answerOf = (elementId: string) => delivery.responses?.find((r) => r.elementId === elementId)?.answer

  return (
    <div>
      <Link to={`/clients/${client.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Профіль клієнта
      </Link>
      <PageHeader
        title={activity.title}
        subtitle={`Відповіді: ${clientName(client)} · завершено ${formatDate(delivery.completedAt)}`}
        actions={
          <>
            {delivery.status === 'completed' ? <Badge tone="green">Завершено</Badge> : <Badge tone="blue">Знову відкрито</Badge>}
            {delivery.status === 'completed' && (
              <Button variant="secondary" onClick={() => reopenDelivery(delivery.id)}>
                <RotateCcw size={15} /> Відкрити для оновлення
              </Button>
            )}
          </>
        }
      />

      <AssessmentSummary activity={activity} delivery={delivery} />

      {delivery.status !== 'completed' && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Активність знову відкрита: клієнт може оновити свої відповіді у застосунку. Попередні відповіді збережені нижче.
        </div>
      )}

      <div className="space-y-4">
        {activity.elements
          .filter((el) => el.type !== 'pageBreak')
          .map((el) => {
            if (el.type === 'section')
              return (
                <h3 key={el.id} className="pt-2 text-lg font-semibold text-gray-900">
                  {el.title}
                </h3>
              )
            const answer = answerOf(el.id)
            const isQuestion = ['shortAnswer', 'longAnswer', 'multipleChoice', 'scale'].includes(el.type)
            return (
              <div key={el.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="text-sm font-medium text-gray-900">{el.title}</div>
                {el.type === 'text' && <p className="mt-1 text-xs text-gray-400">Інформаційний блок</p>}
                {el.type === 'breathing' && (
                  <p className="mt-1 text-xs text-gray-400">🫁 Дихальна вправа — виконується клієнтом у застосунку</p>
                )}
                {el.type === 'cards' && (
                  <p className="mt-1 text-xs text-gray-400">🃏 Колода карток ({el.options?.length ?? 0}) — клієнт гортає у застосунку</p>
                )}
                {(el.type === 'video' || el.type === 'image') &&
                  (el.options?.[0]?.trim() ? (
                    <a
                      href={el.options[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      {el.type === 'video' ? '🎬' : '🖼️'} Відкрити матеріал
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      {el.type === 'video' ? '🎬' : '🖼️'} Матеріал без посилання
                    </p>
                  ))}
                {isQuestion && (
                  <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    {answer ?? <span className="text-gray-400">Без відповіді</span>}
                    {el.type === 'scale' && answer && <span className="text-gray-400"> / 10</span>}
                  </div>
                )}
                <CommentThread deliveryId={delivery.id} elementId={el.id} />
              </div>
            )
          })}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 font-semibold text-gray-900">Загальний коментар до активності</h3>
        <p className="mb-2 text-xs text-gray-500">Гілка коментарів, яку клієнт бачить у своєму застосунку.</p>
        <CommentThread deliveryId={delivery.id} elementId={null} />
      </div>
    </div>
  )
}
