import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { SignJWT, jwtVerify } from 'jose'

import { config } from '../config/env.js'

export const ADMIN_AUDIENCE = 'one-layer-admin'
const ISSUER = 'one-layer-api'

// Dev-only fallback so the server runs without secrets locally; production
// startup already refuses to boot without ADMIN_JWT_SECRET.
const secret = new TextEncoder().encode(config.admin.jwtSecret || randomBytes(32).toString('hex'))

export async function issueAccessToken({ subject, role }) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setAudience(ADMIN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${config.admin.accessTokenTtl}s`)
    .sign(secret)
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, audience: ADMIN_AUDIENCE })
  return payload
}

/**
 * Opaque refresh tokens, stored hashed, rotated on every use, with reuse
 * detection per family. In-memory today — move to Postgres before running
 * more than one API instance.
 */
const refreshTokens = new Map() // sha256(token) -> { familyId, subject, role, expiresAt, usedAt }
const revokedFamilies = new Set()

const hash = (token) => createHash('sha256').update(token).digest('hex')

export function issueRefreshToken({ subject, role, familyId = randomUUID() }) {
  const token = randomBytes(48).toString('base64url')
  refreshTokens.set(hash(token), {
    familyId,
    subject,
    role,
    expiresAt: Date.now() + config.admin.refreshTokenTtl * 1000,
    usedAt: null,
  })
  return { token, familyId }
}

export const REFRESH_RESULT = {
  OK: 'ok',
  INVALID: 'invalid',
  EXPIRED: 'expired',
  REUSED: 'reused',
}

/** Consumes a refresh token and returns a fresh one, or reports why it failed. */
export function rotateRefreshToken(token) {
  const key = hash(token)
  const record = refreshTokens.get(key)
  if (!record) return { result: REFRESH_RESULT.INVALID }

  if (revokedFamilies.has(record.familyId)) return { result: REFRESH_RESULT.INVALID }

  if (record.usedAt) {
    // A consumed token was replayed: assume theft and kill the whole family.
    revokeFamily(record.familyId)
    return { result: REFRESH_RESULT.REUSED, subject: record.subject }
  }

  if (record.expiresAt < Date.now()) {
    refreshTokens.delete(key)
    return { result: REFRESH_RESULT.EXPIRED }
  }

  record.usedAt = Date.now()
  const next = issueRefreshToken({
    subject: record.subject,
    role: record.role,
    familyId: record.familyId,
  })
  return { result: REFRESH_RESULT.OK, subject: record.subject, role: record.role, ...next }
}

export function revokeFamily(familyId) {
  revokedFamilies.add(familyId)
  for (const [key, record] of refreshTokens) {
    if (record.familyId === familyId) refreshTokens.delete(key)
  }
}

export function revokeToken(token) {
  const record = refreshTokens.get(hash(token))
  if (record) revokeFamily(record.familyId)
}

export const REFRESH_COOKIE = 'ol_admin_refresh'

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: config.admin.refreshTokenTtl * 1000,
  }
}
