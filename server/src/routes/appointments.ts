import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

// Календар відвідувань психолога. Усе скоупиться під practitionerId з токена.
export const appointmentsRouter = Router()
appointmentsRouter.use(authenticate, requireRole('PRACTITIONER'))

const statuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const

async function ownedAppointment(req: Request) {
  const appt = await prisma.appointment.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!appt) throw new HttpError(404, 'Запис не знайдено')
  return appt
}

// GET /api/appointments?from=ISO&to=ISO — список у діапазоні (або всі).
appointmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: { practitionerId: string; startAt?: { gte?: Date; lte?: Date } } = {
      practitionerId: practitionerId(req),
    }
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined
    if (from || to) where.startAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    const appts = await prisma.appointment.findMany({ where, orderBy: { startAt: 'asc' } })
    res.json(appts)
  }),
)

const createSchema = z.object({
  startAt: z.string().datetime(),
  durationMin: z.number().int().positive().max(600).default(50),
  clientId: z.string().nullish(),
  note: z.string().optional(),
  status: z.enum(statuses).optional(),
})

appointmentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    // Якщо вказано клієнта — перевіряємо, що він належить цьому психологу.
    if (data.clientId) {
      const owned = await prisma.client.findFirst({
        where: { id: data.clientId, practitionerId: practitionerId(req) },
      })
      if (!owned) throw new HttpError(404, 'Клієнта не знайдено')
    }
    const appt = await prisma.appointment.create({
      data: {
        startAt: new Date(data.startAt),
        durationMin: data.durationMin,
        clientId: data.clientId ?? null,
        note: data.note,
        status: data.status ?? 'SCHEDULED',
        practitionerId: practitionerId(req),
      },
    })
    res.status(201).json(appt)
  }),
)

const updateSchema = z.object({
  startAt: z.string().datetime().optional(),
  durationMin: z.number().int().positive().max(600).optional(),
  clientId: z.string().nullish(),
  note: z.string().nullish(),
  status: z.enum(statuses).optional(),
})

appointmentsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedAppointment(req)
    const data = updateSchema.parse(req.body)
    if (data.clientId) {
      const owned = await prisma.client.findFirst({
        where: { id: data.clientId, practitionerId: practitionerId(req) },
      })
      if (!owned) throw new HttpError(404, 'Клієнта не знайдено')
    }
    const appt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        durationMin: data.durationMin,
        clientId: data.clientId === null ? null : data.clientId,
        note: data.note === null ? null : data.note,
        status: data.status,
      },
    })
    res.json(appt)
  }),
)

appointmentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedAppointment(req)
    await prisma.appointment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
