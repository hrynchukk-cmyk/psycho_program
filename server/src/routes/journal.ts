import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId } from '../lib/auth.js'

export const journalRouter = Router()
journalRouter.use(authenticate)

const moods = ['GREAT', 'GOOD', 'NEUTRAL', 'LOW', 'BAD'] as const

// GET /api/journal
// Психолог: усі записи його клієнтів (з фільтрами). Клієнт: лише власні.
journalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.auth!.role === 'CLIENT') {
      const entries = await prisma.journalEntry.findMany({
        where: { clientId: req.auth!.clientId },
        orderBy: { createdAt: 'desc' },
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
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    })
    res.json(entries)
  }),
)

const createSchema = z.object({
  mood: z.enum(moods),
  title: z.string().optional(),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
  date: z.string().datetime().optional(),
  // Психолог може вказати клієнта; клієнт завжди пише за себе.
  clientId: z.string().optional(),
})

// POST /api/journal — створення запису. Основний сценарій: клієнт з мобільного додатка.
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

    const entry = await prisma.journalEntry.create({
      data: {
        clientId,
        mood: data.mood,
        title: data.title,
        body: data.body,
        tags: data.tags,
        date: data.date ? new Date(data.date) : undefined,
      },
    })
    res.status(201).json(entry)
  }),
)

const reviewSchema = z.object({
  reviewed: z.boolean().optional(),
  reply: z.string().optional(),
})

// PATCH /api/journal/:id — психолог позначає переглянутим та/або відповідає.
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
      },
    })
    res.json(updated)
  }),
)
