import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, PageHeader } from '../components/ui'
import {
  AppointmentModal,
  WeekGrid,
  WeekNav,
  startOfWeek,
  type ApptModalState,
} from '../components/appointments'

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [modal, setModal] = useState<ApptModalState | null>(null)

  return (
    <div>
      <PageHeader
        title="Календар відвідувань"
        subtitle="Хто й коли приходить — записи на прийом"
        actions={
          <Button onClick={() => setModal({ kind: 'new' })}>
            <Plus size={16} /> Новий запис
          </Button>
        }
      />

      <WeekNav weekStart={weekStart} onChange={setWeekStart} />
      <WeekGrid
        weekStart={weekStart}
        onSlotClick={(day, hour) => setModal({ kind: 'new', date: day, hour })}
        onApptClick={(appt) => setModal({ kind: 'edit', appt })}
      />
      <p className="mt-3 text-xs text-gray-400">Натисніть на вільне місце, щоб додати запис, або на запис — щоб змінити.</p>

      {modal && <AppointmentModal state={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
