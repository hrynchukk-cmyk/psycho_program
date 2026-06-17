import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Mail } from 'lucide-react'
import { useStore, clientName, formatDate } from '../data/store'
import { PageHeader, EmptyState } from '../components/ui'
import { BarList, Sparkline, StatCard } from '../components/charts'
import { moodMeta } from './JournalPage'
import {
  atRiskClients,
  clientEngagement,
  moodDistribution,
  practiceStats,
} from '../lib/stats'

export default function DashboardPage() {
  const { clients, deliveries, journal, tasks, activities } = useStore()
  void activities
  const s = practiceStats({ clients, deliveries, journal, tasks })
  const atRisk = atRiskClients(clients, journal, deliveries, 7)
  const activeClients = clients.filter((c) => c.status === 'active')

  // Розподіл настрою по практиці за останні 30 днів.
  const recentJournal = journal.filter((j) => Date.now() - +new Date(j.createdAt) <= 30 * 86400000)
  const dist = moodDistribution(recentJournal)
  const maxDist = Math.max(1, ...dist.map((d) => d.count))

  const attention = [
    { icon: AlertCircle, label: 'Непереглянуті записи щоденника', value: s.unreviewedJournal, to: '/journal', tone: 'text-amber-600' },
    { icon: CalendarClock, label: 'Прострочені задачі', value: s.overdueTasks, to: '/tasks', tone: 'text-red-600' },
    { icon: Mail, label: 'Запрошені клієнти (очікують)', value: s.invited, to: '/clients', tone: 'text-blue-600' },
  ]

  return (
    <div>
      <PageHeader title="Статистика" subtitle="Огляд практики та залученості клієнтів" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Активні клієнти" value={s.active} hint={`${s.invited} запрошених`} />
        <StatCard label="Надіслано за 7 днів" value={s.sent7} />
        <StatCard label="Рівень завершення" value={`${s.completionPct}%`} hint={`${s.completed} з ${s.totalActivities}`} />
        <StatCard label="Непереглянуто" value={s.unreviewedJournal} accent={s.unreviewedJournal > 0} hint="записів щоденника" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Потребує уваги</h3>
          <div className="space-y-2">
            {attention.map((a) => (
              <Link key={a.label} to={a.to} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <a.icon size={16} className={a.tone} /> {a.label}
                </span>
                <span className="text-sm font-bold text-gray-900">{a.value}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-1 font-semibold text-gray-900">Настрій по практиці</h3>
          <p className="mb-3 text-xs text-gray-500">Записи щоденника за 30 днів</p>
          {recentJournal.length === 0 ? (
            <p className="text-sm text-gray-400">Поки немає записів за період.</p>
          ) : (
            <BarList
              items={dist.map((d) => {
                const m = moodMeta[d.mood]
                return { label: `${m.emoji} ${m.label}`, value: d.count, max: maxDist, color: undefined }
              })}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <h3 className="font-semibold text-gray-900">Залученість клієнтів</h3>
          <p className="text-xs text-gray-500">Відсортовано за давністю активності — згори ті, хто «затих»</p>
        </div>
        {activeClients.length === 0 ? (
          <EmptyState title="Немає активних клієнтів" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Клієнт</th>
                <th className="px-3 py-2.5 font-medium">Остання активність</th>
                <th className="px-3 py-2.5 font-medium">Записів (7 дн)</th>
                <th className="px-3 py-2.5 font-medium">Завершення</th>
                <th className="px-5 py-2.5 font-medium">Настрій</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeClients
                .map((c) => ({ c, e: clientEngagement(c.id, journal, deliveries) }))
                .sort((a, b) => b.e.lastActiveDays - a.e.lastActiveDays)
                .map(({ c, e }) => {
                  const stale = e.lastActiveDays >= 7
                  const spark = journal
                    .filter((j) => j.clientId === c.id)
                    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
                    .slice(-12)
                    .map((j) => moodMeta[j.mood].score)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link to={`/clients/${c.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                          {clientName(c)}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {e.lastActive ? (
                          <span className={stale ? 'font-medium text-amber-600' : 'text-gray-600'}>
                            {e.lastActiveDays === 0 ? 'сьогодні' : `${e.lastActiveDays} дн тому`}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{e.entries7}</td>
                      <td className="px-3 py-3 text-gray-700">
                        {e.totalActivities ? `${e.completionPct}%` : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {spark.length > 1 ? (
                          <Sparkline values={spark} min={1} max={5} color={stale ? '#d97706' : '#3d6bef'} />
                        ) : (
                          <span className="text-xs text-gray-400">мало даних</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
