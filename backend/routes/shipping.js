import { Router } from 'express'
import { z } from 'zod'

import {
  FREE_SHIPPING_THRESHOLD,
  classifyZone,
  getShippingCost,
  lookupPincode,
} from '../data/products.js'
import { badRequest } from '../middleware/errors.js'
import { validate } from '../middleware/validate.js'
import { pincode } from '../schemas/common.js'

const router = Router()

// subtotal is a client hint used only to preview the free-shipping threshold;
// the authoritative subtotal is recomputed when the order is created.
const calculateSchema = z
  .object({
    pincode,
    itemCount: z.coerce.number().int().min(1).max(500),
    subtotal: z.coerce.number().min(0).max(10_000_000).default(0),
  })
  .strip()

const ZONE_LABELS = {
  local: 'Local delivery',
  state: 'Within state',
  metro: 'Metro / zone',
  rest: 'Rest of India',
}

// POST /api/shipping/calculate
router.post('/calculate', validate({ body: calculateSchema }), async (req, res, next) => {
  try {
    const { pincode: code, itemCount, subtotal } = req.body

    const location = await lookupPincode(code)
    if (!location) {
      return next(badRequest('Could not look up pincode. Please check and try again.'))
    }
    const zone = classifyZone(location)
    if (!zone) return next(badRequest('Could not determine delivery zone for this pincode'))

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
    const shippingCost = isFreeShipping ? 0 : getShippingCost(itemCount, zone)

    res.json({
      pincode: code,
      zone,
      zoneLabel: ZONE_LABELS[zone],
      location: { district: location.district, state: location.state },
      itemCount,
      shippingCost,
      isFreeShipping,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      remainingForFreeShipping: isFreeShipping ? 0 : FREE_SHIPPING_THRESHOLD - subtotal,
    })
  } catch (err) {
    next(err)
  }
})

export default router
