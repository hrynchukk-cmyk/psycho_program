import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useStore, clientName } from '../data/store'
import { Button, Field, Modal, PageHeader, inputCls } from '../components/ui'
import type { Appointment, AppointmentStatus } from '../types'

const HOUR_START = 8
const HOUR_END = 21
const ROW_H = 52 // px на годину
const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const startOfWeek = (d: Date) => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Пн = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const pad = (n: number) => String(n).padStart(2, '0')
const fmtRange = (a: Date, b: Date) =>
  `${a.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}`

const STATUS_META: Record<AppointmentStatus, { label: string; cls: string; dot: string }> = {
  scheduled: { label: 'Заплановано', cls: 'bg-brand-50 border-brand-300 text-brand-800', dot: 'bg-brand-500' },
  completed: { label: 'Відбулась', cls: 'bg-emerald-50 border-emerald-300 text-emerald-800', dot: 'bg-emerald-500' },
  cancelled: { label: 'Скасовано', cls: 'bg-gray-100 border-gray-300 text-gray-500 line-through', dot: 'bg-gray-400' },
  noShow: { label: 'Не зʼявився', cls: 'bg-red-50 border-red-300 text-red-700', dot: 'bg-red-500' },
}
const STATUSES: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'noShow']

interface Form {
  id?: string
  date: string
  time: string
  durationMin: number
  clientId: string
  note: string
  status: AppointmentStatus
}

export default function CalendarPage() {
  const { appointments, clients, addAppointment, updateAppointment, deleteAppointment } = useStore()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [form, setForm] = useState<Form | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const today = new Date()
  const nameFor = (clientId: string | null) => {
    if (!clientId) return 'Особистий блок'
    const c = clients.find((x) => x.id === clientId)
    return c ? clientName(c) : 'Клієнт'
  }

  const openNew = (day: Date, hour: number) =>
    setForm({ date: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`, time: `${pad(hour)}:00`, durationMin: 50, clientId: '', note: '', status: 'scheduled' })
  const openEdit = (a: Appointment) => {
    const d = new Date(a.startAt)
    setForm({
      id: a.id,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      durationMin: a.durationMin,
      clientId: a.clientId ?? '',
      note: a.note ?? '',
      status: a.status,
    })
  }

  const save = async () => {
    if (!form) return
    const startAt = new Date(`${form.date}T${form.time}`).toISOString()
    const payload = { startAt, durationMin: form.durationMin, clientId: form.clientId || null, note: form.note }
    if (form.id) await updateAppointment(form.id, { ...payload, status: form.status })
    else await addAppointment(payload)
    setForm(null)
  }
  const remove = async () => {
    if (form?.id) await deleteAppointment(form.id)
    setForm(null)
  }

  return (
    <div>
      <PageHeader
        title="Календар відвідувань"
        subtitle="Хто й коли приходить — записи на прийом"
        actions={
          <Button onClick={() => openNew(today, 10)}>
            <Plus size={16} /> Новий запис
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Сьогодні
        </button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
        <span className="ml-1 text-sm font-medium text-gray-700">{fmtRange(days[0], days[6])}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="min-w-[760px]">
          {/* Заголовки днів */}
          <div className="flex border-b border-gray-200">
            <div className="w-12 shrink-0" />
            {days.map((d) => {
              const isToday = sameDay(d, today)
              return (
                <div key={d.toISOString()} className="flex-1 border-l border-gray-100 px-2 py-2 text-center">
                  <div className="text-xs text-gray-400">{DOW[(d.getDay() + 6) % 7]}</div>
                  <div className={`text-sm font-semibold ${isToday ? 'text-brand-600' : 'text-gray-800'}`}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>

          {/* Сітка часу */}
          <div className="flex">
            {/* Вісь годин */}
            <div className="w-12 shrink-0">
              {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i).map((h) => (
                <div key={h} style={{ height: ROW_H }} className="relative">
                  <span className="absolute -top-2 right-1 text-[10px] text-gray-400">{pad(h)}:00</span>
                </div>
              ))}
            </div>

            {/* Дні */}
            {days.map((day) => {
              const dayAppts = appointments.filter((a) => sameDay(new Date(a.startAt), day))
              return (
                <div
                  key={day.toISOString()}
                  className="relative flex-1 border-l border-gray-100"
                  style={{ height: (HOUR_END - HOUR_START) * ROW_H }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    const hour = Math.min(HOUR_END - 1, Math.max(HOUR_START, HOUR_START + Math.floor(y / ROW_H)))
                    openNew(day, hour)
                  }}
                >
                  {/* Лінії годин */}
                  {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                    <div key={i} style={{ top: i * ROW_H, height: ROW_H }} className="absolute inset-x-0 border-b border-gray-50" />
                  ))}
                  {/* Записи */}
                  {dayAppts.map((a) => {
                    const d = new Date(a.startAt)
                    const offsetMin = (d.getHours() - HOUR_START) * 60 + d.getMinutes()
                    const top = (offsetMin / 60) * ROW_H
                    const height = Math.max(22, (a.durationMin / 60) * ROW_H - 2)
                    const meta = STATUS_META[a.status]
                    return (
                      <button
                        key={a.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(a)
                        }}
                        style={{ top: Math.max(0, top), height }}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight ${meta.cls}`}
                      >
                        <div className="font-semibold">{nameFor(a.clientId)}</div>
                        <div className="opacity-80">
                          {pad(d.getHours())}:{pad(d.getMinutes())} · {a.durationMin} хв
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">Натисніть на вільне місце, щоб додати запис, або на запис — щоб змінити.</p>

      {form && (
        <Modal title={form.id ? 'Запис на прийом' : 'Новий запис'} onClose={() => setForm(null)}>
          <Field label="Клієнт">
            <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— особистий блок часу —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientName(c)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Час">
              <input type="time" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
          </div>
          <Field label="Тривалість">
            <select className={inputCls} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}>
              {[30, 45, 50, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} хв
                </option>
              ))}
            </select>
          </Field>
          {form.id && (
            <Field label="Статус">
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, status: s })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      form.status === s ? STATUS_META[s].cls : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="Нотатка (необовʼязково)">
            <input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Напр. тема сесії" />
          </Field>
          <div className="mt-4 flex items-center justify-between">
            {form.id ? (
              <button onClick={remove} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
                <Trash2 size={15} /> Видалити
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>
                Скасувати
              </Button>
              <Button onClick={save}>Зберегти</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
