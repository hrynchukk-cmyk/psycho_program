import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, practitionerId, requireRole } from '../lib/auth.js'

export const activitiesRouter = Router()
activitiesRouter.use(authenticate, requireRole('PRACTITIONER'))

const elementTypes = [
  'SECTION',
  'TEXT',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'SCALE',
  'VIDEO',
  'IMAGE',
  'PAGE_BREAK',
] as const

const elementSchema = z.object({
  type: z.enum(elementTypes),
  title: z.string().default(''),
  options: z.array(z.string()).default([]),
})

const withElements = { elements: { orderBy: { order: 'asc' } } } as const

// Психолог бачить власні активності + готовий контент (premade) без власника.
function visibleWhere(req: Request) {
  return { OR: [{ practitionerId: practitionerId(req) }, { isPremade: true, practitionerId: null }] }
}

async function ownedActivity(req: Request) {
  const activity = await prisma.activity.findFirst({
    where: { id: req.params.id, practitionerId: practitionerId(req) },
  })
  if (!activity) throw new HttpError(404, 'Активність не знайдено або вона лише для читання')
  return activity
}

activitiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const activities = await prisma.activity.findMany({
      where: visibleWhere(req),
      orderBy: { updatedAt: 'desc' },
      include: withElements,
    })
    res.json(activities)
  }),
)

activitiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const activity = await prisma.activity.findFirst({
      where: { id: req.params.id, ...visibleWhere(req) },
      include: withElements,
    })
    if (!activity) throw new HttpError(404, 'Активність не знайдено')
    res.json(activity)
  }),
)

const createSchema = z.object({
  title: z.string().default('Нова активність'),
  description: z.string().default(''),
  pageBreaksEnabled: z.boolean().default(false),
  elements: z.array(elementSchema).default([]),
})

activitiesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const activity = await prisma.activity.create({
      data: {
        title: data.title,
        description: data.description,
        pageBreaksEnabled: data.pageBreaksEnabled,
        practitionerId: practitionerId(req),
        elements: { create: data.elements.map((el, order) => ({ ...el, order })) },
      },
      include: withElements,
    })
    res.status(201).json(activity)
  }),
)

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  pageBreaksEnabled: z.boolean().optional(),
  elements: z.array(elementSchema).optional(),
})

activitiesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedActivity(req)
    const data = updateSchema.parse(req.body)
    // Якщо передано elements — повністю замінюємо набір елементів.
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        description: data.description,
        pageBreaksEnabled: data.pageBreaksEnabled,
        ...(data.elements
          ? {
              elements: {
                deleteMany: {},
                create: data.elements.map((el, order) => ({ ...el, order })),
              },
            }
          : {}),
      },
      include: withElements,
    })
    res.json(activity)
  }),
)

activitiesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ownedActivity(req)
    await prisma.activity.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

// Скопіювати готову (або будь-яку видиму) активність до власних — щоб редагувати.
activitiesRouter.post(
  '/:id/copy',
  asyncHandler(async (req, res) => {
    const src = await prisma.activity.findFirst({
      where: { id: req.params.id, ...visibleWhere(req) },
      include: withElements,
    })
    if (!src) throw new HttpError(404, 'Активність не знайдено')
    const copy = await prisma.activity.create({
      data: {
        title: `${src.title} (копія)`,
        description: src.description,
        pageBreaksEnabled: src.pageBreaksEnabled,
        category: src.category,
        assessmentKey: src.assessmentKey,
        isPremade: false,
        practitionerId: practitionerId(req),
        elements: {
          create: src.elements.map((el) => ({
            type: el.type,
            title: el.title,
            options: el.options,
            order: el.order,
          })),
        },
      },
      include: withElements,
    })
    res.status(201).json(copy)
  }),
)
