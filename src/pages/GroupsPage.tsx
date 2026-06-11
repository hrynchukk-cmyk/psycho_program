import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, UsersRound, Zap } from 'lucide-react'
import { useStore, formatDate } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, inputCls } from '../components/ui'

export default function GroupsPage() {
  const { groups, addGroup } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const create = () => {
    if (!form.name) return
    addGroup({ ...form, memberIds: [], autoSendEnabled: false, autoSendActivityIds: [], autoSendProgramIds: [] })
    setForm({ name: '', description: '' })
    setShowAdd(false)
  }

  return (
    <div>
      <PageHeader
        title="Групи"
        subtitle="Об'єднуйте клієнтів у групи та надсилайте контент усім одразу"
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Створити групу
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState title="Груп ще немає" hint="Створіть першу групу, щоб працювати з кількома клієнтами одночасно." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <UsersRound size={20} />
                </span>
                {g.autoSendEnabled && (
                  <Badge tone="blue">
                    <Zap size={12} className="mr-1" /> Авто-надсилання
                  </Badge>
                )}
              </div>
              <div className="font-semibold text-gray-900">{g.name}</div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{g.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                {g.memberIds.length} учасників · створено {formatDate(g.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Нова група" onClose={() => setShowAdd(false)}>
          <Field label="Назва групи">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Опис">
            <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Скасувати
            </Button>
            <Button onClick={create} disabled={!form.name}>
              Створити
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
