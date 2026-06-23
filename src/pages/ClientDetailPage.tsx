import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, ArchiveRestore, Eye, FileText, Link2, Plus, Upload } from 'lucide-react'
import { useStore, formatDate, clientName } from '../data/store'
import { Badge, Button, EmptyState, Field, Modal, PageHeader, Tabs, inputCls } from '../components/ui'
import { NoteRecorder, NotePlayer, NoteTranscript, useTranscriptPolling, type Recorded } from '../components/VoiceNote'
import { statusBadge } from './ClientsPage'
import { EntryCard, moodMeta } from './JournalPage'
import { BarList, MoodLineChart, StatCard } from '../components/charts'
import { avgMood, clientEngagement, moodDistribution, moodSeries, prePostInsights, topTags } from '../lib/stats'
import type { DeliveryStatus } from '../types'

const deliveryBadge = (s: DeliveryStatus) =>
  s === 'completed' ? (
    <Badge tone="green">Завершено</Badge>
  ) : s === 'inProgress' ? (
    <Badge tone="blue">В процесі</Badge>
  ) : (
    <Badge tone="gray">Надіслано</Badge>
  )

export default function ClientDetailPage() {
  const { id } = useParams()
  const store = useStore()
  const { clients, groups, activities, programs, deliveries, resources, tasks, notes, journal } = store
  const client = clients.find((c) => c.id === id)
  const [tab, setTab] = useState('stats')
  const [showShare, setShowShare] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', body: '' })
  const [noteAudio, setNoteAudio] = useState<Recorded | null>(null)
  // Поки є нотатки з незавершеною транскрипцією — періодично оновлюємо список.
  useTranscriptPolling(
    notes.some((n) => n.clientId === id && n.transcriptStatus === 'pending'),
    store.refreshNotes,
  )

  if (!client) return <EmptyState title="Клієнта не знайдено" />

  const clientDeliveries = deliveries.filter((d) => d.clientId === client.id)
  const actDeliveries = clientDeliveries.filter((d) => d.kind === 'activity')
  const progDeliveries = clientDeliveries.filter((d) => d.kind === 'program')
  const sharedResources = resources.filter((r) => r.sharedWithClientIds.includes(client.id))
  const notShared = resources.filter((r) => !r.sharedWithClientIds.includes(client.id))
  const clientTasks = tasks.filter((t) => t.clientId === client.id)
  const clientNotes = notes.filter((n) => n.clientId === client.id)
  const clientJournal = journal
    .filter((j) => j.clientId === client.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  const memberOf = groups.filter((g) => g.memberIds.includes(client.id))

  const tabs = [
    { id: 'stats', label: 'Статистика' },
    { id: 'activities', label: 'Активності', count: actDeliveries.length },
    { id: 'programs', label: 'Програми', count: progDeliveries.length },
    { id: 'resources', label: 'Ресурси', count: sharedResources.length },
    { id: 'tasks', label: 'Задачі', count: clientTasks.length },
    { id: 'notes', label: 'Нотатки', count: clientNotes.length },
    { id: 'journal', label: 'Щоденник', count: clientJournal.length },
  ]

  const addNote = () => {
    if (!noteForm.title) return
    store.addNote({ ...noteForm, clientId: client.id, audio: noteAudio })
    setNoteForm({ title: '', body: '' })
    setNoteAudio(null)
    setShowNote(false)
  }
  const openNote = () => {
    setNoteForm({ title: '', body: '' })
    setNoteAudio(null)
    setShowNote(true)
  }

  return (
    <div>
      <Link to="/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Усі клієнти
      </Link>
      <PageHeader
        title={clientName(client)}
        subtitle={`${client.email} · доданий ${formatDate(client.createdAt)}`}
        actions={
          <>
            {statusBadge(client.status)}
            {client.status !== 'archived' ? (
              <Button variant="secondary" onClick={() => store.updateClient(client.id, { status: 'archived' })}>
                <Archive size={15} /> Архівувати
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => store.updateClient(client.id, { status: 'active' })}>
                <ArchiveRestore size={15} /> Відновити
              </Button>
            )}
          </>
        }
      />

      {memberOf.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          Учасник груп:
          {memberOf.map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`}>
              <Badge tone="violet">{g.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'stats' &&
        (() => {
          const eng = clientEngagement(client.id, journal, deliveries)
          const series = moodSeries(journal, client.id)
          const avg = avgMood(clientJournal)
          const dist = moodDistribution(clientJournal)
          const maxDist = Math.max(1, ...dist.map((d) => d.count))
          const prepost = prePostInsights(client.id, deliveries, activities)
          const tags = topTags(clientJournal)
          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Середній настрій" value={avg ? `${Object.values(moodMeta).find((m) => m.score === Math.round(avg))?.emoji ?? ''} ${avg}` : '—'} hint="за весь час" />
                <StatCard label="Записів у щоденнику" value={eng.entries} hint={`${eng.perWeek}/тиждень`} />
                <StatCard label="Остання активність" value={eng.lastActive ? (eng.lastActiveDays === 0 ? 'сьогодні' : `${eng.lastActiveDays} дн тому`) : '—'} accent={eng.lastActiveDays >= 7} />
                <StatCard label="Завершення активностей" value={eng.totalActivities ? `${eng.completionPct}%` : '—'} hint={`${eng.completed} з ${eng.totalActivities}`} />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-1 font-semibold text-gray-900">Динаміка настрою</h3>
                <p className="mb-3 text-xs text-gray-500">Записи щоденника в часі (😢 1 … 😄 5)</p>
                {series.length > 1 ? (
                  <MoodLineChart points={series} />
                ) : (
                  <p className="text-sm text-gray-400">Замало записів для графіка — потрібно щонайменше два.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-3 font-semibold text-gray-900">Розподіл настрою</h3>
                  {clientJournal.length === 0 ? (
                    <p className="text-sm text-gray-400">Немає записів.</p>
                  ) : (
                    <BarList items={dist.map((d) => ({ label: `${moodMeta[d.mood].emoji} ${moodMeta[d.mood].label}`, value: d.count, max: maxDist }))} />
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-1 font-semibold text-gray-900">Зміна «до / після»</h3>
                  <p className="mb-3 text-xs text-gray-500">Середня зміна шкал у вправах</p>
                  {prepost.length === 0 ? (
                    <p className="text-sm text-gray-400">Поки немає завершених вправ зі шкалами «до» і «після».</p>
                  ) : (
                    <div className="space-y-2.5">
                      {prepost.map((p) => (
                        <div key={p.activityId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{p.activityTitle}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-gray-500">{p.avgBefore} → {p.avgAfter}</span>
                            <Badge tone={p.avgDelta < 0 ? 'green' : p.avgDelta > 0 ? 'amber' : 'gray'}>
                              {p.avgDelta > 0 ? '+' : ''}{p.avgDelta}
                            </Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <div className="mb-2 text-xs font-medium text-gray-500">Часті теми</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(([t, n]) => (
                          <Badge key={t} tone="gray">#{t} · {n}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

      {tab === 'activities' &&
        (actDeliveries.length === 0 ? (
          <EmptyState title="Активностей ще не надіслано" hint="Надішліть активність зі сторінки «Активності»." />
        ) : (
          <div className="space-y-2">
            {actDeliveries.map((d) => {
              const a = activities.find((x) => x.id === d.refId)
              return (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{a?.title ?? '—'}</div>
                    <div className="text-xs text-gray-500">
                      Надіслано {formatDate(d.sentAt)}
                      {d.completedAt && ` · завершено ${formatDate(d.completedAt)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {deliveryBadge(d.status)}
                    {d.status === 'completed' && (
                      <Link to={`/review/${d.id}`}>
                        <Button variant="secondary">
                          <Eye size={15} /> Переглянути відповіді
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      {tab === 'programs' &&
        (progDeliveries.length === 0 ? (
          <EmptyState title="Програм ще не надіслано" hint="Надішліть програму зі сторінки «Програми»." />
        ) : (
          <div className="space-y-2">
            {progDeliveries.map((d) => {
              const p = programs.find((x) => x.id === d.refId)
              return (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{p?.title ?? '—'}</div>
                    <div className="text-xs text-gray-500">
                      Надіслано {formatDate(d.sentAt)} · {p?.steps.length ?? 0} кроків
                    </div>
                  </div>
                  {deliveryBadge(d.status)}
                </div>
              )
            })}
          </div>
        ))}

      {tab === 'resources' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowShare(true)}>
              <Upload size={15} /> Поділитися ресурсом
            </Button>
          </div>
          {sharedResources.length === 0 ? (
            <EmptyState title="Немає спільних файлів чи посилань" hint="Поділіться файлом або посиланням з цим клієнтом." />
          ) : (
            <div className="space-y-2">
              {sharedResources.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      {r.kind === 'file' ? <FileText size={17} /> : <Link2 size={17} />}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">
                        {r.kind === 'file' ? `${r.fileType} · ${r.size}` : r.url}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() =>
                      store.updateResource(r.id, {
                        sharedWithClientIds: r.sharedWithClientIds.filter((x) => x !== client.id),
                      })
                    }
                  >
                    Прибрати доступ
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' &&
        (clientTasks.length === 0 ? (
          <EmptyState title="Немає задач, пов'язаних з клієнтом" hint="Створіть задачу на сторінці «Задачі»." />
        ) : (
          <div className="space-y-2">
            {clientTasks.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => store.toggleTask(t.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`flex-1 text-sm ${t.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</span>
                {t.dueDate && <span className="text-xs text-gray-500">до {formatDate(t.dueDate)}</span>}
              </label>
            ))}
          </div>
        ))}

      {tab === 'notes' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={openNote}>
              <Plus size={15} /> Додати нотатку
            </Button>
          </div>
          {clientNotes.length === 0 ? (
            <EmptyState title="Нотаток ще немає" hint="Нотатки приватні — їх бачите лише ви." />
          ) : (
            <div className="space-y-2">
              {clientNotes.map((n) => (
                <div key={n.id} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="font-medium text-gray-900">{n.title}</div>
                    <span className="text-xs text-gray-500">{formatDate(n.createdAt)}</span>
                  </div>
                  {n.body && <p className="whitespace-pre-wrap text-sm text-gray-600">{n.body}</p>}
                  {n.audio && <NotePlayer noteId={n.id} durationSec={n.audio.durationSec ?? undefined} />}
                  {(n.transcript || n.transcriptStatus) && (
                    <NoteTranscript status={n.transcriptStatus} text={n.transcript} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'journal' &&
        (clientJournal.length === 0 ? (
          <EmptyState
            title="Записів у щоденнику немає"
            hint="Клієнт ще не залишав щоденних записів у мобільному додатку."
          />
        ) : (
          <div className="space-y-3">
            {clientJournal.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        ))}

      {showShare && (
        <Modal title="Поділитися ресурсом" onClose={() => setShowShare(false)}>
          {notShared.length === 0 ? (
            <p className="text-sm text-gray-500">Усі наявні ресурси вже спільні з цим клієнтом. Додайте нові на сторінці «Ресурси».</p>
          ) : (
            <div className="space-y-1">
              {notShared.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    store.updateResource(r.id, { sharedWithClientIds: [...r.sharedWithClientIds, client.id] })
                    setShowShare(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <span className="text-gray-500">{r.kind === 'file' ? <FileText size={16} /> : <Link2 size={16} />}</span>
                  <span className="text-sm text-gray-800">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showNote && (
        <Modal title={`Нотатка про: ${clientName(client)}`} onClose={() => setShowNote(false)}>
          <Field label="Заголовок">
            <input className={inputCls} value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
          </Field>
          <Field label="Текст нотатки">
            <textarea
              rows={5}
              className={inputCls}
              value={noteForm.body}
              onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })}
            />
          </Field>
          <Field label="Голосова нотатка (необов'язково)">
            <NoteRecorder value={noteAudio} onChange={setNoteAudio} />
          </Field>
          <p className="mb-3 text-xs text-gray-500">Нотатки приватні та видимі лише вам.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNote(false)}>
              Скасувати
            </Button>
            <Button onClick={addNote} disabled={!noteForm.title}>
              Зберегти
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
