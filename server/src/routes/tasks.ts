import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const tasksRouter = Router()
tasksRouter.use(authenticate, requireRole('PRACTITIONER'))

async function ownedTask(req: Request) {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!task) throw new HttpError(404, 'Задачу не знайдено')
  return task
}

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { practitionerId: practitionerId(req) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(tasks)
  }),
)

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().nullish(),
  dueDate: z.string().datetime().nullish(),
})

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? undefined,
        clientId: data.clientId ?? undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        practitionerId: practitionerId(req),
      },
    })
    res.status(201).json(task)
  }),
)

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullish(),
  done: z.boolean().optional(),
  clientId: z.string().nullish(),
  dueDate: z.string().datetime().nullish(),
})

tasksRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedTask(req)
    const data = updateSchema.parse(req.body)
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        description: data.description === null ? null : data.description,
        done: data.done,
        clientId: data.clientId === null ? null : data.clientId,
        dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
    res.json(task)
  }),
)

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedTask(req)
    await prisma.task.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
