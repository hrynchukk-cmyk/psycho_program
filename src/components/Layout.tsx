import { NavLink, Outlet } from 'react-router-dom'
import {
  Users,
  UsersRound,
  ClipboardList,
  Route,
  FolderOpen,
  CheckSquare,
  StickyNote,
  BookOpen,
  HeartPulse,
  LogOut,
} from 'lucide-react'
import { useStore } from '../data/store'

const nav = [
  { to: '/clients', label: 'Клієнти', icon: Users },
  { to: '/groups', label: 'Групи', icon: UsersRound },
  { to: '/activities', label: 'Активності', icon: ClipboardList },
  { to: '/programs', label: 'Програми', icon: Route },
  { to: '/resources', label: 'Ресурси', icon: FolderOpen },
  { to: '/tasks', label: 'Задачі', icon: CheckSquare },
  { to: '/notes', label: 'Нотатки', icon: StickyNote },
  { to: '/journal', label: 'Щоденник', icon: BookOpen },
]

export default function Layout() {
  const { user, logout } = useStore()
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'ДП'
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <HeartPulse size={20} />
          </span>
          <div>
            <div className="text-sm font-bold text-gray-900">Psycho Program</div>
            <div className="text-xs text-gray-500">Адмін-панель</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
      <main className="ml-60 flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
