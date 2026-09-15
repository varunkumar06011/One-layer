const MAX_FAILURES = 10
const BASE_LOCKOUT_MS = 60 * 1000
const MAX_LOCKOUT_MS = 30 * 60 * 1000
const FAILURE_WINDOW_MS = 30 * 60 * 1000

const attempts = new Map() // key -> { failures, firstFailureAt, lockedUntil }

function entry(key) {
  const existing = attempts.get(key)
  if (existing && Date.now() - existing.firstFailureAt < FAILURE_WINDOW_MS) return existing
  const fresh = { failures: 0, firstFailureAt: Date.now(), lockedUntil: 0 }
  attempts.set(key, fresh)
  return fresh
}

/** Returns remaining lockout in seconds, or 0 when the caller may attempt a login. */
export function lockoutRemaining(key) {
  const record = attempts.get(key)
  if (!record || record.lockedUntil < Date.now()) return 0
  return Math.ceil((record.lockedUntil - Date.now()) / 1000)
}

export function recordFailure(key) {
  const record = entry(key)
  record.failures += 1
  if (record.failures >= MAX_FAILURES) {
    const overflow = record.failures - MAX_FAILURES
    record.lockedUntil = Date.now() + Math.min(BASE_LOCKOUT_MS * 2 ** overflow, MAX_LOCKOUT_MS)
  }
  return record.failures
}

export function recordSuccess(key) {
  attempts.delete(key)
}
