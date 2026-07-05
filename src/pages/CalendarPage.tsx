import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { useStore, clientName } from '../data/store'
import { Button, PageHeader } from '../components/ui'
import {
  AppointmentModal,
  STATUS_META,
  WeekGrid,
  WeekNav,
  startOfWeek,
  type ApptModalState,
} from '../components/appointments'

const pad = (n: number) => String(n).padStart(2, '0')

export default function CalendarPage() {
  const { appointments, clients } = useStore()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [modal, setModal] = useState<ApptModalState | null>(null)

  const now = new Date()
  const todays = appointments
    .filter((a) => {
      const d = new Date(a.startAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    })
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))

  const nameFor = (clientId: string | null) => {
    if (!clientId) return 'Особистий блок'
    const c = clients.find((x) => x.id === clientId)
    return c ? clientName(c) : 'Клієнт'
  }

  return (
    <div>
      <PageHeader
        title="Календар відвідувань"
        subtitle="Хто й коли приходить — запишіть пацієнта за пару кліків"
        actions={
          <Button onClick={() => setModal({ kind: 'new' })}>
            <CalendarPlus size={16} /> Записати пацієнта
          </Button>
        }
      />

      {/* Сьогоднішні візити */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Сьогодні · {now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
        </div>
        {todays.length === 0 ? (
          <p className="text-sm text-gray-400">На сьогодні записів немає.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {todays.map((a) => {
              const d = new Date(a.startAt)
              return (
                <button
                  key={a.id}
                  onClick={() => setModal({ kind: 'edit', appt: a })}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${STATUS_META[a.status].cls}`}
                >
                  <span className="font-semibold">
                    {pad(d.getHours())}:{pad(d.getMinutes())}
                  </span>{' '}
                  · {nameFor(a.clientId)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <WeekNav weekStart={weekStart} onChange={setWeekStart} />
      <WeekGrid
        weekStart={weekStart}
        onSlotClick={(day, hour) => setModal({ kind: 'new', date: day, hour })}
        onApptClick={(appt) => setModal({ kind: 'edit', appt })}
      />
      <p className="mt-3 text-xs text-gray-400">
        Натисніть на вільне місце, щоб записати пацієнта на цей час (можна одразу створити нового), або на запис — щоб змінити.
      </p>

      {modal && <AppointmentModal state={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
