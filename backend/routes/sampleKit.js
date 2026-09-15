import { Router } from 'express'
import { z } from 'zod'

import { requireAdmin, requireRole } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { rejectServerOwnedFields, validate } from '../middleware/validate.js'
import { AUDIT_EVENTS, audit } from '../security/audit.js'
import { ROLES } from '../security/roles.js'
import { pagination, pincode, shortText } from '../schemas/common.js'

const router = Router()

// In-memory store — replaced by Postgres in step 2 of the rollout (docs §14).
const requests = []

const sampleKitSchema = z
  .object({
    company: shortText(120),
    contactName: shortText(80),
    email: z.string().trim().email().max(160),
    address: shortText(300).optional(),
    pincode: pincode.optional(),
    colors: z.array(shortText(40)).max(20).default([]),
  })
  .strip()

// POST /api/sample-kit
router.post(
  '/',
  writeLimiter,
  rejectServerOwnedFields,
  validate({ body: sampleKitSchema }),
  (req, res) => {
    const request = {
      id: `SK-${Date.now().toString(36).toUpperCase()}`,
      ...req.body,
      address: req.body.address ?? null,
      pincode: req.body.pincode ?? null,
      status: 'requested',
      createdAt: new Date().toISOString(),
    }
    requests.push(request)

    audit(AUDIT_EVENTS.SAMPLE_KIT_REQUESTED, { req, metadata: { requestId: request.id } })

    res.status(201).json({
      message: 'Sample kit requested. We will be in touch shortly.',
      request,
    })
  }
)

// GET /api/sample-kit — staff only (previously public, which leaked customer contact data)
router.get(
  '/',
  requireAdmin,
  requireRole(ROLES.SUPPORT),
  validate({ query: pagination }),
  (req, res) => {
    const { limit, offset } = req.query
    res.json({ total: requests.length, limit, offset, items: requests.slice(offset, offset + limit) })
  }
)

export default router
