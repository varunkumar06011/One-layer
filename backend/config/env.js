import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Comma-separated allowlist. Wildcards are rejected in production.
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Argon2id hash of the admin password. Generate with: npm run hash-password
  ADMIN_PASSWORD_HASH: z.string().optional(),
  // Dev-only convenience: hashed at startup when ADMIN_PASSWORD_HASH is absent.
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_JWT_SECRET: z.string().optional(),

  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(8 * 60 * 60),

  // Customer identity (Supabase). Either the shared JWT secret (HS256 projects)
  // or the project URL (asymmetric projects, verified via JWKS).
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  WHATSAPP_NUMBER_1: z.string().optional(),
  WHATSAPP_NUMBER_2: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

const raw = parsed.data
const isProduction = raw.NODE_ENV === 'production'

const corsOrigins = raw.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const fatal = []
if (isProduction) {
  if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
    fatal.push('CORS_ORIGINS must be an explicit allowlist in production (no "*")')
  }
  if (!raw.ADMIN_PASSWORD_HASH) {
    fatal.push('ADMIN_PASSWORD_HASH is required in production (npm run hash-password)')
  }
  if (!raw.ADMIN_JWT_SECRET || raw.ADMIN_JWT_SECRET.length < 32) {
    fatal.push('ADMIN_JWT_SECRET is required in production and must be at least 32 characters')
  }
  if (!raw.SUPABASE_JWT_SECRET && !raw.SUPABASE_URL) {
    fatal.push('SUPABASE_JWT_SECRET or SUPABASE_URL is required to verify customer identity')
  }
}
if (fatal.length > 0) {
  throw new Error(`Refusing to start with an insecure configuration:\n  ${fatal.join('\n  ')}`)
}

export const config = {
  env: raw.NODE_ENV,
  isProduction,
  port: raw.PORT,
  corsOrigins,
  admin: {
    passwordHash: raw.ADMIN_PASSWORD_HASH || null,
    devPassword: isProduction ? null : raw.ADMIN_PASSWORD || 'onelayer-dev-admin',
    jwtSecret: raw.ADMIN_JWT_SECRET || null,
    accessTokenTtl: raw.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtl: raw.REFRESH_TOKEN_TTL_SECONDS,
  },
  supabase: {
    url: raw.SUPABASE_URL || null,
    jwtSecret: raw.SUPABASE_JWT_SECRET || null,
    serviceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY || null,
  },
  whatsappNumbers: [raw.WHATSAPP_NUMBER_1, raw.WHATSAPP_NUMBER_2].filter(Boolean),
}
