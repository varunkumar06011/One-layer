import { Router } from 'express'
import { z } from 'zod'

import { config } from '../config/env.js'
import { requireAdmin } from '../middleware/auth.js'
import { AppError, unauthorized } from '../middleware/errors.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { ROOT_ADMIN, verifyAdminPassword } from '../security/adminCredentials.js'
import {
  REFRESH_COOKIE,
  REFRESH_RESULT,
  issueAccessToken,
  issueRefreshToken,
  refreshCookieOptions,
  revokeToken,
  rotateRefreshToken,
} from '../security/adminTokens.js'
import { AUDIT_EVENTS, audit } from '../security/audit.js'
import { lockoutRemaining, recordFailure, recordSuccess } from '../security/loginThrottle.js'

const router = Router()

const loginSchema = z
  .object({ password: z.string().min(1).max(200) })
  .strict()

async function startSession(res, admin) {
  const accessToken = await issueAccessToken({ subject: admin.id, role: admin.role })
  const { token: refreshToken } = issueRefreshToken({ subject: admin.id, role: admin.role })
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  return { accessToken, expiresIn: config.admin.accessTokenTtl, role: admin.role }
}

// POST /api/admin/login
router.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res, next) => {
  const throttleKey = `admin:${req.ip}`
  const locked = lockoutRemaining(throttleKey)
  if (locked > 0) {
    audit(AUDIT_EVENTS.ADMIN_LOGIN_LOCKED, { req, actorType: 'admin', metadata: { retryAfter: locked } })
    res.setHeader('Retry-After', String(locked))
    return next(new AppError(429, 'Too many failed attempts. Try again later.', 'LOCKED_OUT'))
  }

  try {
    const ok = await verifyAdminPassword(req.body.password)
    if (!ok) {
      const failures = recordFailure(throttleKey)
      audit(AUDIT_EVENTS.ADMIN_LOGIN_FAILURE, { req, actorType: 'admin', metadata: { failures } })
      return next(unauthorized('Invalid credentials'))
    }

    recordSuccess(throttleKey)
    audit(AUDIT_EVENTS.ADMIN_LOGIN_SUCCESS, { req, actorId: ROOT_ADMIN.id, actorType: 'admin' })
    res.json(await startSession(res, ROOT_ADMIN))
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/refresh — rotates the refresh token, issues a new access token
router.post('/refresh', authLimiter, async (req, res, next) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (!token) return next(unauthorized())

  const rotated = rotateRefreshToken(token)
  if (rotated.result === REFRESH_RESULT.REUSED) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions())
    audit(AUDIT_EVENTS.ADMIN_REFRESH_REUSE, { req, actorId: rotated.subject, actorType: 'admin' })
    return next(unauthorized('Session revoked'))
  }
  if (rotated.result !== REFRESH_RESULT.OK) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions())
    return next(unauthorized('Invalid or expired session'))
  }

  try {
    res.cookie(REFRESH_COOKIE, rotated.token, refreshCookieOptions())
    res.json({
      accessToken: await issueAccessToken({ subject: rotated.subject, role: rotated.role }),
      expiresIn: config.admin.accessTokenTtl,
      role: rotated.role,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/logout — revokes the whole refresh-token family
router.post('/logout', (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (token) revokeToken(token)
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions())
  audit(AUDIT_EVENTS.ADMIN_LOGOUT, { req, actorType: 'admin' })
  res.json({ ok: true })
})

// GET /api/admin/verify
router.get('/verify', requireAdmin, (req, res) => {
  res.json({ valid: true, role: req.admin.role })
})

export default router
