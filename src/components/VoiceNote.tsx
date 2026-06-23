import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Trash2, FileText, Loader2 } from 'lucide-react'
import { fetchObjectUrl } from '../api/client'

export interface Recorded {
  base64: string
  mime: string
  durationSec: number
}

export const formatClock = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const pickMime = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

// Запис аудіо в браузері через MediaRecorder.
export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const startedRef = useRef(0)

  const supported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined'

  const cleanup = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => cleanup, [])

  const start = async (): Promise<boolean> => {
    if (!supported) return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      mr.start()
      mediaRef.current = mr
      startedRef.current = Date.now()
      setSeconds(0)
      setRecording(true)
      timerRef.current = window.setInterval(
        () => setSeconds(Math.floor((Date.now() - startedRef.current) / 1000)),
        250,
      )
      return true
    } catch {
      cleanup()
      return false
    }
  }

  const stop = (): Promise<Recorded | null> =>
    new Promise((resolve) => {
      const mr = mediaRef.current
      if (!mr) return resolve(null)
      mr.onstop = async () => {
        cleanup()
        setRecording(false)
        const durationSec = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000))
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (!blob.size) return resolve(null)
        resolve({ base64: await blobToBase64(blob), mime: blob.type, durationSec })
      }
      mr.stop()
    })

  return { supported, recording, seconds, start, stop }
}

// Кнопка запису голосової нотатки + прев'ю результату.
export function NoteRecorder({ value, onChange }: { value: Recorded | null; onChange: (r: Recorded | null) => void }) {
  const rec = useRecorder()

  if (!rec.supported) {
    return <p className="text-xs text-gray-400">Запис аудіо не підтримується цим браузером.</p>
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
          <Mic size={14} /> Голосову нотатку записано · {value.durationSec} с
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
        >
          <Trash2 size={13} /> Видалити
        </button>
      </div>
    )
  }

  if (rec.recording) {
    return (
      <button
        type="button"
        onClick={async () => {
          const r = await rec.stop()
          if (r) onChange(r)
        }}
        className="flex w-full items-center justify-between rounded-lg border border-red-300 bg-red-50 px-3 py-2.5"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-red-600">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" /> Запис · {formatClock(rec.seconds)}
        </span>
        <span className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
          <Square size={11} fill="currentColor" /> Стоп
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await rec.start()
        if (!ok) alert('Не вдалося отримати доступ до мікрофона. Дозвольте доступ у браузері та спробуйте ще раз.')
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      <Mic size={15} className="text-red-500" /> Записати голосову нотатку
    </button>
  )
}

// Текстова транскрипція голосової нотатки (Whisper). Показує стан, поки готується.
export function NoteTranscript({ status, text }: { status?: string | null; text?: string }) {
  if (!status && !text) return null
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <FileText size={12} /> Транскрипція
      </div>
      {status === 'pending' && !text ? (
        <p className="flex items-center gap-1.5 text-xs italic text-gray-400">
          <Loader2 size={12} className="animate-spin" /> Розшифровуємо аудіо…
        </p>
      ) : status === 'failed' && !text ? (
        <p className="text-xs text-gray-400">Транскрипцію не виконано.</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{text}</p>
      )}
    </div>
  )
}

// Поки серед нотаток є хоч одна «pending» транскрипція — періодично оновлюємо список.
export function useTranscriptPolling(hasPending: boolean, refresh: () => void) {
  const ref = useRef(refresh)
  ref.current = refresh
  useEffect(() => {
    if (!hasPending) return
    let tries = 0
    const id = window.setInterval(() => {
      tries += 1
      ref.current()
      if (tries >= 15) window.clearInterval(id)
    }, 4000)
    return () => window.clearInterval(id)
  }, [hasPending])
}

// Програвач голосової нотатки: тягне аудіо з токеном і віддає <audio>.
export function NotePlayer({ noteId, durationSec }: { noteId: string; durationSec?: number }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    let objUrl = ''
    fetchObjectUrl(`/api/notes/${noteId}/audio`)
      .then((u) => {
        if (active) {
          objUrl = u
          setUrl(u)
        } else URL.revokeObjectURL(u)
      })
      .catch(() => active && setError(true))
    return () => {
      active = false
      if (objUrl) URL.revokeObjectURL(objUrl)
    }
  }, [noteId])

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <Mic size={13} /> Голосова нотатка{durationSec ? ` · ${durationSec} с` : ''}
      </div>
      {error ? (
        <p className="text-xs text-red-600">Не вдалося завантажити аудіо</p>
      ) : url ? (
        <audio controls src={url} className="h-9 w-full" />
      ) : (
        <p className="text-xs text-gray-400">Завантаження…</p>
      )}
    </div>
  )
}
