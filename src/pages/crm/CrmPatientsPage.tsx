import { useState } from 'react'
import { CalendarPlus, Search, UserPlus } from 'lucide-react'
import { useStore, clientName } from '../../data/store'
import { Badge, Button, EmptyState, inputCls } from '../../components/ui'
import { AppointmentModal, type ApptModalState } from '../../components/appointments'

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function CrmPatientsPage() {
  const { clients, appointments } = useStore()
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ApptModalState | null>(null)

  const now = Date.now()
  // Найближчий майбутній і останній минулий візит для кожного пацієнта.
  const nextVisit = (clientId: string) =>
    appointments
      .filter((a) => a.clientId === clientId && a.status === 'scheduled' && +new Date(a.startAt) >= now)
      .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0]
  const lastVisit = (clientId: string) =>
    appointments
      .filter((a) => a.clientId === clientId && +new Date(a.startAt) < now)
      .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))[0]

  const q = query.trim().toLowerCase()
  const filtered = clients.filter(
    (c) => !q || clientName(c).toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пацієнти</h1>
          <p className="mt-1 text-sm text-gray-500">Додайте пацієнта й одразу запишіть його на прийом</p>
        </div>
        <Button onClick={() => setModal({ kind: 'new', newPatient: true })}>
          <UserPlus size={16} /> Додати пацієнта
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Пошук за імʼям або email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={q ? 'Нікого не знайдено' : 'Пацієнтів ще немає'}
          hint={q ? 'Спробуйте інший запит.' : 'Натисніть «Додати пацієнта», щоб створити першого й записати на прийом.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const next = nextVisit(c.id)
            const last = lastVisit(c.id)
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold uppercase text-brand-700">
                  {(c.firstName[0] ?? '') + (c.lastName[0] ?? '')}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{clientName(c)}</div>
                  <div className="truncate text-xs text-gray-500">{c.email}</div>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="text-right text-xs">
                    {next ? (
                      <>
                        <div className="font-medium text-brand-700">Наступний візит</div>
                        <div className="text-gray-600">{fmtDateTime(next.startAt)}</div>
                      </>
                    ) : (
                      <Badge tone="gray">Не записаний</Badge>
                    )}
                    {last && <div className="mt-0.5 text-gray-400">Останній: {fmtDateTime(last.startAt)}</div>}
                  </div>
                  <Button variant="secondary" onClick={() => setModal({ kind: 'new', clientId: c.id })}>
                    <CalendarPlus size={15} /> Записати
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <AppointmentModal state={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
