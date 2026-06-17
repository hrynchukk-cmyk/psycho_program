import { Router, type Request } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, requireRole } from '../lib/auth.js'

// Окремий API для клієнтського (мобільного) застосунку. Усе скоупиться під
// профіль клієнта з токена. JSON нормалізований (нижній регістр enum-ів),
// щоб мобілці не потрібні були додаткові адаптери.
export const clientRouter = Router()
clientRouter.use(authenticate, requireRole('CLIENT'))

function myClientId(req: Request): string {
  const id = req.auth?.clientId
  if (!id) throw new HttpError(400, 'Акаунт не привʼязаний до профілю клієнта')
  return id
}

const lc = (s: string) => s.toLowerCase()
const EL: Record<string, string> = {
  SECTION: 'section',
  TEXT: 'text',
  SHORT_ANSWER: 'shortAnswer',
  LONG_ANSWER: 'longAnswer',
  MULTIPLE_CHOICE: 'multipleChoice',
  SCALE: 'scale',
  VIDEO: 'video',
  IMAGE: 'image',
  PAGE_BREAK: 'pageBreak',
  BREATHING: 'breathing',
}
const MODE: Record<string, string> = {
  IMMEDIATELY: 'immediately',
  AFTER_PREVIOUS: 'afterPrevious',
  AFTER_START: 'afterStart',
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const normElement = (e: any) => ({ id: e.id, type: EL[e.type], title: e.title, options: e.options ?? [] })
const normActivity = (a: any) => ({
  id: a.id,
  title: a.title,
  description: a.description ?? '',
  pageBreaksEnabled: a.pageBreaksEnabled,
  elements: (a.elements ?? []).map(normElement),
})

// Профіль клієнта + імʼя його психолога.
clientRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const client = await prisma.client.findUnique({
      where: { id: myClientId(req) },
      include: { practitioner: { select: { firstName: true, lastName: true } } },
    })
    if (!client) throw new HttpError(404, 'Профіль не знайдено')
    res.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      practitioner: client.practitioner ? `${client.practitioner.firstName} ${client.practitioner.lastName}` : null,
    })
  }),
)

// Усі призначення (активності та програми), надіслані клієнту, з деталями.
clientRouter.get(
  '/deliveries',
  asyncHandler(async (req, res) => {
    const cid = myClientId(req)
    const deliveries = await prisma.delivery.findMany({ where: { clientId: cid }, orderBy: { sentAt: 'desc' } })

    const activityIds = deliveries.filter((d) => d.kind === 'ACTIVITY').map((d) => d.refId)
    const programIds = deliveries.filter((d) => d.kind === 'PROGRAM').map((d) => d.refId)

    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds } },
      include: { elements: { orderBy: { order: 'asc' } } },
    })
    const programs = await prisma.program.findMany({
      where: { id: { in: programIds } },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    const stepActivityIds = programs.flatMap((p) => p.steps.map((s) => s.activityId))
    const stepActivities = await prisma.activity.findMany({
      where: { id: { in: stepActivityIds } },
      select: { id: true, title: true, description: true },
    })

    const actMap = new Map(activities.map((a) => [a.id, a]))
    const progMap = new Map(programs.map((p) => [p.id, p]))
    const stepActMap = new Map(stepActivities.map((a) => [a.id, a]))

    const result = deliveries.map((d) => {
      const base = {
        id: d.id,
        kind: lc(d.kind),
        status: d.status === 'IN_PROGRESS' ? 'inProgress' : lc(d.status),
        sentAt: d.sentAt,
        completedAt: d.completedAt ?? undefined,
        responses: (d.responses as any) ?? undefined,
      }
      if (d.kind === 'ACTIVITY') {
        const a = actMap.get(d.refId)
        return { ...base, activity: a ? normActivity(a) : null }
      }
      const p = progMap.get(d.refId)
      return {
        ...base,
        program: p
          ? {
              id: p.id,
              title: p.title,
              description: p.description ?? '',
              steps: p.steps.map((s) => ({
                id: s.id,
                activityId: s.activityId,
                mode: MODE[s.mode],
                days: s.days,
                activityTitle: stepActMap.get(s.activityId)?.title ?? 'Активність',
                activityDescription: stepActMap.get(s.activityId)?.description ?? '',
              })),
            }
          : null,
      }
    })
    res.json(result)
  }),
)

// Чи має клієнт доступ до активності (надіслана напряму або в межах програми).
async function clientHasActivityAccess(cid: string, activityId: string): Promise<boolean> {
  const direct = await prisma.delivery.findFirst({ where: { clientId: cid, kind: 'ACTIVITY', refId: activityId } })
  if (direct) return true
  const programDeliveries = await prisma.delivery.findMany({
    where: { clientId: cid, kind: 'PROGRAM' },
    select: { refId: true },
  })
  const programIds = programDeliveries.map((d) => d.refId)
  if (programIds.length === 0) return false
  const inProgram = await prisma.programStep.findFirst({ where: { programId: { in: programIds }, activityId } })
  return !!inProgram
}

// Деталі активності — лише якщо вона призначена клієнту (напряму або в межах програми).
clientRouter.get(
  '/activities/:id',
  asyncHandler(async (req, res) => {
    const cid = myClientId(req)
    const activityId = req.params.id
    if (!(await clientHasActivityAccess(cid, activityId))) throw new HttpError(404, 'Активність недоступна')

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { elements: { orderBy: { order: 'asc' } } },
    })
    if (!activity) throw new HttpError(404, 'Активність не знайдено')
    res.json(normActivity(activity))
  }),
)

// Клієнт надсилає відповіді й завершує активність.
const completeSchema = z.object({
  responses: z.array(z.object({ elementId: z.string(), answer: z.string() })).default([]),
})
clientRouter.post(
  '/deliveries/:id/complete',
  asyncHandler(async (req, res) => {
    const cid = myClientId(req)
    const delivery = await prisma.delivery.findFirst({ where: { id: req.params.id, clientId: cid } })
    if (!delivery) throw new HttpError(404, 'Призначення не знайдено')
    if (delivery.kind !== 'ACTIVITY') throw new HttpError(400, 'Завершувати можна лише активності')

    const data = completeSchema.parse(req.body)
    const updated = await prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'COMPLETED', completedAt: new Date(), responses: data.responses },
    })
    res.json({ id: updated.id, status: lc(updated.status) })
  }),
)

// Завершити активність за її id. Працює і для кроку програми (де окремої
// доставки ще немає) — створює доставку за потреби.
clientRouter.post(
  '/activities/:id/complete',
  asyncHandler(async (req, res) => {
    const cid = myClientId(req)
    const activityId = req.params.id
    if (!(await clientHasActivityAccess(cid, activityId))) throw new HttpError(404, 'Активність недоступна')

    const data = completeSchema.parse(req.body)
    const existing = await prisma.delivery.findFirst({
      where: { clientId: cid, kind: 'ACTIVITY', refId: activityId },
      orderBy: { sentAt: 'desc' },
    })
    const delivery = existing
      ? await prisma.delivery.update({
          where: { id: existing.id },
          data: { status: 'COMPLETED', completedAt: new Date(), responses: data.responses },
        })
      : await prisma.delivery.create({
          data: { clientId: cid, kind: 'ACTIVITY', refId: activityId, status: 'COMPLETED', completedAt: new Date(), responses: data.responses },
        })
    res.json({ id: delivery.id, status: lc(delivery.status) })
  }),
)

// Матеріали, якими психолог поділився з клієнтом.
clientRouter.get(
  '/resources',
  asyncHandler(async (req, res) => {
    const cid = myClientId(req)
    const shares = await prisma.resourceShare.findMany({
      where: { clientId: cid },
      include: { resource: true },
      orderBy: { resource: { createdAt: 'desc' } },
    })
    res.json(
      shares.map((s) => ({
        id: s.resource.id,
        kind: lc(s.resource.kind),
        name: s.resource.name,
        url: s.resource.url ?? undefined,
        fileType: s.resource.fileType ?? undefined,
        size: s.resource.size ?? undefined,
        createdAt: s.resource.createdAt,
      })),
    )
  }),
)
