import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

// Помилка з HTTP-статусом, яку можна кидати з будь-якого хендлера.
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Обгортка для async-хендлерів: ловить reject і передає в error middleware.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  // Порушення унікальності Prisma (напр. дубль email).
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002') {
    return res.status(409).json({ error: 'Запис із такими даними вже існує' })
  }
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2025') {
    return res.status(404).json({ error: 'Запис не знайдено' })
  }
  console.error(err)
  return res.status(500).json({ error: 'Внутрішня помилка сервера' })
}
