import { useState } from 'react'
import { FileText, Link2, Plus, Trash2, Upload, Users } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, inputCls } from '../components/ui'
import type { ResourceItem } from '../types'

export default function ResourcesPage() {
  const { resources, clients, addResource, deleteResource, updateResource } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [kind, setKind] = useState<'file' | 'link'>('file')
  const [form, setForm] = useState({ name: '', url: '' })
  const [shareFor, setShareFor] = useState<ResourceItem | null>(null)

  const activeClients = clients.filter((c) => c.status !== 'archived')

  const create = () => {
    if (!form.name) return
    addResource({
      kind,
      name: form.name,
      url: kind === 'link' ? form.url : undefined,
      fileType: kind === 'file' ? form.name.split('.').pop()?.toUpperCase() : undefined,
      size: kind === 'file' ? '1.2 МБ' : undefined,
      sharedWithClientIds: [],
    })
    setForm({ name: '', url: '' })
    setShowAdd(false)
  }

  const toggleShare = (r: ResourceItem, clientId: string) => {
    const list = r.sharedWithClientIds.includes(clientId)
      ? r.sharedWithClientIds.filter((x) => x !== clientId)
      : [...r.sharedWithClientIds, clientId]
    updateResource(r.id, { sharedWithClientIds: list })
    setShareFor({ ...r, sharedWithClientIds: list })
  }

  return (
    <div>
      <PageHeader
        title="Ресурси"
        subtitle="Файли та посилання, якими ви ділитеся з клієнтами"
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Додати ресурс
          </Button>
        }
      />

      {resources.length === 0 ? (
        <EmptyState title="Ресурсів ще немає" hint="Завантажте файл або додайте посилання." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Назва</th>
                <th className="px-5 py-3 font-medium">Тип</th>
                <th className="px-5 py-3 font-medium">Доступ</th>
                <th className="px-5 py-3 font-medium">Додано</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        {r.kind === 'file' ? <FileText size={17} /> : <Link2 size={17} />}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        {r.url && <div className="text-xs text-gray-500">{r.url}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {r.kind === 'file' ? <Badge tone="blue">{r.fileType} · {r.size}</Badge> : <Badge tone="violet">Посилання</Badge>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {r.sharedWithClientIds.length === 0 ? (
                      <span className="text-gray-400">Ні з ким</span>
                    ) : (
                      `${r.sharedWithClientIds.length} клієнт(и)`
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(r.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="secondary" onClick={() => setShareFor(r)}>
                        <Users size={14} /> Поділитися
                      </Button>
                      <Button variant="danger" onClick={() => deleteResource(r.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Додати ресурс" onClose={() => setShowAdd(false)}>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setKind('file')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${kind === 'file' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
            >
              <Upload size={14} className="mr-1 inline" /> Файл
            </button>
            <button
              onClick={() => setKind('link')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${kind === 'link' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
            >
              <Link2 size={14} className="mr-1 inline" /> Посилання
            </button>
          </div>
          <Field label={kind === 'file' ? 'Назва файлу (демо-завантаження)' : 'Назва посилання'}>
            <input
              className={inputCls}
              placeholder={kind === 'file' ? 'наприклад, Памятка.pdf' : 'наприклад, Корисна стаття'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          {kind === 'link' && (
            <Field label="URL">
              <input
                className={inputCls}
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </Field>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Скасувати
            </Button>
            <Button onClick={create} disabled={!form.name}>
              Додати
            </Button>
          </div>
        </Modal>
      )}

      {shareFor && (
        <Modal title={`Доступ до: ${shareFor.name}`} onClose={() => setShareFor(null)}>
          <p className="mb-3 text-sm text-gray-500">Оберіть клієнтів, які побачать цей ресурс у своєму застосунку.</p>
          <div className="space-y-1">
            {activeClients.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={shareFor.sharedWithClientIds.includes(c.id)}
                  onChange={() => toggleShare(shareFor, c.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-800">{clientName(c)}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShareFor(null)}>Готово</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
