import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const programsRouter = Router()
programsRouter.use(authenticate, requireRole('PRACTITIONER'))

const stepSchema = z.object({
  activityId: z.string(),
  mode: z.enum(['IMMEDIATELY', 'AFTER_PREVIOUS', 'AFTER_START']).default('AFTER_PREVIOUS'),
  days: z.number().int().min(0).default(0),
})

const withSteps = { steps: { orderBy: { order: 'asc' } } } as const

function visibleWhere(req: Request) {
  return { OR: [{ practitionerId: practitionerId(req) }, { isPremade: true, practitionerId: null }] }
}

async function ownedProgram(req: Request) {
  const program = await prisma.program.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!program) throw new HttpError(404, 'Програму не знайдено або вона лише для читання')
  return program
}

programsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const programs = await prisma.program.findMany({
      where: visibleWhere(req),
      orderBy: { updatedAt: 'desc' },
      include: withSteps,
    })
    res.json(programs)
  }),
)

programsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const program = await prisma.program.findFirst({
      where: { id: req.params.id, ...visibleWhere(req) },
      include: withSteps,
    })
    if (!program) throw new HttpError(404, 'Програму не знайдено')
    res.json(program)
  }),
)

const createSchema = z.object({
  title: z.string().default('Нова програма'),
  description: z.string().default(''),
  steps: z.array(stepSchema).default([]),
})

programsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const program = await prisma.program.create({
      data: {
        title: data.title,
        description: data.description,
        practitionerId: practitionerId(req),
        steps: { create: data.steps.map((s, order) => ({ ...s, order })) },
      },
      include: withSteps,
    })
    res.status(201).json(program)
  }),
)

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  steps: z.array(stepSchema).optional(),
})

programsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedProgram(req)
    const data = updateSchema.parse(req.body)
    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        description: data.description,
        ...(data.steps
          ? { steps: { deleteMany: {}, create: data.steps.map((s, order) => ({ ...s, order })) } }
          : {}),
      },
      include: withSteps,
    })
    res.json(program)
  }),
)

programsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedProgram(req)
    await prisma.program.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

programsRouter.post(
  '/:id/copy',
  asyncHandler(async (req, res) => {
    const src = await prisma.program.findFirst({
      where: { id: req.params.id, ...visibleWhere(req) },
      include: withSteps,
    })
    if (!src) throw new HttpError(404, 'Програму не знайдено')
    const copy = await prisma.program.create({
      data: {
        title: `${src.title} (копія)`,
        description: src.description,
        isPremade: false,
        practitionerId: practitionerId(req),
        steps: {
          create: src.steps.map((s) => ({
            activityId: s.activityId,
            mode: s.mode,
            days: s.days,
            order: s.order,
          })),
        },
      },
      include: withSteps,
    })
    res.status(201).json(copy)
  }),
)
