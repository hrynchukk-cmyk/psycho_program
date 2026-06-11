import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, inputCls } from '../components/ui'
import type { Note } from '../types'

export default function NotesPage() {
  const { notes, clients, addNote, updateNote, deleteNote } = useStore()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Note | 'new' | null>(null)
  const [form, setForm] = useState({ title: '', body: '', clientId: '' })

  const filtered = filter ? notes.filter((n) => n.clientId === filter) : notes

  const openNew = () => {
    setForm({ title: '', body: '', clientId: '' })
    setEditing('new')
  }
  const openEdit = (n: Note) => {
    setForm({ title: n.title, body: n.body, clientId: n.clientId ?? '' })
    setEditing(n)
  }
  const save = () => {
    if (!form.title) return
    const payload = { title: form.title, body: form.body, clientId: form.clientId || null }
    if (editing === 'new') addNote(payload)
    else if (editing) updateNote(editing.id, payload)
    setEditing(null)
  }

  return (
    <div>
      <PageHeader
        title="Нотатки"
        subtitle="Приватні нотатки про сесії та клієнтів — бачите лише ви"
        actions={
          <Button onClick={openNew}>
            <Plus size={16} /> Додати нотатку
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} w-64`}>
          <option value="">Усі нотатки</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientName(c)}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Lock size={12} /> Нотатки ніколи не видно клієнтам
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Нотаток немає" hint="Додайте першу нотатку про сесію або клієнта." />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const client = clients.find((c) => c.id === n.clientId)
            return (
              <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{n.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {formatDate(n.createdAt)}
                      {client && (
                        <Link to={`/clients/${client.id}`}>
                          <Badge tone="blue">{clientName(client)}</Badge>
                        </Link>
                      )}
                      {!client && <Badge tone="gray">Загальна</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(n)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteNote(n.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-600">{n.body}</p>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Нова нотатка' : 'Редагувати нотатку'} onClose={() => setEditing(null)}>
          <Field label="Заголовок">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Клієнт (необов'язково)">
            <select className={inputCls} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— загальна нотатка —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Текст">
            <textarea rows={6} className={inputCls} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Скасувати
            </Button>
            <Button onClick={save} disabled={!form.title}>
              Зберегти
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
