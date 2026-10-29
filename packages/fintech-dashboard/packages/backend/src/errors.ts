import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  public status: number
  public data?: unknown

  constructor(message: string, status = 400, data?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.data = data
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, data: err.data ?? null })
  } else {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
