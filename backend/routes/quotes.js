import { Router } from 'express'
import { z } from 'zod'

import { CUSTOM_SURCHARGE, customPricing, getProduct } from '../data/products.js'
import { requireAdmin, requireRole } from '../middleware/auth.js'
import { badRequest } from '../middleware/errors.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { rejectServerOwnedFields, validate } from '../middleware/validate.js'
import { AUDIT_EVENTS, audit } from '../security/audit.js'
import { ROLES } from '../security/roles.js'
import { pagination, productId, quantity, shortText, size } from '../schemas/common.js'

const router = Router()

// In-memory quote store — replaced by Postgres in step 2 of the rollout (docs §14).
const quotes = []

const quoteSchema = z
  .object({
    productId,
    color: shortText(40).optional(),
    employees: z
      .array(
        z
          .object({
            name: z.string().trim().max(80).optional(),
            size,
            qty: quantity,
          })
          .strip()
      )
      .min(1)
      .max(1000),
  })
  .strip()

// POST /api/quotes — bulk/company quote, priced entirely server-side
router.post(
  '/',
  writeLimiter,
  rejectServerOwnedFields,
  validate({ body: quoteSchema }),
  (req, res, next) => {
    const { productId: id, color, employees } = req.body
    const product = getProduct(id)
    if (!product) return next(badRequest('Unknown product'))

    let total = 0
    let totalQty = 0
    const lineItems = []

    for (const emp of employees) {
      if (!product.sizes.includes(emp.size)) return next(badRequest(`Invalid size: ${emp.size}`))
      const unitPrice = customPricing[emp.size] + CUSTOM_SURCHARGE
      const lineTotal = unitPrice * emp.qty
      total += lineTotal
      totalQty += emp.qty
      lineItems.push({ name: emp.name ?? '', size: emp.size, qty: emp.qty, unitPrice, lineTotal })
    }

    const quote = {
      id: `Q-${Date.now().toString(36).toUpperCase()}`,
      productId: id,
      productName: product.name,
      color: color ?? null,
      lineItems,
      totalQty,
      perUnit: totalQty > 0 ? Math.round(total / totalQty) : 0,
      total,
      note: 'Final pricing may vary with print complexity & fabric. We will confirm before production.',
      createdAt: new Date().toISOString(),
    }
    quotes.push(quote)

    audit(AUDIT_EVENTS.QUOTE_CREATED, {
      req,
      metadata: { quoteId: quote.id, total: quote.total, totalQty },
    })

    res.status(201).json(quote)
  }
)

// GET /api/quotes — staff only (previously public, which leaked B2B pipeline data)
router.get(
  '/',
  requireAdmin,
  requireRole(ROLES.SUPPORT),
  validate({ query: pagination }),
  (req, res) => {
    const { limit, offset } = req.query
    res.json({ total: quotes.length, limit, offset, items: quotes.slice(offset, offset + limit) })
  }
)

export default router
