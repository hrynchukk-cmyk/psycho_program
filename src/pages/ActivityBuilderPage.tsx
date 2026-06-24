import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleDot,
  Heading,
  Image,
  Layers,
  MessageSquare,
  Plus,
  Save,
  Send,
  Settings,
  SlidersHorizontal,
  SplitSquareVertical,
  Trash2,
  Type,
  Video,
  Wind,
} from 'lucide-react'
import { useStore, uid } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, Toggle, inputCls } from '../components/ui'
import SendModal from '../components/SendModal'
import type { Activity, ActivityElement, ElementType } from '../types'

const elementMeta: Record<ElementType, { label: string; icon: typeof Type; hint?: string }> = {
  section: { label: 'Секція', icon: Heading, hint: 'Завжди починає нову сторінку' },
  text: { label: 'Текстовий блок', icon: AlignLeft },
  shortAnswer: { label: 'Коротка відповідь', icon: Type },
  longAnswer: { label: 'Розгорнута відповідь', icon: MessageSquare },
  multipleChoice: { label: 'Вибір варіанту', icon: CircleDot },
  scale: { label: 'Шкала 1–10', icon: SlidersHorizontal },
  video: { label: 'Відео', icon: Video },
  image: { label: 'Зображення', icon: Image },
  breathing: { label: 'Дихальна вправа', icon: Wind, hint: 'Анімація дихання з голосом (4-7-8) у застосунку' },
  cards: { label: 'Колода карток', icon: Layers, hint: 'Свайпова колода рефлексивних промптів у застосунку' },
  pageBreak: { label: 'Розрив сторінки', icon: SplitSquareVertical, hint: 'Наступний елемент почне нову сторінку' },
}

// Логіка пагінації з PDF «Enable Page Breaks»: без налаштування — кожен елемент
// на окремій сторінці; з налаштуванням — нова сторінка лише після розриву або
// на початку секції.
export function computePages(a: Activity): ActivityElement[][] {
  const visible = a.elements
  if (!a.pageBreaksEnabled) {
    return visible.filter((e) => e.type !== 'pageBreak').map((e) => [e])
  }
  const pages: ActivityElement[][] = []
  let current: ActivityElement[] = []
  for (const el of visible) {
    if (el.type === 'pageBreak') {
      if (current.length) pages.push(current)
      current = []
      continue
    }
    if (el.type === 'section' && current.length) {
      pages.push(current)
      current = []
    }
    current.push(el)
  }
  if (current.length) pages.push(current)
  return pages
}

export default function ActivityBuilderPage() {
  const { id } = useParams()
  const { activities, updateActivity, saveActivity } = useStore()
  const activity = activities.find((a) => a.id === id)
  const [showSettings, setShowSettings] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!activity) return
    setSaving(true)
    try {
      await saveActivity(activity)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (!activity) return <EmptyState title="Активність не знайдено" />
  if (activity.isPremade)
    return (
      <EmptyState title="Готовий контент не можна редагувати" hint="Скопіюйте активність до «Моїх», щоб змінювати її." />
    )

  const setElements = (elements: ActivityElement[]) => updateActivity(activity.id, { elements })

  const addElement = (type: ElementType) => {
    const el: ActivityElement = {
      id: uid('e'),
      type,
      title:
        type === 'pageBreak'
          ? ''
          : type === 'section'
            ? 'Нова секція'
            : type === 'text'
              ? 'Текст для клієнта…'
              : type === 'breathing'
                ? 'Дихальна вправа 4-7-8'
                : type === 'cards'
                  ? 'Колода рефлексій'
                  : 'Нове запитання',
      ...(type === 'multipleChoice' ? { options: ['Варіант 1', 'Варіант 2'] } : {}),
      // Патерн дихання: вдих 4 с · затримка 7 с · видих 8 с.
      ...(type === 'breathing' ? { options: ['4', '7', '8'] } : {}),
      ...(type === 'cards' ? { options: ['Що сьогодні дало вам відчуття опори?', 'За що ви вдячні саме зараз?', 'Що ви хотіли б відпустити?'] } : {}),
    }
    setElements([...activity.elements, el])
    setShowAdd(false)
  }

  const move = (i: number, dir: -1 | 1) => {
    const xs = [...activity.elements]
    const j = i + dir
    if (j < 0 || j >= xs.length) return
    ;[xs[i], xs[j]] = [xs[j], xs[i]]
    setElements(xs)
  }

  const remove = (i: number) => setElements(activity.elements.filter((_, idx) => idx !== i))

  const updateEl = (i: number, patch: Partial<ActivityElement>) =>
    setElements(activity.elements.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))

  const pages = computePages(activity)
  const answerable = activity.elements.filter((e) => e.type !== 'pageBreak').length

  return (
    <div>
      <Link to="/activities" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Усі активності
      </Link>
      <PageHeader
        title="Конструктор активності"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowSettings(true)}>
              <Settings size={15} /> Налаштування
            </Button>
            <Button variant="secondary" onClick={save} disabled={saving}>
              <Save size={15} /> {saving ? 'Збереження…' : saved ? 'Збережено ✓' : 'Зберегти'}
            </Button>
            <Button onClick={() => setShowSend(true)}>
              <Send size={15} /> Надіслати
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
            <Field label="Назва активності">
              <input
                className={inputCls}
                value={activity.title}
                onChange={(e) => updateActivity(activity.id, { title: e.target.value })}
              />
            </Field>
            <Field label="Опис (бачить клієнт перед початком)">
              <textarea
                rows={2}
                className={inputCls}
                value={activity.description}
                onChange={(e) => updateActivity(activity.id, { description: e.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            {activity.elements.map((el, i) => {
              const meta = elementMeta[el.type]
              const Icon = meta.icon
              const isBreak = el.type === 'pageBreak'
              return (
                <div
                  key={el.id}
                  className={`rounded-xl border bg-white p-4 ${isBreak ? 'border-dashed border-brand-300 bg-brand-50/50' : 'border-gray-200'}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <Icon size={14} /> {meta.label}
                      {meta.hint && <span className="normal-case tracking-normal text-gray-400">— {meta.hint}</span>}
                    </span>
                    <span className="flex gap-1">
                      <button onClick={() => move(i, -1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <ArrowUp size={15} />
                      </button>
                      <button onClick={() => move(i, 1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <ArrowDown size={15} />
                      </button>
                      <button onClick={() => remove(i)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                  {!isBreak && (
                    <input
                      className={inputCls}
                      value={el.title}
                      onChange={(e) => updateEl(i, { title: e.target.value })}
                    />
                  )}
                  {el.type === 'multipleChoice' && (
                    <div className="mt-2 space-y-1.5">
                      {el.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <CircleDot size={14} className="text-gray-300" />
                          <input
                            className={`${inputCls} py-1.5`}
                            value={opt}
                            onChange={(e) =>
                              updateEl(i, { options: el.options!.map((o, j) => (j === oi ? e.target.value : o)) })
                            }
                          />
                          <button
                            onClick={() => updateEl(i, { options: el.options!.filter((_, j) => j !== oi) })}
                            className="rounded p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateEl(i, { options: [...(el.options ?? []), `Варіант ${(el.options?.length ?? 0) + 1}`] })}
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        + Додати варіант
                      </button>
                    </div>
                  )}
                  {el.type === 'cards' && (
                    <div className="mt-2 space-y-1.5">
                      <div className="text-xs font-medium text-gray-500">Картки колоди ({el.options?.length ?? 0})</div>
                      {el.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-start gap-2">
                          <span className="mt-2 text-xs font-semibold text-brand-600">{oi + 1}</span>
                          <textarea
                            rows={2}
                            className={`${inputCls} py-1.5`}
                            value={opt}
                            onChange={(e) =>
                              updateEl(i, { options: el.options!.map((o, j) => (j === oi ? e.target.value : o)) })
                            }
                          />
                          <button
                            onClick={() => updateEl(i, { options: el.options!.filter((_, j) => j !== oi) })}
                            className="mt-1.5 rounded p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateEl(i, { options: [...(el.options ?? []), ''] })}
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        + Додати картку
                      </button>
                    </div>
                  )}
                  {(el.type === 'video' || el.type === 'image') && (
                    <div className="mt-2">
                      <input
                        className={`${inputCls} py-1.5`}
                        placeholder={
                          el.type === 'video'
                            ? 'Посилання на відео/аудіо (YouTube, Vimeo, mp3…)'
                            : 'Посилання на зображення'
                        }
                        value={el.options?.[0] ?? ''}
                        onChange={(e) => updateEl(i, { options: [e.target.value] })}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Клієнт відкриє це посилання, натиснувши на блок у застосунку.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-brand-400 hover:text-brand-600"
          >
            <Plus size={16} /> Додати елемент
          </button>
        </div>

        <div>
          <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-1 font-semibold text-gray-900">Попередній перегляд сторінок</h3>
            <p className="mb-4 text-xs text-gray-500">
              {activity.pageBreaksEnabled
                ? 'Ручні розриви увімкнено: елементи групуються до розриву або нової секції.'
                : 'Класичний режим: кожен елемент на окремій сторінці.'}
            </p>
            <div className="mb-4 flex gap-2">
              <Badge tone="blue">{pages.length} стор.</Badge>
              <Badge tone="gray">{answerable} елементів</Badge>
            </div>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {pages.map((page, pi) => (
                <div key={pi} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-1.5 text-xs font-semibold text-gray-400">Сторінка {pi + 1}</div>
                  <ul className="space-y-1">
                    {page.map((el) => (
                      <li key={el.id} className="truncate text-xs text-gray-600">
                        {el.type === 'section' ? '📑 ' : '• '}
                        {el.title || elementMeta[el.type].label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {pages.length === 0 && <p className="text-sm text-gray-400">Додайте елементи, щоб побачити сторінки.</p>}
            </div>
            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
              Прогрес клієнта рахується за завершеними елементами, а не сторінками.
            </p>
          </div>
        </div>
      </div>

      {showAdd && (
        <Modal title="Додати елемент" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(elementMeta) as ElementType[]).map((type) => {
              const { label, icon: Icon } = elementMeta[type]
              const disabled = type === 'pageBreak' && !activity.pageBreaksEnabled
              return (
                <button
                  key={type}
                  disabled={disabled}
                  onClick={() => addElement(type)}
                  className="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-3 text-left text-sm text-gray-700 hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon size={17} className="text-gray-500" /> {label}
                </button>
              )
            })}
          </div>
          {!activity.pageBreaksEnabled && (
            <p className="mt-3 text-xs text-gray-500">
              Елемент «Розрив сторінки» доступний після увімкнення ручних розривів у налаштуваннях.
            </p>
          )}
        </Modal>
      )}

      {showSettings && (
        <Modal title="Налаштування активності" onClose={() => setShowSettings(false)}>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Page breaks</div>
                <div className="text-sm text-gray-500">Увімкнути ручні розриви сторінок</div>
              </div>
              <Toggle
                checked={activity.pageBreaksEnabled}
                onChange={(v) => updateActivity(activity.id, { pageBreaksEnabled: v })}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Вимкнено (за замовчуванням): кожен елемент на окремій сторінці. Увімкнено: елементи лишаються на одній
              сторінці, доки ви не додасте розрив; кожна секція завжди починає нову сторінку.
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowSettings(false)}>Зберегти</Button>
          </div>
        </Modal>
      )}

      {showSend && <SendModal kind="activity" refId={activity.id} title={activity.title} onClose={() => setShowSend(false)} />}
    </div>
  )
}
