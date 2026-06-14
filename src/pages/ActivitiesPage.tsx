import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Copy, Pencil, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { useStore, formatDate } from '../data/store'
import { Badge, Button, EmptyState, PageHeader, Tabs } from '../components/ui'
import SendModal from '../components/SendModal'

export default function ActivitiesPage() {
  const { activities, deleteActivity, copyPremadeActivity, addActivity } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('my')
  const [sendFor, setSendFor] = useState<{ id: string; title: string } | null>(null)
  const [toast, setToast] = useState('')

  const my = activities.filter((a) => !a.isPremade)
  const premade = activities.filter((a) => a.isPremade)
  const list = tab === 'my' ? my : premade

  const createNew = async () => {
    const id = await addActivity({
      title: 'Нова активність',
      description: '',
      elements: [],
      pageBreaksEnabled: false,
      isPremade: false,
    })
    navigate(`/activities/${id}`)
  }

  const copyToMy = async (id: string) => {
    await copyPremadeActivity(id)
    setToast('Скопійовано до «Мої активності». Тепер її можна редагувати.')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div>
      <PageHeader
        title="Активності"
        subtitle="Вправи, анкети та уроки, які ви надсилаєте клієнтам"
        actions={
          <Button onClick={createNew}>
            <Plus size={16} /> Створити активність
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: 'my', label: 'Мої активності', count: my.length },
          { id: 'premade', label: 'Готовий контент', count: premade.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'premade' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-700">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          Бібліотека готових науково обґрунтованих активностей. Скопіюйте будь-яку до себе, щоб редагувати та надсилати клієнтам.
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState title="Активностей немає" hint="Створіть нову або скопіюйте з готового контенту." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <ClipboardList size={20} />
                </span>
                <div className="flex gap-1.5">
                  {a.category && <Badge tone="violet">{a.category}</Badge>}
                  {a.pageBreaksEnabled && <Badge tone="blue">Page breaks</Badge>}
                </div>
              </div>
              <div className="font-semibold text-gray-900">{a.title}</div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-500">{a.description || 'Без опису'}</p>
              <div className="mt-3 text-xs text-gray-500">
                {a.elements.filter((e) => e.type !== 'pageBreak').length} елементів · оновлено {formatDate(a.updatedAt)}
              </div>
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                {tab === 'my' ? (
                  <>
                    <Link to={`/activities/${a.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full justify-center">
                        <Pencil size={14} /> Редагувати
                      </Button>
                    </Link>
                    <Button className="flex-1 justify-center" onClick={() => setSendFor({ id: a.id, title: a.title })}>
                      <Send size={14} /> Надіслати
                    </Button>
                    <Button variant="danger" onClick={() => deleteActivity(a.id)}>
                      <Trash2 size={15} />
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" className="w-full justify-center" onClick={() => copyToMy(a.id)}>
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
          kind="activity"
          refId={sendFor.id}
          title={sendFor.title}
          onClose={() => setSendFor(null)}
          onSent={(n) => {
            setToast(`Надіслано ${n} клієнт(ам)`)
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
