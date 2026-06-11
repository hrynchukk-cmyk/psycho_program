import { useState } from 'react'
import { Send } from 'lucide-react'
import { useStore, clientName } from '../data/store'
import { Button, Field, Modal, inputCls } from './ui'

export default function SendModal({
  kind,
  refId,
  title,
  onClose,
  onSent,
}: {
  kind: 'activity' | 'program'
  refId: string
  title: string
  onClose: () => void
  onSent?: (count: number) => void
}) {
  const { clients, groups, sendToClients } = useStore()
  const [target, setTarget] = useState<'client' | 'group'>('client')
  const [clientIds, setClientIds] = useState<string[]>([])
  const [groupId, setGroupId] = useState('')
  const [when, setWhen] = useState<'now' | 'scheduled'>('now')
  const [date, setDate] = useState('')

  const activeClients = clients.filter((c) => c.status !== 'archived')

  const toggleClient = (id: string) =>
    setClientIds((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))

  const submit = () => {
    const ids =
      target === 'client' ? clientIds : groups.find((g) => g.id === groupId)?.memberIds ?? []
    if (ids.length === 0) return
    sendToClients(kind, refId, ids)
    onSent?.(ids.length)
    onClose()
  }

  return (
    <Modal title={`Надіслати: ${title}`} onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTarget('client')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${target === 'client' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
        >
          Клієнтам
        </button>
        <button
          onClick={() => setTarget('group')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${target === 'group' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
        >
          Групі
        </button>
      </div>

      {target === 'client' ? (
        <div className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
          {activeClients.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={clientIds.includes(c.id)}
                onChange={() => toggleClient(c.id)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-800">{clientName(c)}</span>
              {c.status === 'invited' && <span className="text-xs text-amber-600">(запрошено)</span>}
            </label>
          ))}
        </div>
      ) : (
        <Field label="Оберіть групу">
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
            <option value="">— оберіть —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.memberIds.length} уч.)
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Коли надіслати">
        <div className="flex gap-2">
          <button
            onClick={() => setWhen('now')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${when === 'now' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
          >
            Одразу
          </button>
          <button
            onClick={() => setWhen('scheduled')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${when === 'scheduled' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
          >
            За розкладом
          </button>
        </div>
      </Field>
      {when === 'scheduled' && (
        <Field label="Дата надсилання">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Скасувати
        </Button>
        <Button onClick={submit} disabled={target === 'client' ? clientIds.length === 0 : !groupId}>
          <Send size={15} /> Надіслати
        </Button>
      </div>
    </Modal>
  )
}
