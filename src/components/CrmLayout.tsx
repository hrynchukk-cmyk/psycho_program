import { Link, NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, HeartPulse, LayoutDashboard, LogOut, Users } from 'lucide-react'
import { useStore } from '../data/store'

// Лейаут CRM-версії: легка верхня панель замість сайдбара.
// Фокус — швидкий запис пацієнта в календар.

const nav = [
  { to: '/crm', label: 'Календар', icon: CalendarDays, end: true },
  { to: '/crm/patients', label: 'Пацієнти', icon: Users, end: false },
]

// Чи зібрано застосунок як окремий CRM-сайт (VITE_APP_MODE=crm).
export const CRM_ONLY = import.meta.env.VITE_APP_MODE === 'crm'

export default function CrmLayout() {
  const { user, logout } = useStore()
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'ДП'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <HeartPulse size={18} />
            </span>
            <span className="text-sm font-bold text-gray-900">Psycho Program</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              CRM
            </span>
          </span>

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <span className="ml-auto flex items-center gap-2">
            {!CRM_ONLY && (
              <Link
                to="/dashboard"
                className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 sm:flex"
              >
                <LayoutDashboard size={15} /> Повна версія
              </Link>
            )}
            <span
              title={user ? `${user.firstName} ${user.lastName}` : ''}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold uppercase text-violet-700"
            >
              {initials}
            </span>
            <button onClick={logout} title="Вийти" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
              <LogOut size={17} />
            </button>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
