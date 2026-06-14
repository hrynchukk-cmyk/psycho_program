import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, UserMinus, Zap } from 'lucide-react'
import { useStore, clientName } from '../data/store'
import { Badge, Button, EmptyState, Modal, PageHeader, Tabs, Toggle } from '../components/ui'
import { statusBadge } from './ClientsPage'

export default function GroupDetailPage() {
  const { id } = useParams()
  const store = useStore()
  const { groups, clients, activities, programs } = store
  const group = groups.find((g) => g.id === id)
  const [tab, setTab] = useState('members')
  const [showAddMember, setShowAddMember] = useState(false)

  if (!group) return <EmptyState title="Групу не знайдено" />

  const members = clients.filter((c) => group.memberIds.includes(c.id))
  const candidates = clients.filter((c) => !group.memberIds.includes(c.id) && c.status !== 'archived')
  const myActivities = activities.filter((a) => !a.isPremade)
  const myPrograms = programs.filter((p) => !p.isPremade)

  // Логіка з PDF: при додаванні нового учасника бекенд автоматично надсилає
  // йому контент зі списку авто-надсилання групи.
  const addMember = async (clientId: string) => {
    await store.addGroupMember(group.id, clientId)
    setShowAddMember(false)
  }

  const removeMember = (clientId: string) => store.removeGroupMember(group.id, clientId)

  const toggleAutoItem = (kind: 'activity' | 'program', itemId: string) => {
    if (kind === 'activity') {
      const list = group.autoSendActivityIds.includes(itemId)
        ? group.autoSendActivityIds.filter((x) => x !== itemId)
        : [...group.autoSendActivityIds, itemId]
      store.updateGroup(group.id, { autoSendActivityIds: list })
    } else {
      const list = group.autoSendProgramIds.includes(itemId)
        ? group.autoSendProgramIds.filter((x) => x !== itemId)
        : [...group.autoSendProgramIds, itemId]
      store.updateGroup(group.id, { autoSendProgramIds: list })
    }
  }

  return (
    <div>
      <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Усі групи
      </Link>
      <PageHeader
        title={group.name}
        subtitle={group.description}
        actions={group.autoSendEnabled ? <Badge tone="blue"><Zap size={12} className="mr-1" /> Авто-надсилання увімкнено</Badge> : undefined}
      />

      <Tabs
        tabs={[
          { id: 'members', label: 'Учасники', count: members.length },
          { id: 'autosend', label: 'Авто-надсилання' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'members' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowAddMember(true)}>
              <Plus size={15} /> Додати учасника
            </Button>
          </div>
          {members.length === 0 ? (
            <EmptyState title="У групі ще немає учасників" hint="Додайте клієнтів до групи." />
          ) : (
            <div className="space-y-2">
              {members.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <Link to={`/clients/${c.id}`} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {c.firstName[0]}
                      {c.lastName[0] ?? ''}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 hover:text-brand-700">{clientName(c)}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    {statusBadge(c.status)}
                    <Button variant="danger" onClick={() => removeMember(c.id)}>
                      <UserMinus size={15} /> Видалити
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'autosend' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Автоматичне надсилання новим учасникам</h3>
            <Toggle
              checked={group.autoSendEnabled}
              onChange={(v) => store.updateGroup(group.id, { autoSendEnabled: v })}
            />
          </div>
          <p className="mb-5 text-sm text-gray-500">
            Коли нового клієнта додають до групи, обрані нижче активності та програми надсилаються йому автоматично.
            Наявні учасники нічого не отримують повторно.
          </p>

          {group.autoSendEnabled && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Активності</h4>
                {myActivities.length === 0 ? (
                  <p className="text-sm text-gray-400">Немає власних активностей</p>
                ) : (
                  <div className="space-y-1">
                    {myActivities.map((a) => (
                      <label key={a.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={group.autoSendActivityIds.includes(a.id)}
                          onChange={() => toggleAutoItem('activity', a.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-800">{a.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Програми</h4>
                {myPrograms.length === 0 ? (
                  <p className="text-sm text-gray-400">Немає власних програм</p>
                ) : (
                  <div className="space-y-1">
                    {myPrograms.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={group.autoSendProgramIds.includes(p.id)}
                          onChange={() => toggleAutoItem('program', p.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-800">{p.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddMember && (
        <Modal title="Додати учасника" onClose={() => setShowAddMember(false)}>
          {group.autoSendEnabled && (group.autoSendActivityIds.length > 0 || group.autoSendProgramIds.length > 0) && (
            <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
              <Zap size={14} className="mr-1 inline" />
              Новому учаснику автоматично надішлеться контент з налаштувань авто-надсилання.
            </div>
          )}
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-500">Усі активні клієнти вже в групі.</p>
          ) : (
            <div className="space-y-1">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addMember(c.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {c.firstName[0]}
                    {c.lastName[0] ?? ''}
                  </span>
                  <span className="text-sm text-gray-800">{clientName(c)}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
