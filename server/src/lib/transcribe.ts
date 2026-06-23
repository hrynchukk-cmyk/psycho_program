import { prisma } from './prisma.js'

const OPENAI_KEY = process.env.OPENAI_API_KEY

export const transcriptionEnabled = () => !!OPENAI_KEY

const extFor = (mime: string) => {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a'
  if (mime.includes('wav')) return 'wav'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  return 'mp3'
}

// Один виклик OpenAI Whisper для байтів аудіо. Повертає розпізнаний текст.
async function whisper(data: Uint8Array, mime: string): Promise<string> {
  const form = new FormData()
  const blob = new Blob([data], { type: mime })
  form.append('file', blob, `audio.${extFor(mime)}`)
  form.append('model', 'whisper-1')
  form.append('language', 'uk')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { text: string }
  return json.text?.trim() || ''
}

// Розшифровує аудіо запису щоденника. Запускається у фоні (без await).
// Без OPENAI_API_KEY транскрипція пропускається — лишається тільки аудіо.
export async function transcribeEntry(entryId: string): Promise<void> {
  if (!OPENAI_KEY) return
  try {
    const audio = await prisma.journalAudio.findUnique({ where: { entryId } })
    if (!audio) throw new Error('no audio')
    const text = await whisper(audio.data, audio.mime)
    await prisma.journalEntry.update({
      where: { id: entryId },
      data: { transcript: text, transcriptStatus: 'done' },
    })
  } catch (e) {
    console.error('Транскрипція запису не вдалася:', e)
    await prisma.journalEntry.update({ where: { id: entryId }, data: { transcriptStatus: 'failed' } }).catch(() => {})
  }
}

// Розшифровує голосову нотатку психолога. Запускається у фоні (без await).
export async function transcribeNote(noteId: string): Promise<void> {
  if (!OPENAI_KEY) return
  try {
    const audio = await prisma.noteAudio.findUnique({ where: { noteId } })
    if (!audio) throw new Error('no audio')
    const text = await whisper(audio.data, audio.mime)
    await prisma.note.update({
      where: { id: noteId },
      data: { transcript: text, transcriptStatus: 'done' },
    })
  } catch (e) {
    console.error('Транскрипція нотатки не вдалася:', e)
    await prisma.note.update({ where: { id: noteId }, data: { transcriptStatus: 'failed' } }).catch(() => {})
  }
}
