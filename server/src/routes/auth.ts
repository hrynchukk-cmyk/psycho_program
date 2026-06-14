import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, HttpError } from '../lib/http.js'
import { authenticate, signToken, type AuthPayload } from '../lib/auth.js'

export const authRouter = Router()

const publicUser = (u: { id: string; email: string; role: string; firstName: string; lastName: string }) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

// Реєстрація психолога (власника робочого простору).
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: 'PRACTITIONER',
        firstName: data.firstName,
        lastName: data.lastName,
      },
    })
    const token = signToken({ sub: user.id, role: user.role })
    res.status(201).json({ token, user: publicUser(user) })
  }),
)

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { clientProfile: { select: { id: true } } },
    })
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new HttpError(401, 'Невірний email або пароль')
    }
    const payload: AuthPayload = { sub: user.id, role: user.role }
    if (user.role === 'CLIENT' && user.clientProfile) payload.clientId = user.clientProfile.id
    res.json({ token: signToken(payload), user: publicUser(user) })
  }),
)

const claimSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Клієнт «активує» свій акаунт для мобільного додатка за email, на який його
// запросив психолог. Працює лише якщо профіль ще не прив'язаний до акаунта.
authRouter.post(
  '/client/claim',
  asyncHandler(async (req, res) => {
    const data = claimSchema.parse(req.body)
    const email = data.email.toLowerCase()
    const client = await prisma.client.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, userId: null },
      orderBy: { createdAt: 'asc' },
    })
    if (!client) {
      throw new HttpError(404, 'Запрошення для цього email не знайдено')
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new HttpError(409, 'Акаунт із таким email вже існує')

    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'CLIENT',
        firstName: client.firstName,
        lastName: client.lastName,
      },
    })
    await prisma.client.update({
      where: { id: client.id },
      data: { userId: user.id, status: 'ACTIVE' },
    })
    const token = signToken({ sub: user.id, role: 'CLIENT', clientId: client.id })
    res.status(201).json({ token, user: publicUser(user) })
  }),
)

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
      include: { clientProfile: { select: { id: true } } },
    })
    if (!user) throw new HttpError(404, 'Користувача не знайдено')
    res.json({ user: publicUser(user), clientId: user.clientProfile?.id ?? null })
  }),
)
