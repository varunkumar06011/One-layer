import argon2 from 'argon2'

import { config } from '../config/env.js'
import { ROLES } from './roles.js'

// OWASP-recommended Argon2id parameters (19 MiB, 2 iterations, 1 lane).
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export const hashPassword = (password) => argon2.hash(password, ARGON2_OPTIONS)

let hashPromise = null

async function adminPasswordHash() {
  if (config.admin.passwordHash) return config.admin.passwordHash
  if (!hashPromise) {
    console.warn(
      'ADMIN_PASSWORD_HASH is not set — hashing the development password at startup. ' +
        'Production startup refuses to run without a real hash.'
    )
    hashPromise = hashPassword(config.admin.devPassword)
  }
  return hashPromise
}

/**
 * Verifies an admin password in constant time relative to the attempt
 * (argon2.verify does the comparison; a wrong password costs the same as a right one).
 */
export async function verifyAdminPassword(password) {
  const stored = await adminPasswordHash()
  try {
    return await argon2.verify(stored, password)
  } catch {
    return false
  }
}

// Single built-in operator until admin users move into Postgres (see docs §14).
export const ROOT_ADMIN = { id: 'root-admin', role: ROLES.SUPER_ADMIN }
