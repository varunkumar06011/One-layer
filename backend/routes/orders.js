import { Router } from 'express'
import { getProduct, customPricing, CUSTOM_SURCHARGE, lookupPincode, classifyZone, getShippingCost, FREE_SHIPPING_THRESHOLD } from '../data/products.js'
import { requireAuth } from './admin.js'

const router = Router()

// In-memory order store (replace with a database in production)
const orders = []

// POST /api/orders - create a new order
// Body: {
//   items: [{ productId, size, color, quantity, customDesign, placement }],
//   customer: { name, phone, address, pincode },
//   whatsappNumber: '9391798370' | '8317674764' | null
// }
router.post('/', async (req, res) => {
  const { items, customer, whatsappNumber } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' })
  }
  if (!customer || !customer.name || !customer.phone || !customer.address || !customer.pincode) {
    return res.status(400).json({ error: 'Customer name, phone, address, and pincode are required' })
  }

  // Validate & calculate line items
  let subtotal = 0
  let itemCount = 0
  const validatedItems = []

  for (const item of items) {
    const product = getProduct(item.productId)
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item.productId}` })
    }
    if (!item.size || !product.sizes.includes(item.size)) {
      return res.status(400).json({ error: `Invalid size for ${product.name}` })
    }
    if (!item.quantity || item.quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' })
    }

    const isCustom = !!item.customDesign
    const basePrice = isCustom ? customPricing[item.size] : product.pricing[item.size]
    const unitPrice = isCustom ? basePrice + CUSTOM_SURCHARGE : basePrice
    const lineTotal = unitPrice * item.quantity

    subtotal += lineTotal
    itemCount += item.quantity

    validatedItems.push({
      productId: item.productId,
      productName: product.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      customDesign: item.customDesign || null,
      placement: item.placement || null,
      unitPrice,
      lineTotal,
    })
  }

  // Calculate shipping via India Post pincode lookup
  let shippingCost = 0
  let zone = null
  let location = null
  const locationInfo = await lookupPincode(customer.pincode)
  if (locationInfo) {
    location = {
      district: locationInfo.district,
      state: locationInfo.state,
    }
    zone = classifyZone(locationInfo)
    if (zone) {
      const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
      shippingCost = isFreeShipping ? 0 : getShippingCost(itemCount, zone)
    }
  }

  const total = subtotal + shippingCost
  const orderId = `OL-${Date.now().toString(36).toUpperCase()}`
  const order = {
    id: orderId,
    items: validatedItems,
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      pincode: customer.pincode,
    },
    location,
    zone,
    subtotal,
    shippingCost,
    total,
    itemCount,
    whatsappNumber: whatsappNumber || null,
    status: 'New — sent via WhatsApp',
    createdAt: new Date().toISOString(),
  }

  orders.push(order)

  res.status(201).json(order)
})

// GET /api/orders - list all orders (admin only)
// Query: ?status=New&search=Arjun
router.get('/', requireAuth, (req, res) => {
  let result = orders

  if (req.query.status) {
    result = result.filter((o) =>
      o.status.toLowerCase().includes(req.query.status.toLowerCase())
    )
  }

  if (req.query.search) {
    const q = req.query.search.toLowerCase()
    result = result.filter(
      (o) =>
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.id.toLowerCase().includes(q)
    )
  }

  // Sort newest first
  result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json(result)
})

// GET /api/orders/:id - get a single order (admin only)
router.get('/:id', requireAuth, (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }
  res.json(order)
})

// PATCH /api/orders/:id - update order status (admin only)
// Body: { status: 'Confirmed' }
router.patch('/:id', requireAuth, (req, res) => {
  const order = orders.find((o) => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }
  if (!req.body.status) {
    return res.status(400).json({ error: 'status is required' })
  }
  order.status = req.body.status
  res.json(order)
})

export default router
