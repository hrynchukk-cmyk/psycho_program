import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Circle, MessageSquareReply, Send, Smartphone } from 'lucide-react'
import { useStore, formatDateTime, clientName } from '../data/store'
import { Badge, Button, EmptyState, PageHeader, Toggle, inputCls } from '../components/ui'
import type { JournalEntry, Mood } from '../types'

export const moodMeta: Record<Mood, { emoji: string; label: string; score: number; cls: string }> = {
  great: { emoji: '😄', label: 'Чудово', score: 5, cls: 'bg-emerald-100 text-emerald-700' },
  good: { emoji: '🙂', label: 'Добре', score: 4, cls: 'bg-lime-100 text-lime-700' },
  neutral: { emoji: '😐', label: 'Нейтрально', score: 3, cls: 'bg-gray-100 text-gray-600' },
  low: { emoji: '😟', label: 'Погано', score: 2, cls: 'bg-amber-100 text-amber-700' },
  bad: { emoji: '😢', label: 'Дуже погано', score: 1, cls: 'bg-red-100 text-red-700' },
}

const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })

export function MoodPill({ mood }: { mood: Mood }) {
  const m = moodMeta[mood]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span className="text-sm leading-none">{m.emoji}</span>
      {m.label}
    </span>
  )
}

export function EntryCard({ entry }: { entry: JournalEntry }) {
  const { clients, markJournalReviewed, replyToJournal } = useStore()
  const client = clients.find((c) => c.id === entry.clientId)
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')

  const sendReply = () => {
    if (!text.trim()) return
    replyToJournal(entry.id, text.trim())
    setText('')
    setReplying(false)
  }

  return (
    <div className={`rounded-xl border bg-white p-5 ${entry.reviewed ? 'border-gray-200' : 'border-brand-200 ring-1 ring-brand-100'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/clients/${entry.clientId}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {client ? `${client.firstName[0]}${client.lastName[0] ?? ''}` : '?'}
            </span>
          </Link>
          <div>
            <Link to={`/clients/${entry.clientId}`} className="text-sm font-medium text-gray-900 hover:text-brand-700">
              {clientName(client)}
            </Link>
            <div className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</div>
          </div>
        </div>
        <MoodPill mood={entry.mood} />
      </div>

      {entry.title && <div className="mb-1 font-semibold text-gray-900">{entry.title}</div>}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{entry.body}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <Badge key={t} tone="gray">
              #{t}
            </Badge>
          ))}
        </div>
      )}

      {entry.reply && (
        <div className="mt-3 rounded-lg border-l-2 border-brand-400 bg-brand-50 px-3 py-2">
          <div className="mb-0.5 text-xs font-medium text-brand-700">Ваша відповідь клієнту</div>
          <p className="text-sm text-gray-700">{entry.reply}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => markJournalReviewed(entry.id, !entry.reviewed)}
          className={`flex items-center gap-1.5 text-xs font-medium ${entry.reviewed ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {entry.reviewed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          {entry.reviewed ? 'Переглянуто' : 'Позначити переглянутим'}
        </button>
        {!entry.reply && (
          <button
            onClick={() => setReplying((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <MessageSquareReply size={15} /> Відповісти
          </button>
        )}
      </div>

      {replying && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendReply()}
            placeholder="Напишіть відповідь клієнту…"
            className={inputCls}
          />
          <Button onClick={sendReply} disabled={!text.trim()}>
            <Send size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function JournalPage() {
  const { journal, clients } = useStore()
  const [clientFilter, setClientFilter] = useState('')
  const [moodFilter, setMoodFilter] = useState('')
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false)

  const filtered = useMemo(
    () =>
      journal
        .filter((e) => !clientFilter || e.clientId === clientFilter)
        .filter((e) => !moodFilter || e.mood === moodFilter)
        .filter((e) => !onlyUnreviewed || !e.reviewed)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [journal, clientFilter, moodFilter, onlyUnreviewed],
  )

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const thisWeek = journal.filter((e) => +new Date(e.createdAt) >= weekAgo)
  const unreviewed = journal.filter((e) => !e.reviewed).length
  const avgMood = journal.length
    ? journal.reduce((s, e) => s + moodMeta[e.mood].score, 0) / journal.length
    : 0
  const avgMoodKey = (Object.keys(moodMeta) as Mood[]).reduce((best, k) =>
    Math.abs(moodMeta[k].score - avgMood) < Math.abs(moodMeta[best].score - avgMood) ? k : best,
  )

  // Групуємо стрічку за днями, як у мобільному щоденнику.
  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>()
    for (const e of filtered) {
      const k = dayKey(e.createdAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(e)
    }
    return [...map.entries()]
  }, [filtered])

  const stats = [
    { label: 'Усього записів', value: journal.length },
    { label: 'За тиждень', value: thisWeek.length },
    { label: 'Не переглянуто', value: unreviewed, accent: unreviewed > 0 },
    { label: 'Середній настрій', value: `${moodMeta[avgMoodKey].emoji} ${moodMeta[avgMoodKey].label}` },
  ]

  return (
    <div>
      <PageHeader
        title="Щоденник"
        subtitle="Щоденні записи, які клієнти ведуть у мобільному додатку"
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
        <Smartphone size={16} className="mt-0.5 shrink-0" />
        Клієнти залишають записи у своєму застосунку. Тут ви бачите їх усі: відстежуйте настрій, позначайте переглянуті та відповідайте.
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`mt-1 text-lg font-bold ${s.accent ? 'text-brand-600' : 'text-gray-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={`${inputCls} w-56`}>
          <option value="">Усі клієнти</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientName(c)}
            </option>
          ))}
        </select>
        <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)} className={`${inputCls} w-48`}>
          <option value="">Будь-який настрій</option>
          {(Object.keys(moodMeta) as Mood[]).map((m) => (
            <option key={m} value={m}>
              {moodMeta[m].emoji} {moodMeta[m].label}
            </option>
          ))}
        </select>
        <Toggle checked={onlyUnreviewed} onChange={setOnlyUnreviewed} label="Лише не переглянуті" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Записів немає"
          hint={
            journal.length === 0
              ? 'Коли клієнти почнуть вести щоденник у додатку, записи з’являться тут.'
              : 'Спробуйте змінити фільтри.'
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, entries]) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold capitalize text-gray-700">{day}</h3>
                <span className="text-xs text-gray-400">· {entries.length}</span>
              </div>
              <div className="space-y-3">
                {entries.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
