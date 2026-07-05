import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, UserPlus } from 'lucide-react'
import { useStore, clientName } from '../data/store'
import { Button, Field, Modal, inputCls } from './ui'
import type { Appointment, AppointmentStatus } from '../types'

// Спільні компоненти календаря відвідувань: тижнева сітка + модалка запису.
// Використовуються і в повній адмінці, і в CRM-версії.

export const HOUR_START = 8
export const HOUR_END = 21
const ROW_H = 52 // px на годину
const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export const startOfWeek = (d: Date) => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Пн = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}
export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const pad = (n: number) => String(n).padStart(2, '0')
export const fmtWeekRange = (a: Date, b: Date) =>
  `${a.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}`

export const STATUS_META: Record<AppointmentStatus, { label: string; cls: string }> = {
  scheduled: { label: 'Заплановано', cls: 'bg-brand-50 border-brand-300 text-brand-800' },
  completed: { label: 'Відбулась', cls: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
  cancelled: { label: 'Скасовано', cls: 'bg-gray-100 border-gray-300 text-gray-500 line-through' },
  noShow: { label: 'Не зʼявився', cls: 'bg-red-50 border-red-300 text-red-700' },
}
const STATUSES: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'noShow']

// Панель навігації по тижнях.
export function WeekNav({ weekStart, onChange }: { weekStart: Date; onChange: (d: Date) => void }) {
  const days = [weekStart, addDays(weekStart, 6)]
  return (
    <div className="mb-4 flex items-center gap-2">
      <button onClick={() => onChange(addDays(weekStart, -7))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
        <ChevronLeft size={16} />
      </button>
      <button onClick={() => onChange(startOfWeek(new Date()))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Сьогодні
      </button>
      <button onClick={() => onChange(addDays(weekStart, 7))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50">
        <ChevronRight size={16} />
      </button>
      <span className="ml-1 text-sm font-medium text-gray-700">{fmtWeekRange(days[0], days[1])}</span>
    </div>
  )
}

// Тижнева сітка записів (8:00–21:00).
export function WeekGrid({
  weekStart,
  onSlotClick,
  onApptClick,
}: {
  weekStart: Date
  onSlotClick: (day: Date, hour: number) => void
  onApptClick: (a: Appointment) => void
}) {
  const { appointments, clients } = useStore()
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const today = new Date()
  const nameFor = (clientId: string | null) => {
    if (!clientId) return 'Особистий блок'
    const c = clients.find((x) => x.id === clientId)
    return c ? clientName(c) : 'Клієнт'
  }

  return (
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
          <div className="w-12 shrink-0">
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i).map((h) => (
              <div key={h} style={{ height: ROW_H }} className="relative">
                <span className="absolute -top-2 right-1 text-[10px] text-gray-400">{pad(h)}:00</span>
              </div>
            ))}
          </div>

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
                  onSlotClick(day, hour)
                }}
              >
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div key={i} style={{ top: i * ROW_H, height: ROW_H }} className="absolute inset-x-0 border-b border-gray-50" />
                ))}
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
                        onApptClick(a)
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
  )
}

// Стан відкриття модалки запису.
export type ApptModalState =
  | { kind: 'new'; date?: Date; hour?: number; clientId?: string; newPatient?: boolean }
  | { kind: 'edit'; appt: Appointment }

const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Модалка створення/редагування запису. Уміє створити нового пацієнта
// прямо з форми (ключовий сценарій CRM: додати пацієнта + записати).
export function AppointmentModal({ state, onClose }: { state: ApptModalState; onClose: () => void }) {
  const { clients, addClient, addAppointment, updateAppointment, deleteAppointment } = useStore()
  const isEdit = state.kind === 'edit'
  const appt = isEdit ? state.appt : undefined
  const startDate = appt ? new Date(appt.startAt) : undefined

  const [patientMode, setPatientMode] = useState<'existing' | 'new'>(
    !isEdit && state.kind === 'new' && state.newPatient ? 'new' : 'existing',
  )
  const [clientId, setClientId] = useState(appt?.clientId ?? (state.kind === 'new' ? state.clientId ?? '' : ''))
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState(toDateStr(startDate ?? (state.kind === 'new' && state.date ? state.date : new Date())))
  const [time, setTime] = useState(
    startDate
      ? `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
      : `${pad(state.kind === 'new' && state.hour != null ? state.hour : 10)}:00`,
  )
  const [durationMin, setDurationMin] = useState(appt?.durationMin ?? 50)
  const [note, setNote] = useState(appt?.note ?? '')
  const [status, setStatus] = useState<AppointmentStatus>(appt?.status ?? 'scheduled')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const canSave =
    !!date && !!time && (patientMode === 'existing' || (firstName.trim() && email.trim()))

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      let targetClientId: string | null = clientId || null
      if (!isEdit && patientMode === 'new') {
        const created = await addClient({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          status: 'invited',
        })
        targetClientId = created.id
      }
      const startAt = new Date(`${date}T${time}`).toISOString()
      if (isEdit && appt) {
        await updateAppointment(appt.id, { startAt, durationMin, clientId: targetClientId, note, status })
      } else {
        await addAppointment({ startAt, durationMin, clientId: targetClientId, note })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося зберегти запис')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!appt) return
    setBusy(true)
    try {
      await deleteAppointment(appt.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Запис на прийом' : 'Записати пацієнта'} onClose={onClose}>
      {!isEdit && (
        <div className="mb-3 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setPatientMode('existing')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${patientMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Наявний пацієнт
          </button>
          <button
            onClick={() => setPatientMode('new')}
            className={`flex-1 items-center rounded-md px-3 py-1.5 text-sm font-medium ${patientMode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            <span className="inline-flex items-center gap-1">
              <UserPlus size={14} /> Новий пацієнт
            </span>
          </button>
        </div>
      )}

      {!isEdit && patientMode === 'new' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Імʼя">
              <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Прізвище">
              <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
          </Field>
        </>
      ) : (
        <Field label="Пацієнт">
          <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— особистий блок часу —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientName(c)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Час">
          <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Тривалість">
        <select className={inputCls} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
          {[30, 45, 50, 60, 90].map((m) => (
            <option key={m} value={m}>
              {m} хв
            </option>
          ))}
        </select>
      </Field>
      {isEdit && (
        <Field label="Статус">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  status === s ? STATUS_META[s].cls : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Нотатка (необовʼязково)">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Напр. тема сесії" />
      </Field>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center justify-between">
        {isEdit ? (
          <button onClick={remove} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
            <Trash2 size={15} /> Видалити
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={save} disabled={!canSave || busy}>
            {busy ? 'Збереження…' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
