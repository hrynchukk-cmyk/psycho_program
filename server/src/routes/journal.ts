import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId } from '../lib/auth.js'
import { transcribeEntry, transcriptionEnabled } from '../lib/transcribe.js'

export const journalRouter = Router()
journalRouter.use(authenticate)

const moods = ['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'BAD'] as const

// Метадані аудіо без важких байтів.
const audioMeta = { audio: { select: { mime: true, durationSec: true } } } as const

// GET /api/journal
// Психолог: усі записи його клієнтів (з фільтрами). Клієнт: лише власні.
journalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.auth!.role === 'CLIENT') {
      const entries = await prisma.journalEntry.findMany({
        where: { clientId: req.auth!.clientId },
        orderBy: { createdAt: 'desc' },
        include: audioMeta,
      })
      return res.json(entries)
    }

    const where: Prisma.JournalEntryWhereInput = {
      client: { practitionerId: practitionerId(req) },
    }
    if (typeof req.query.clientId === 'string') where.clientId = req.query.clientId
    if (typeof req.query.mood === 'string' && (moods as readonly string[]).includes(req.query.mood)) {
      where.mood = req.query.mood as (typeof moods)[number]
    }
    if (req.query.reviewed === 'true') where.reviewed = true
    if (req.query.reviewed === 'false') where.reviewed = false

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, firstName: true, lastName: true } }, ...audioMeta },
    })
    res.json(entries)
  }),
)

const createSchema = z.object({
  mood: z.enum(moods),
  title: z.string().optional(),
  body: z.string().default(''),
  tags: z.array(z.string()).default([]),
  date: z.string().datetime().optional(),
  clientId: z.string().optional(),
  // Голосовий запис (необовʼязковий): аудіо в base64 + MIME-тип.
  audioBase64: z.string().optional(),
  audioMime: z.string().optional(),
  audioDurationSec: z.number().int().nonnegative().optional(),
})

// POST /api/journal — створення запису. Основний сценарій: клієнт з мобільного.
journalRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)

    let clientId: string
    if (req.auth!.role === 'CLIENT') {
      if (!req.auth!.clientId) throw new HttpError(400, 'Акаунт клієнта не прив’язаний до профілю')
      clientId = req.auth!.clientId
    } else {
      if (!data.clientId) throw new HttpError(400, 'Вкажіть clientId')
      const owned = await prisma.client.findFirst({
        where: { id: data.clientId, practitionerId: practitionerId(req) },
      })
      if (!owned) throw new HttpError(404, 'Клієнта не знайдено')
      clientId = data.clientId
    }

    const hasAudio = !!(data.audioBase64 && data.audioMime)
    if (!hasAudio && !data.body.trim()) throw new HttpError(400, 'Порожній запис')

    const entry = await prisma.journalEntry.create({
      data: {
        clientId,
        mood: data.mood,
        title: data.title,
        body: data.body,
        tags: data.tags,
        date: data.date ? new Date(data.date) : undefined,
        transcriptStatus: hasAudio && transcriptionEnabled() ? 'pending' : null,
      },
    })

    if (hasAudio) {
      await prisma.journalAudio.create({
        data: {
          entryId: entry.id,
          data: Buffer.from(data.audioBase64!, 'base64'),
          mime: data.audioMime!,
          durationSec: data.audioDurationSec,
        },
      })
      // Транскрипція у фоні — не блокує відповідь клієнту.
      if (transcriptionEnabled()) void transcribeEntry(entry.id)
    }

    const full = await prisma.journalEntry.findUnique({ where: { id: entry.id }, include: audioMeta })
    res.status(201).json(full)
  }),
)

// GET /api/journal/:id/audio — віддає аудіо-байти. Доступ: власник-клієнт або його психолог.
journalRouter.get(
  '/:id/audio',
  asyncHandler(async (req, res) => {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
      include: { client: { select: { practitionerId: true } } },
    })
    if (!entry) throw new HttpError(404, 'Запис не знайдено')

    const allowed =
      req.auth!.role === 'CLIENT'
        ? entry.clientId === req.auth!.clientId
        : entry.client.practitionerId === practitionerId(req)
    if (!allowed) throw new HttpError(403, 'Немає доступу')

    const audio = await prisma.journalAudio.findUnique({ where: { entryId: entry.id } })
    if (!audio) throw new HttpError(404, 'Аудіо не знайдено')

    res.setHeader('Content-Type', audio.mime)
    res.setHeader('Cache-Control', 'private, max-age=86400')
    res.send(Buffer.from(audio.data))
  }),
)

const reviewSchema = z.object({
  reviewed: z.boolean().optional(),
  reply: z.string().optional(),
  transcript: z.string().optional(),
})

// PATCH /api/journal/:id — психолог: переглянуто / відповідь / правка транскрипції.
journalRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.auth!.role !== 'PRACTITIONER') throw new HttpError(403, 'Недостатньо прав')
    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, client: { practitionerId: practitionerId(req) } },
    })
    if (!entry) throw new HttpError(404, 'Запис не знайдено')

    const data = reviewSchema.parse(req.body)
    const updated = await prisma.journalEntry.update({
      where: { id: entry.id },
      data: {
        reviewed: data.reply !== undefined ? true : data.reviewed,
        reply: data.reply,
        transcript: data.transcript,
        ...(data.transcript !== undefined ? { transcriptStatus: 'done' } : {}),
      },
      include: audioMeta,
    })
    res.json(updated)
  }),
)
