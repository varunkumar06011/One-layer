import { config } from '../config/env.js'

export const AUDIT_EVENTS = {
  ADMIN_LOGIN_SUCCESS: 'admin.login.success',
  ADMIN_LOGIN_FAILURE: 'admin.login.failure',
  ADMIN_LOGIN_LOCKED: 'admin.login.locked',
  ADMIN_LOGOUT: 'admin.logout',
  ADMIN_REFRESH_REUSE: 'admin.refresh.reuse_detected',
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  QUOTE_CREATED: 'quote.created',
  SAMPLE_KIT_REQUESTED: 'sample_kit.requested',
  TAMPERING_DETECTED: 'security.tampering_detected',
}

const REDACTED = ['password', 'token', 'otp', 'secret', 'authorization', 'cookie', 'cvv', 'card']

function redact(metadata = {}) {
  const out = {}
  for (const [key, value] of Object.entries(metadata)) {
    out[key] = REDACTED.some((word) => key.toLowerCase().includes(word)) ? '[redacted]' : value
  }
  return out
}

/**
 * Append-only security event log. Always written to stdout as structured JSON;
 * additionally persisted to public.audit_log when a service role key is configured.
 */
export function audit(event, { req, actorId = null, actorType = 'anonymous', metadata = {} } = {}) {
  const entry = {
    level: 'audit',
    event,
    at: new Date().toISOString(),
    requestId: req?.id ?? null,
    actorId,
    actorType,
    ip: req?.ip ?? null,
    userAgent: req?.get?.('user-agent') ?? null,
    metadata: redact(metadata),
  }

  console.log(JSON.stringify(entry))

  if (config.supabase.url && config.supabase.serviceRoleKey) {
    void persist(entry)
  }
}

async function persist(entry) {
  try {
    const res = await fetch(`${config.supabase.url}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: config.supabase.serviceRoleKey,
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event: entry.event,
        occurred_at: entry.at,
        request_id: entry.requestId,
        actor_id: entry.actorId,
        actor_type: entry.actorType,
        ip: entry.ip,
        user_agent: entry.userAgent,
        metadata: entry.metadata,
      }),
    })
    if (!res.ok) {
      console.error(
        JSON.stringify({ level: 'error', message: 'audit_log persist failed', status: res.status })
      )
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: 'audit_log persist failed', error: err.message }))
  }
}
