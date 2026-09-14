import { Router } from 'express'
import { getZoneFromPincodeAsync, getShippingCost, FREE_SHIPPING_THRESHOLD, lookupPincode, classifyZone } from '../data/products.js'

const router = Router()

// POST /api/shipping/calculate
// Body: { pincode, itemCount, subtotal }
// Uses India Post pincode API to determine zone, then looks up rate
router.post('/calculate', async (req, res) => {
  const { pincode, itemCount, subtotal } = req.body

  if (!pincode || String(pincode).length !== 6) {
    return res.status(400).json({ error: 'A valid 6-digit pincode is required' })
  }
  if (!itemCount || itemCount < 1) {
    return res.status(400).json({ error: 'itemCount must be at least 1' })
  }

  const location = await lookupPincode(pincode)
  if (!location) {
    return res.status(400).json({ error: 'Could not look up pincode. Please check and try again.' })
  }

  const zone = classifyZone(location)
  if (!zone) {
    return res.status(400).json({ error: 'Could not determine delivery zone for this pincode' })
  }

  const sub = Number(subtotal) || 0
  const isFreeShipping = sub >= FREE_SHIPPING_THRESHOLD
  const baseCost = getShippingCost(itemCount, zone)
  const shippingCost = isFreeShipping ? 0 : baseCost

  const zoneLabels = {
    local: 'Local delivery',
    state: 'Within state',
    metro: 'Metro / zone',
    rest: 'Rest of India',
  }

  res.json({
    pincode,
    zone,
    zoneLabel: zoneLabels[zone],
    location: {
      district: location.district,
      state: location.state,
    },
    itemCount,
    shippingCost,
    isFreeShipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    remainingForFreeShipping: isFreeShipping ? 0 : FREE_SHIPPING_THRESHOLD - sub,
  })
})

export default router
