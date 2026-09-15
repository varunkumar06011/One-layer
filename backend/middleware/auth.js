import { createRemoteJWKSet, jwtVerify } from 'jose'

import { config } from '../config/env.js'
import { ROLES, roleAtLeast } from '../security/roles.js'
import { verifyAccessToken } from '../security/adminTokens.js'
import { AppError, forbidden, unauthorized } from './errors.js'

function bearerToken(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token.length > 0 ? token : null
}

/** Admin API: verified JWT with the admin audience. Customer tokens cannot pass here. */
export async function requireAdmin(req, res, next) {
  const token = bearerToken(req)
  if (!token) return next(unauthorized())
  try {
    const payload = await verifyAccessToken(token)
    req.admin = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(unauthorized('Invalid or expired session'))
  }
}

/** Role gate for admin routes. Use the weakest role that can do the job. */
export function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.admin) return next(unauthorized())
    if (!roleAtLeast(req.admin.role, minimumRole)) return next(forbidden())
    next()
  }
}

let jwks = null
function supabaseJwks() {
  if (!jwks && config.supabase.url) {
    jwks = createRemoteJWKSet(new URL(`${config.supabase.url}/auth/v1/.well-known/jwks.json`))
  }
  return jwks
}

async function verifySupabaseToken(token) {
  if (config.supabase.jwtSecret) {
    const secret = new TextEncoder().encode(config.supabase.jwtSecret)
    const { payload } = await jwtVerify(token, secret, { audience: 'authenticated' })
    return payload
  }
  const keys = supabaseJwks()
  if (!keys) {
    throw new AppError(503, 'Customer authentication is not configured', 'AUTH_UNAVAILABLE')
  }
  const { payload } = await jwtVerify(token, keys, { audience: 'authenticated' })
  return payload
}

/**
 * Customer identity from a verified Supabase access token.
 * The user id always comes from the token — never from the request body.
 */
export async function requireCustomer(req, res, next) {
  const token = bearerToken(req)
  if (!token) return next(unauthorized())
  try {
    const payload = await verifySupabaseToken(token)
    req.user = { id: payload.sub, email: payload.email, role: ROLES.CUSTOMER }
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(unauthorized('Invalid or expired session'))
  }
}

/** Attaches req.user when a valid token is present, but does not require one. */
export async function optionalCustomer(req, res, next) {
  const token = bearerToken(req)
  if (!token) return next()
  try {
    const payload = await verifySupabaseToken(token)
    req.user = { id: payload.sub, email: payload.email, role: ROLES.CUSTOMER }
  } catch {
    // An unusable token is treated as no token; protected routes still 401.
  }
  next()
}
