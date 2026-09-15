import { Router } from 'express'
import { z } from 'zod'

import {
  CUSTOM_SURCHARGE,
  FREE_SHIPPING_THRESHOLD,
  classifyZone,
  customPricing,
  getProduct,
  getShippingCost,
  lookupPincode,
} from '../data/products.js'
import { optionalCustomer, requireAdmin, requireCustomer, requireRole } from '../middleware/auth.js'
import { badRequest, notFound } from '../middleware/errors.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { rejectServerOwnedFields, validate } from '../middleware/validate.js'
import { AUDIT_EVENTS, audit } from '../security/audit.js'
import { ROLES } from '../security/roles.js'
import { ORDER_STATUSES, pagination, phone, pincode, productId, quantity, shortText, size } from '../schemas/common.js'

const router = Router()

// In-memory order store — replaced by Postgres in step 2 of the rollout (docs §14).
const orders = []

const colorSchema = z.union([
  shortText(40),
  z
    .object({
      name: shortText(40),
      hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
    })
    .strip(),
])

// Only the artwork's filename is accepted. Client-generated URLs (blob:, data:,
// or anything else) are dropped — artwork moves to signed object storage (docs §9).
const customDesignSchema = z.object({ name: shortText(160) }).strip()

// The client sends intent only: what to make, in what size, for whom.
// Every rupee below is computed by the server from its own catalog.
const createOrderSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId,
            size,
            color: colorSchema.nullish(),
            quantity,
            customDesign: customDesignSchema.nullish(),
            placement: z.enum(['front', 'back', 'left-chest', 'right-chest']).nullish(),
          })
          .strip()
      )
      .min(1)
      .max(50),
    customer: z
      .object({
        name: shortText(80),
        phone,
        address: shortText(300),
        pincode,
      })
      .strip(),
    whatsappNumber: z.string().regex(/^[0-9]{10}$/).nullish(),
  })
  .strip()

function priceOrder(items) {
  let subtotal = 0
  let itemCount = 0
  const validatedItems = []

  for (const item of items) {
    const product = getProduct(item.productId)
    if (!product) throw badRequest(`Unknown product: ${item.productId}`)
    if (!product.sizes.includes(item.size)) throw badRequest(`Invalid size for ${product.name}`)

    const isCustom = !!item.customDesign
    const basePrice = isCustom ? customPricing[item.size] : product.pricing[item.size]
    if (typeof basePrice !== 'number') throw badRequest(`No price for ${product.name} (${item.size})`)

    const unitPrice = isCustom ? basePrice + CUSTOM_SURCHARGE : basePrice
    const lineTotal = unitPrice * item.quantity

    subtotal += lineTotal
    itemCount += item.quantity
    validatedItems.push({
      productId: item.productId,
      productName: product.name,
      size: item.size,
      color: item.color ?? null,
      quantity: item.quantity,
      customDesign: item.customDesign ?? null,
      placement: item.placement ?? null,
      unitPrice,
      lineTotal,
    })
  }

  return { validatedItems, subtotal, itemCount }
}

// POST /api/orders — create an order. Auth is optional (guest checkout), but
// when a verified customer token is present the order is bound to that user.
router.post(
  '/',
  writeLimiter,
  optionalCustomer,
  rejectServerOwnedFields,
  validate({ body: createOrderSchema }),
  async (req, res, next) => {
    try {
      if (req.tamperingSignals) {
        audit(AUDIT_EVENTS.TAMPERING_DETECTED, {
          req,
          actorId: req.user?.id ?? null,
          actorType: req.user ? 'customer' : 'anonymous',
          metadata: { fields: req.tamperingSignals, route: 'POST /api/orders' },
        })
      }

      const { items, customer, whatsappNumber } = req.body
      const { validatedItems, subtotal, itemCount } = priceOrder(items)

      let shippingCost = 0
      let zone = null
      let location = null
      const locationInfo = await lookupPincode(customer.pincode)
      if (locationInfo) {
        location = { district: locationInfo.district, state: locationInfo.state }
        zone = classifyZone(locationInfo)
        if (zone) {
          shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : getShippingCost(itemCount, zone)
        }
      }

      const order = {
        id: `OL-${Date.now().toString(36).toUpperCase()}`,
        userId: req.user?.id ?? null,
        items: validatedItems,
        customer,
        location,
        zone,
        subtotal,
        shippingCost,
        total: subtotal + shippingCost,
        itemCount,
        whatsappNumber: whatsappNumber ?? null,
        status: 'NEW',
        createdAt: new Date().toISOString(),
      }
      orders.push(order)

      audit(AUDIT_EVENTS.ORDER_CREATED, {
        req,
        actorId: req.user?.id ?? null,
        actorType: req.user ? 'customer' : 'anonymous',
        metadata: { orderId: order.id, total: order.total, itemCount },
      })

      res.status(201).json(order)
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/orders/mine — a customer's own orders, scoped by the token subject
router.get('/mine', requireCustomer, validate({ query: pagination }), (req, res) => {
  const { limit, offset } = req.query
  const mine = orders
    .filter((o) => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ total: mine.length, limit, offset, items: mine.slice(offset, offset + limit) })
})

const adminListSchema = pagination.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
})

// GET /api/orders — admin listing
router.get(
  '/',
  requireAdmin,
  requireRole(ROLES.SUPPORT),
  validate({ query: adminListSchema }),
  (req, res) => {
    const { limit, offset, status, search } = req.query
    let result = orders
    if (status) result = result.filter((o) => o.status === status)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.phone?.includes(q) ||
          o.id.toLowerCase().includes(q)
      )
    }
    result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json({ total: result.length, limit, offset, items: result.slice(offset, offset + limit) })
  }
)

const orderIdSchema = z.object({ id: z.string().regex(/^OL-[A-Z0-9]+$/) })

// GET /api/orders/:id — visible to the owning customer or to staff.
// Not-owned and not-found both return 404 so ids cannot be probed.
router.get(
  '/:id',
  optionalCustomer,
  validate({ params: orderIdSchema }),
  async (req, res, next) => {
    const order = orders.find((o) => o.id === req.params.id)
    if (order && req.user && order.userId === req.user.id) return res.json(order)

    // Fall back to staff access, which needs an admin token.
    requireAdmin(req, res, (err) => {
      if (err) return next(notFound('Order not found'))
      if (!order) return next(notFound('Order not found'))
      res.json(order)
    })
  }
)

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) }).strict()

// PATCH /api/orders/:id — staff-only status transitions
router.patch(
  '/:id',
  requireAdmin,
  requireRole(ROLES.ORDER_MANAGER),
  validate({ params: orderIdSchema, body: statusSchema }),
  (req, res, next) => {
    const order = orders.find((o) => o.id === req.params.id)
    if (!order) return next(notFound('Order not found'))

    const previous = order.status
    order.status = req.body.status
    audit(AUDIT_EVENTS.ORDER_STATUS_CHANGED, {
      req,
      actorId: req.admin.id,
      actorType: 'admin',
      metadata: { orderId: order.id, from: previous, to: order.status },
    })
    res.json(order)
  }
)

export default router
