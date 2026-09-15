import { badRequest } from './errors.js'

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result, so handlers can only ever see whitelisted, typed fields.
 */
export function validate({ body, query, params }) {
  return (req, res, next) => {
    for (const [source, schema] of [
      ['body', body],
      ['query', query],
      ['params', params],
    ]) {
      if (!schema) continue
      const result = schema.safeParse(req[source])
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: [source, ...i.path].join('.'),
          message: i.message,
        }))
        return next(badRequest('Invalid request', details))
      }
      // req.query is a getter on Express 5; define instead of assign.
      Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true })
    }
    next()
  }
}

/**
 * Rejects money/state fields that only the server is allowed to decide.
 * Their presence is a tampering signal worth recording.
 */
export const SERVER_OWNED_FIELDS = [
  'price',
  'unitPrice',
  'lineTotal',
  'subtotal',
  'total',
  'discount',
  'shippingCost',
  'tax',
  'status',
  'paymentStatus',
  'role',
]

export function rejectServerOwnedFields(req, res, next) {
  const found = []
  const scan = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => scan(v, `${path}[${i}]`))
      return
    }
    if (!value || typeof value !== 'object') return
    for (const key of Object.keys(value)) {
      if (SERVER_OWNED_FIELDS.includes(key)) found.push(`${path}${path ? '.' : ''}${key}`)
      scan(value[key], `${path}${path ? '.' : ''}${key}`)
    }
  }
  scan(req.body, '')

  if (found.length > 0) {
    req.tamperingSignals = found
  }
  next()
}
