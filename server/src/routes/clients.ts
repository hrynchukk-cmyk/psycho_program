import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const clientsRouter = Router()
clientsRouter.use(authenticate, requireRole('PRACTITIONER'))

// Перевіряє, що клієнт належить поточному психологу.
async function ownedClient(req: import('express').Request) {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!client) throw new HttpError(404, 'Клієнта не знайдено')
  return client
}

clientsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({
      where: { practitionerId: practitionerId(req) },
      orderBy: { createdAt: 'desc' },
      include: { memberships: { select: { groupId: true } } },
    })
    res.json(clients)
  }),
)

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().default(''),
  email: z.string().email(),
})

clientsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const client = await prisma.client.create({
      data: { ...data, status: 'INVITED', practitionerId: practitionerId(req) },
    })
    res.status(201).json(client)
  }),
)

clientsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedClient(req)
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        memberships: { include: { group: true } },
        journalEntries: { orderBy: { createdAt: 'desc' } },
        tasks: true,
        notes: { orderBy: { createdAt: 'desc' } },
        deliveries: true,
        resourceShares: { include: { resource: true } },
      },
    })
    res.json(client)
  }),
)

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['INVITED', 'ACTIVE', 'ARCHIVED']).optional(),
})

clientsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedClient(req)
    const data = updateSchema.parse(req.body)
    const client = await prisma.client.update({ where: { id: req.params.id }, data })
    res.json(client)
  }),
)

clientsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedClient(req)
    await prisma.client.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
