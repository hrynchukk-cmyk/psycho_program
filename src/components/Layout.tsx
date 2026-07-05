import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ClipboardList,
  Route,
  FolderOpen,
  CheckSquare,
  StickyNote,
  BookOpen,
  CalendarDays,
  HeartPulse,
  KanbanSquare,
  Sparkles,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useStore } from '../data/store'

const nav = [
  { to: '/dashboard', label: 'Статистика', icon: LayoutDashboard },
  { to: '/clients', label: 'Клієнти', icon: Users },
  { to: '/groups', label: 'Групи', icon: UsersRound },
  { to: '/activities', label: 'Активності', icon: ClipboardList },
  { to: '/programs', label: 'Програми', icon: Route },
  { to: '/resources', label: 'Ресурси', icon: FolderOpen },
  { to: '/tasks', label: 'Задачі', icon: CheckSquare },
  { to: '/notes', label: 'Нотатки', icon: StickyNote },
  { to: '/journal', label: 'Щоденник', icon: BookOpen },
  { to: '/calendar', label: 'Календар', icon: CalendarDays },
  { to: '/ai', label: 'AI-консультант', icon: Sparkles },
]

export default function Layout() {
  const { user, logout } = useStore()
  const [open, setOpen] = useState(false)
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'ДП'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхня панель — лише на мобільних */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          aria-label="Відкрити меню"
        >
          <Menu size={22} />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <HeartPulse size={18} />
        </span>
        <span className="text-sm font-bold text-gray-900">Psycho Program</span>
      </header>

      {/* Затемнення під висувним меню (мобільні) */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Бічне меню: статичне на десктопі, висувне на мобільних */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82%] flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:w-60 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <HeartPulse size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-900">Psycho Program</div>
            <div className="text-xs text-gray-500">Адмін-панель</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Закрити меню"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 px-3 py-4">
          {/* Перемикач на спрощену CRM-версію (пацієнти + календар запису) */}
          <Link
            to="/crm"
            onClick={() => setOpen(false)}
            className="mb-3 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            <KanbanSquare size={17} /> CRM-версія
          </Link>
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold uppercase text-violet-700">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}` : 'Користувач'}
              </div>
              <div className="truncate text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut size={18} /> Вийти
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="md:ml-60">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
