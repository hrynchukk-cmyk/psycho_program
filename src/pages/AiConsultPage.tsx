import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Globe, Loader2, ExternalLink, ShieldCheck, RotateCcw } from 'lucide-react'
import { apiBase, tokenStore } from '../api/client'
import { PageHeader } from '../components/ui'

interface Source {
  title: string
  url: string
}
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  searching?: boolean
  error?: boolean
}

const SUGGESTIONS = [
  'Дай матеріали про ПТСР: критерії DSM-5 і доказові методи терапії',
  'Протокол КПТ при панічному розладі — основні етапи',
  'Як інтерпретувати бали PHQ-9 і GAD-7?',
  'Поведінкова активація при депресії: покроково',
]

const TRUSTED = 'ВООЗ, APA, NICE, National Center for PTSD, Cochrane, Beck Institute, Український інститут КПТ'

export default function AiConsultPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)

    const history: ChatMessage[] = [...messages, { role: 'user', content: question }]
    // Додаємо порожнє повідомлення асистента, яке наповнюватимемо стрімом.
    setMessages([...history, { role: 'assistant', content: '', searching: false }])

    const update = (patch: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = patch(copy[copy.length - 1])
        return copy
      })

    try {
      const token = tokenStore.get()
      const res = await fetch(`${apiBase}/api/ai/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      })

      if (!res.ok || !res.body) {
        let msg = `Помилка ${res.status}`
        try {
          const j = await res.json()
          msg = j.error || msg
        } catch {
          /* not json */
        }
        update((m) => ({ ...m, content: msg, error: true, searching: false }))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data: '))
          if (!line) continue
          const data = JSON.parse(line.slice(6))
          if (data.type === 'searching') {
            update((m) => ({ ...m, searching: true }))
          } else if (data.type === 'text') {
            update((m) => ({ ...m, content: m.content + data.text, searching: false }))
          } else if (data.type === 'sources') {
            update((m) => ({ ...m, sources: data.sources, searching: false }))
          } else if (data.type === 'error') {
            update((m) => ({ ...m, content: data.error, error: true, searching: false }))
          }
        }
      }
    } catch {
      update((m) => ({
        ...m,
        content: 'Не вдалося зʼєднатися із сервером. Перевірте звʼязок і спробуйте ще раз.',
        error: true,
        searching: false,
      }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="AI-консультант"
        subtitle="Доказові матеріали КПТ із посиланнями на довірені джерела"
        actions={
          messages.length > 0 ? (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Новий чат
            </button>
          ) : undefined
        }
      />

      <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <ShieldCheck size={15} className="shrink-0" />
        Матеріали для професійного судження фахівця — не діагноз і не припис для конкретного клієнта. Пошук обмежено
        довіреними джерелами ({TRUSTED}).
      </div>

      {/* Стрічка повідомлень */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Sparkles size={24} />
            </span>
            <div className="text-base font-semibold text-gray-900">Запитайте про матеріали з КПТ</div>
            <div className="mt-1 max-w-md text-sm text-gray-500">
              Наприклад: «потрібні матеріали про ПТСР-розлад». Консультант знайде доказову інформацію та наведе джерела.
            </div>
            <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} />)
        )}
      </div>

      {/* Поле вводу */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          placeholder="Напишіть запит про матеріали (Enter — надіслати, Shift+Enter — новий рядок)…"
          className="max-h-40 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {message.searching && !message.content && (
          <div className="flex items-center gap-2 text-xs font-medium text-brand-600">
            <Globe size={14} className="animate-pulse" /> Шукаю в довірених джерелах…
          </div>
        )}
        {message.content && (
          <div
            className={`whitespace-pre-wrap rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed ${
              message.error ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.content}
            {!message.error && message.content && message.searching === false && message.sources === undefined && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-gray-400 align-middle" />
            )}
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Джерела</div>
            <ul className="space-y-1">
              {message.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-sm text-brand-700 hover:underline"
                  >
                    <ExternalLink size={13} className="mt-0.5 shrink-0" />
                    <span className="break-words">{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
