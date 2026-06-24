import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Mail } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, inputCls } from '../components/ui'
import type { ClientStatus } from '../types'

export const statusBadge = (s: ClientStatus) =>
  s === 'active' ? (
    <Badge tone="green">Активний</Badge>
  ) : s === 'invited' ? (
    <Badge tone="amber">Запрошено</Badge>
  ) : (
    <Badge tone="gray">Архів</Badge>
  )

export default function ClientsPage() {
  const { clients, groups, addClient } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | ClientStatus>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })

  const filtered = clients.filter((c) => {
    const matchesQuery = `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || c.status === filter
    return matchesQuery && matchesFilter
  })

  const invite = () => {
    if (!form.firstName || !form.email) return
    addClient({ ...form, status: 'invited' })
    setForm({ firstName: '', lastName: '', email: '' })
    setShowAdd(false)
  }

  return (
    <div>
      <PageHeader
        title="Клієнти"
        subtitle="Запрошуйте клієнтів та керуйте їхніми профілями"
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Додати клієнта
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за ім'ям або email…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={`${inputCls} w-44`}>
          <option value="all">Усі статуси</option>
          <option value="active">Активні</option>
          <option value="invited">Запрошені</option>
          <option value="archived">Архівні</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Клієнтів не знайдено" hint="Спробуйте змінити фільтри або додайте нового клієнта." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Клієнт</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Групи</th>
                <th className="px-5 py-3 font-medium">Доданий</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const memberOf = groups.filter((g) => g.memberIds.includes(c.id))
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <Link to={`/clients/${c.id}`} className="group flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                          {c.firstName[0]}
                          {c.lastName[0] ?? ''}
                        </span>
                        <span>
                          <span className="block font-medium text-gray-900 group-hover:text-brand-700">{clientName(c)}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail size={12} /> {c.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {memberOf.length === 0 ? '—' : memberOf.map((g) => g.name).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(c.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Запросити клієнта" onClose={() => setShowAdd(false)}>
          <p className="mb-4 text-sm text-gray-500">
            Клієнт отримає email-запрошення до клієнтського застосунку (в демо — імітація).
          </p>
          <Field label="Ім'я">
            <input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Прізвище">
            <input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Скасувати
            </Button>
            <Button onClick={invite} disabled={!form.firstName || !form.email}>
              <Mail size={15} /> Надіслати запрошення
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
