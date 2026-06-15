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

// Розшифровує аудіо запису через OpenAI Whisper. Запускається у фоні (без await).
// Без OPENAI_API_KEY транскрипція пропускається — лишається тільки аудіо.
export async function transcribeEntry(entryId: string): Promise<void> {
  if (!OPENAI_KEY) return
  try {
    const audio = await prisma.journalAudio.findUnique({ where: { entryId } })
    if (!audio) throw new Error('no audio')

    const form = new FormData()
    const blob = new Blob([new Uint8Array(audio.data)], { type: audio.mime })
    form.append('file', blob, `audio.${extFor(audio.mime)}`)
    form.append('model', 'whisper-1')
    form.append('language', 'uk')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    })
    if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as { text: string }

    await prisma.journalEntry.update({
      where: { id: entryId },
      data: { transcript: data.text?.trim() || '', transcriptStatus: 'done' },
    })
  } catch (e) {
    console.error('Транскрипція не вдалася:', e)
    await prisma.journalEntry.update({ where: { id: entryId }, data: { transcriptStatus: 'failed' } }).catch(() => {})
  }
}
