import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, RotateCcw, Send } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, PageHeader } from '../components/ui'

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
