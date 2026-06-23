import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'
import { transcribeNote, transcriptionEnabled } from '../lib/transcribe.js'

export const notesRouter = Router()
notesRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedNote(req: Request) {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!note) throw new HttpError(404, 'Нотатку не знайдено')
  return note
}

// Метадані аудіо без важких байтів.
const audioMeta = { audio: { select: { mime: true, durationSec: true } } } as const

notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: { practitionerId: string; clientId?: string } = { practitionerId: practitionerId(req) }
    if (typeof req.query.clientId === 'string') where.clientId = req.query.clientId
    const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' }, include: audioMeta })
    res.json(notes)
  }),
)

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(''),
  clientId: z.string().nullish(),
  // Голосова нотатка (необовʼязкова): аудіо в base64 + MIME-тип.
  audioBase64: z.string().optional(),
  audioMime: z.string().optional(),
  audioDurationSec: z.number().int().nonnegative().optional(),
})

notesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const hasAudio = !!(data.audioBase64 && data.audioMime)
    const note = await prisma.note.create({
      data: {
        title: data.title,
        body: data.body,
        clientId: data.clientId ?? undefined,
        practitionerId: practitionerId(req),
        transcriptStatus: hasAudio && transcriptionEnabled() ? 'pending' : null,
      },
    })

    if (hasAudio) {
      await prisma.noteAudio.create({
        data: {
          noteId: note.id,
          data: Buffer.from(data.audioBase64!, 'base64'),
          mime: data.audioMime!,
          durationSec: data.audioDurationSec,
        },
      })
      // Транскрипція у фоні — не блокує відповідь.
      if (transcriptionEnabled()) void transcribeNote(note.id)
    }

    const full = await prisma.note.findUnique({ where: { id: note.id }, include: audioMeta })
    res.status(201).json(full)
  }),
)

// GET /api/notes/:id/audio — віддає аудіо-байти голосової нотатки (лише власнику-психологу).
notesRouter.get(
  '/:id/audio',
  asyncHandler(async (req, res) => {
    await ownedNote(req)
    const audio = await prisma.noteAudio.findUnique({ where: { noteId: req.params.id } })
    if (!audio) throw new HttpError(404, 'Аудіо не знайдено')
    res.setHeader('Content-Type', audio.mime)
    res.setHeader('Cache-Control', 'private, max-age=86400')
    res.send(Buffer.from(audio.data))
  }),
)

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  clientId: z.string().nullish(),
})

notesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedNote(req)
    const data = updateSchema.parse(req.body)
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        body: data.body,
        clientId: data.clientId === null ? null : data.clientId,
      },
    })
    res.json(note)
  }),
)

notesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedNote(req)
    await prisma.note.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
