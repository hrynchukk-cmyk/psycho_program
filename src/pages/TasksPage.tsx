import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, Tabs, inputCls } from '../components/ui'

export default function TasksPage() {
  const { tasks, clients, addTask, toggleTask, deleteTask } = useStore()
  const [tab, setTab] = useState('open')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', clientId: '', dueDate: '' })

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const list = tab === 'open' ? open : done

  const isOverdue = (due?: string) => due && !!due && new Date(due) < new Date()

  const create = () => {
    if (!form.title) return
    addTask({
      title: form.title,
      clientId: form.clientId || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
    })
    setForm({ title: '', clientId: '', dueDate: '' })
    setShowAdd(false)
  }

  return (
    <div>
      <PageHeader
        title="Задачі"
        subtitle="Ваш робочий список: підготовка сесій, перегляд відповідей, адміністративні справи"
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Нова задача
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'open', label: 'Відкриті', count: open.length },
          { id: 'done', label: 'Виконані', count: done.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState title={tab === 'open' ? 'Немає відкритих задач' : 'Немає виконаних задач'} />
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const client = clients.find((c) => c.id === t.clientId)
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${t.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {t.title}
                  </div>
                  {client && (
                    <Link to={`/clients/${client.id}`} className="text-xs text-brand-600 hover:underline">
                      {clientName(client)}
                    </Link>
                  )}
                </div>
                {t.dueDate &&
                  (isOverdue(t.dueDate) && !t.done ? (
                    <Badge tone="amber">
                      <CalendarDays size={12} className="mr-1" /> прострочено · {formatDate(t.dueDate)}
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarDays size={13} /> {formatDate(t.dueDate)}
                    </span>
                  ))}
                <button onClick={() => deleteTask(t.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Нова задача" onClose={() => setShowAdd(false)}>
          <Field label="Що потрібно зробити">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Пов'язаний клієнт (необов'язково)">
            <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— без клієнта —</option>
              {clients
                .filter((c) => c.status !== 'archived')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {clientName(c)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Дедлайн (необов'язково)">
            <input type="date" className={inputCls} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Скасувати
            </Button>
            <Button onClick={create} disabled={!form.title}>
              Створити
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
