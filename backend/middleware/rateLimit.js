import rateLimit from 'express-rate-limit'

const shared = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again later.', code: 'RATE_LIMITED' },
}

/** Broad ceiling for every API route. */
export const generalLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 300 })

/** Anything that creates or mutates customer-visible data. */
export const writeLimiter = rateLimit({ ...shared, windowMs: 15 * 60 * 1000, limit: 20 })

/** Credential endpoints: login, OTP, password reset. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
})
