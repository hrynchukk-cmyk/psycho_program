import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const groupsRouter = Router()
groupsRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedGroup(req: Request) {
  const group = await prisma.group.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!group) throw new HttpError(404, 'Групу не знайдено')
  return group
}

groupsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const groups = await prisma.group.findMany({
      where: { practitionerId: practitionerId(req) },
      orderBy: { createdAt: 'desc' },
      include: { members: { select: { clientId: true } } },
    })
    res.json(groups)
  }),
)

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
})

groupsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const group = await prisma.group.create({
      data: { ...data, practitionerId: practitionerId(req) },
    })
    res.status(201).json(group)
  }),
)

groupsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedGroup(req)
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: { include: { client: true } } },
    })
    res.json(group)
  }),
)

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  autoSendEnabled: z.boolean().optional(),
  autoSendActivityIds: z.array(z.string()).optional(),
  autoSendProgramIds: z.array(z.string()).optional(),
})

groupsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedGroup(req)
    const data = updateSchema.parse(req.body)
    const group = await prisma.group.update({ where: { id: req.params.id }, data })
    res.json(group)
  }),
)

groupsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedGroup(req)
    await prisma.group.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

// Додати учасника. Якщо в групи увімкнено авто-надсилання — новому учаснику
// одразу створюються доставки обраних активностей і програм (логіка Quenza).
groupsRouter.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const group = await ownedGroup(req)
    const { clientId } = z.object({ clientId: z.string() }).parse(req.body)
    const client = await prisma.client.findFirst({
      where: { id: clientId, practitionerId: practitionerId(req) },
    })
    if (!client) throw new HttpError(404, 'Клієнта не знайдено')

    await prisma.groupMember.upsert({
      where: { groupId_clientId: { groupId: group.id, clientId } },
      create: { groupId: group.id, clientId },
      update: {},
    })

    if (group.autoSendEnabled) {
      const deliveries = [
        ...group.autoSendActivityIds.map((refId) => ({ kind: 'ACTIVITY' as const, refId, clientId })),
        ...group.autoSendProgramIds.map((refId) => ({ kind: 'PROGRAM' as const, refId, clientId })),
      ]
      if (deliveries.length) await prisma.delivery.createMany({ data: deliveries })
    }

    res.status(201).json({ ok: true, autoSent: group.autoSendEnabled })
  }),
)

groupsRouter.delete(
  '/:id/members/:clientId',
  asyncHandler(async (req, res) => {
    const group = await ownedGroup(req)
    await prisma.groupMember.delete({
      where: { groupId_clientId: { groupId: group.id, clientId: req.params.clientId } },
    })
    res.status(204).end()
  }),
)
