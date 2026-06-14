import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const resourcesRouter = Router()
resourcesRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedResource(req: Request) {
  const resource = await prisma.resource.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!resource) throw new HttpError(404, 'Ресурс не знайдено')
  return resource
}

resourcesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const resources = await prisma.resource.findMany({
      where: { practitionerId: practitionerId(req) },
      orderBy: { createdAt: 'desc' },
      include: { shares: { select: { clientId: true } } },
    })
    res.json(resources)
  }),
)

const createSchema = z.object({
  kind: z.enum(['FILE', 'LINK']),
  name: z.string().min(1),
  url: z.string().optional(),
  fileType: z.string().optional(),
  size: z.string().optional(),
})

resourcesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const resource = await prisma.resource.create({
      data: { ...data, practitionerId: practitionerId(req) },
    })
    res.status(201).json(resource)
  }),
)

resourcesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedResource(req)
    await prisma.resource.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

// Замінити список клієнтів, які мають доступ до ресурсу.
resourcesRouter.put(
  '/:id/shares',
  asyncHandler(async (req, res) => {
    const resource = await ownedResource(req)
    const { clientIds } = z.object({ clientIds: z.array(z.string()) }).parse(req.body)
    // Лише клієнти цього психолога.
    const valid = await prisma.client.findMany({
      where: { id: { in: clientIds }, practitionerId: practitionerId(req) },
      select: { id: true },
    })
    await prisma.$transaction([
      prisma.resourceShare.deleteMany({ where: { resourceId: resource.id } }),
      prisma.resourceShare.createMany({
        data: valid.map((c) => ({ resourceId: resource.id, clientId: c.id })),
      }),
    ])
    const updated = await prisma.resource.findUnique({
      where: { id: resource.id },
      include: { shares: { select: { clientId: true } } },
    })
    res.json(updated)
  }),
)
