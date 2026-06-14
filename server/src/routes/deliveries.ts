import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const deliveriesRouter = Router()
deliveriesRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedDelivery(req: Request) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: req.params.id, client: { practitionerId: practitionerId(req) } },
  })
  if (!delivery) throw new HttpError(404, 'Доставку не знайдено')
  return delivery
}

deliveriesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: { client: { practitionerId: string }; clientId?: string } = {
      client: { practitionerId: practitionerId(req) },
    }
    if (typeof req.query.clientId === 'string') where.clientId = req.query.clientId
    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    })
    res.json(deliveries)
  }),
)

deliveriesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedDelivery(req)
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    })
    res.json(delivery)
  }),
)

// Надіслати активність/програму одному або кільком клієнтам.
const sendSchema = z.object({
  kind: z.enum(['ACTIVITY', 'PROGRAM']),
  refId: z.string(),
  clientIds: z.array(z.string()).min(1),
})

deliveriesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = sendSchema.parse(req.body)
    const owned = await prisma.client.findMany({
      where: { id: { in: data.clientIds }, practitionerId: practitionerId(req) },
      select: { id: true },
    })
    if (owned.length === 0) throw new HttpError(404, 'Клієнтів не знайдено')
    await prisma.delivery.createMany({
      data: owned.map((c) => ({ kind: data.kind, refId: data.refId, clientId: c.id })),
    })
    res.status(201).json({ ok: true, sent: owned.length })
  }),
)

// Повторно відкрити завершену активність для оновлення клієнтом.
deliveriesRouter.post(
  '/:id/reopen',
  asyncHandler(async (req, res) => {
    await ownedDelivery(req)
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', completedAt: null },
    })
    res.json(delivery)
  }),
)

// Додати коментар у гілку (від психолога).
const commentSchema = z.object({
  elementId: z.string().nullish(),
  text: z.string().min(1),
})

deliveriesRouter.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const delivery = await ownedDelivery(req)
    const data = commentSchema.parse(req.body)
    const comment = await prisma.threadComment.create({
      data: {
        deliveryId: delivery.id,
        elementId: data.elementId ?? null,
        author: 'PRACTITIONER',
        text: data.text,
      },
    })
    res.status(201).json(comment)
  }),
)
