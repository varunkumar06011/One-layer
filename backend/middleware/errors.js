import { randomUUID } from 'node:crypto'

import { config } from '../config/env.js'

/**
 * An error whose message is safe to show to a client.
 * Anything thrown that is not an AppError becomes a generic 500.
 */
export class AppError extends Error {
  constructor(status, message, code, details) {
    super(message)
    this.status = status
    this.code = code || 'ERROR'
    this.details = details
  }
}

export const badRequest = (message, details) => new AppError(400, message, 'BAD_REQUEST', details)
export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, message, 'UNAUTHENTICATED')
export const forbidden = (message = 'You do not have access to this resource') =>
  new AppError(403, message, 'FORBIDDEN')
export const notFound = (message = 'Not found') => new AppError(404, message, 'NOT_FOUND')
export const conflict = (message, code = 'CONFLICT') => new AppError(409, message, code)

export function requestId(req, res, next) {
  req.id = randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}

export function notFoundHandler(req, res, next) {
  next(notFound())
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(err, req, res, next) {
  const status = err instanceof AppError ? err.status : 500

  if (status >= 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: config.isProduction ? undefined : err.stack,
      })
    )
  }

  const body =
    err instanceof AppError
      ? { error: err.message, code: err.code, requestId: req.id }
      : { error: 'Something went wrong', code: 'INTERNAL_ERROR', requestId: req.id }

  if (err instanceof AppError && err.details) {
    body.details = err.details
  }

  res.status(status).json(body)
}
