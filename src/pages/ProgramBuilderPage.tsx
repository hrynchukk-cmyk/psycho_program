import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Clock, Plus, Send, Trash2 } from 'lucide-react'
import { useStore, uid } from '../data/store'
import { Button, EmptyState, Field, Modal, PageHeader, inputCls } from '../components/ui'
import SendModal from '../components/SendModal'
import type { DeliveryMode, ProgramStep } from '../types'

const modeLabel = (s: ProgramStep, isFirst: boolean): string => {
  if (s.mode === 'immediately') return isFirst ? 'Одразу після старту програми' : 'Одразу після завершення попередньої'
  if (s.mode === 'afterPrevious') return `Через ${s.days} дн. після завершення попередньої активності`
  return `Через ${s.days} дн. після старту програми`
}

export default function ProgramBuilderPage() {
  const { id } = useParams()
  const { programs, activities, updateProgram } = useStore()
  const program = programs.find((p) => p.id === id)
  const [showAdd, setShowAdd] = useState(false)
  const [showSend, setShowSend] = useState(false)

  if (!program) return <EmptyState title="Програму не знайдено" />
  if (program.isPremade)
    return <EmptyState title="Готовий контент не можна редагувати" hint="Скопіюйте програму до «Моїх», щоб змінювати її." />

  const myActivities = activities.filter((a) => !a.isPremade)

  const setSteps = (steps: ProgramStep[]) => updateProgram(program.id, { steps })

  const addStep = (activityId: string) => {
    setSteps([...program.steps, { id: uid('s'), activityId, mode: 'afterPrevious', days: 1 }])
    setShowAdd(false)
  }

  const move = (i: number, dir: -1 | 1) => {
    const xs = [...program.steps]
    const j = i + dir
    if (j < 0 || j >= xs.length) return
    ;[xs[i], xs[j]] = [xs[j], xs[i]]
    setSteps(xs)
  }

  const updateStep = (i: number, patch: Partial<ProgramStep>) =>
    setSteps(program.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  return (
    <div>
      <Link to="/programs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Усі програми
      </Link>
      <PageHeader
        title="Конструктор програми"
        actions={
          <Button onClick={() => setShowSend(true)}>
            <Send size={15} /> Надіслати
          </Button>
        }
      />

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
        <Field label="Назва програми">
          <input className={inputCls} value={program.title} onChange={(e) => updateProgram(program.id, { title: e.target.value })} />
        </Field>
        <Field label="Опис">
          <textarea
            rows={2}
            className={inputCls}
            value={program.description}
            onChange={(e) => updateProgram(program.id, { description: e.target.value })}
          />
        </Field>
      </div>

      <h3 className="mb-3 font-semibold text-gray-900">Кроки програми (pathway)</h3>
      <p className="mb-4 text-sm text-gray-500">
        Активності доставляються клієнту автоматично за обраним правилом. Наступний крок «після попередньої» чекає,
        поки клієнт завершить попередню активність.
      </p>

      {program.steps.length === 0 ? (
        <EmptyState title="У програмі ще немає кроків" hint="Додайте першу активність." />
      ) : (
        <div className="space-y-0">
          {program.steps.map((s, i) => {
            const a = activities.find((x) => x.id === s.activityId)
            return (
              <div key={s.id}>
                {i > 0 && <div className="ml-9 h-6 w-px bg-gray-300" />}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{a?.title ?? 'Активність видалено'}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} /> {modeLabel(s, i === 0)}
                        </div>
                      </div>
                    </div>
                    <span className="flex gap-1">
                      <button onClick={() => move(i, -1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <ArrowUp size={15} />
                      </button>
                      <button onClick={() => move(i, 1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <ArrowDown size={15} />
                      </button>
                      <button
                        onClick={() => setSteps(program.steps.filter((_, idx) => idx !== i))}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <span className="text-sm text-gray-600">Доставка:</span>
                    <select
                      value={s.mode}
                      onChange={(e) => updateStep(i, { mode: e.target.value as DeliveryMode })}
                      className={`${inputCls} w-auto py-1.5`}
                    >
                      <option value="immediately">одразу</option>
                      <option value="afterPrevious">через N днів після завершення попередньої</option>
                      <option value="afterStart">через N днів після старту програми</option>
                    </select>
                    {s.mode !== 'immediately' && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        N =
                        <input
                          type="number"
                          min={0}
                          value={s.days}
                          onChange={(e) => updateStep(i, { days: Math.max(0, Number(e.target.value)) })}
                          className={`${inputCls} w-20 py-1.5`}
                        />
                        дн.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
      >
        <Plus size={16} /> Додати крок
      </button>

      {showAdd && (
        <Modal title="Додати активність до програми" onClose={() => setShowAdd(false)}>
          {myActivities.length === 0 ? (
            <p className="text-sm text-gray-500">Спочатку створіть активність на сторінці «Активності».</p>
          ) : (
            <div className="space-y-1">
              {myActivities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => addStep(a.id)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                >
                  {a.title}
                  <span className="block text-xs text-gray-500">{a.elements.length} елементів</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showSend && <SendModal kind="program" refId={program.id} title={program.title} onClose={() => setShowSend(false)} />}
    </div>
  )
}
