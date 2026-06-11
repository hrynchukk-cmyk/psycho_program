import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, Pencil, Plus, Route, Send, Sparkles, Trash2 } from 'lucide-react'
import { useStore, formatDate } from '../data/store'
import { Badge, Button, EmptyState, PageHeader, Tabs } from '../components/ui'
import SendModal from '../components/SendModal'

export default function ProgramsPage() {
  const { programs, deleteProgram, copyPremadeProgram, addProgram } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('my')
  const [sendFor, setSendFor] = useState<{ id: string; title: string } | null>(null)
  const [toast, setToast] = useState('')

  const my = programs.filter((p) => !p.isPremade)
  const premade = programs.filter((p) => p.isPremade)
  const list = tab === 'my' ? my : premade

  const createNew = () => {
    const id = addProgram({ title: 'Нова програма', description: '', steps: [], isPremade: false })
    navigate(`/programs/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Програми"
        subtitle="Послідовності активностей з автоматичною доставкою за розкладом"
        actions={
          <Button onClick={createNew}>
            <Plus size={16} /> Створити програму
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'my', label: 'Мої програми', count: my.length },
          { id: 'premade', label: 'Готовий контент', count: premade.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'premade' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-700">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          Готові програми можна скопіювати до себе і адаптувати під свій підхід.
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState title="Програм немає" hint="Створіть нову або скопіюйте з готового контенту." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Route size={20} />
                </span>
                <Badge tone="gray">{p.steps.length} кроків</Badge>
              </div>
              <div className="font-semibold text-gray-900">{p.title}</div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-500">{p.description || 'Без опису'}</p>
              <div className="mt-3 text-xs text-gray-500">оновлено {formatDate(p.updatedAt)}</div>
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                {tab === 'my' ? (
                  <>
                    <Link to={`/programs/${p.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full justify-center">
                        <Pencil size={14} /> Редагувати
                      </Button>
                    </Link>
                    <Button className="flex-1 justify-center" onClick={() => setSendFor({ id: p.id, title: p.title })}>
                      <Send size={14} /> Надіслати
                    </Button>
                    <Button variant="danger" onClick={() => deleteProgram(p.id)}>
                      <Trash2 size={15} />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => {
                      copyPremadeProgram(p.id)
                      setToast('Скопійовано до «Мої програми».')
                      setTimeout(() => setToast(''), 3000)
                    }}
                  >
                    <Copy size={14} /> Скопіювати до моїх
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sendFor && (
        <SendModal
          kind="program"
          refId={sendFor.id}
          title={sendFor.title}
          onClose={() => setSendFor(null)}
          onSent={(n) => {
            setToast(`Програму надіслано ${n} клієнт(ам)`)
            setTimeout(() => setToast(''), 3000)
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  )
}
