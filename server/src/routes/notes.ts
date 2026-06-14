import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const notesRouter = Router()
notesRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedNote(req: Request) {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!note) throw new HttpError(404, 'Нотатку не знайдено')
  return note
}

notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: { practitionerId: string; clientId?: string } = { practitionerId: practitionerId(req) }
    if (typeof req.query.clientId === 'string') where.clientId = req.query.clientId
    const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(notes)
  }),
)

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(''),
  clientId: z.string().nullish(),
})

notesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const note = await prisma.note.create({
      data: {
        title: data.title,
        body: data.body,
        clientId: data.clientId ?? undefined,
        practitionerId: practitionerId(req),
      },
    })
    res.status(201).json(note)
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
