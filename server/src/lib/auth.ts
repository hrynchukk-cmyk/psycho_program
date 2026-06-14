import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from './env.js'
import { HttpError } from './http.js'

export interface AuthPayload {
  sub: string
  role: Role
  // Для користувача-клієнта — id його профілю Client (для прив'язки записів).
  clientId?: string
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

// Розширюємо Request полем auth після перевірки токена.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Потрібна авторизація')
  }
  const token = header.slice('Bearer '.length)
  try {
    req.auth = jwt.verify(token, env.jwtSecret) as AuthPayload
    next()
  } catch {
    throw new HttpError(401, 'Недійсний або прострочений токен')
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new HttpError(403, 'Недостатньо прав')
    }
    next()
  }
}

// Id психолога з токена (для скоупінгу всіх запитів психолога).
export function practitionerId(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Потрібна авторизація')
  return req.auth.sub
}
