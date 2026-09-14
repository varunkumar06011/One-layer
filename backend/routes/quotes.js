import { Router } from 'express'
import { products, getProduct, customPricing, CUSTOM_SURCHARGE } from '../data/products.js'

const router = Router()

// In-memory quote store
const quotes = []

// POST /api/quotes - calculate a bulk/company quote
// Body: { productId, color, employees: [{ name, size, qty }] }
router.post('/', (req, res) => {
  const { productId, color, employees } = req.body

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' })
  }
  const product = getProduct(productId)
  if (!product) {
    return res.status(400).json({ error: 'Unknown product' })
  }
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'At least one employee entry is required' })
  }

  let total = 0
  let totalQty = 0
  const lineItems = []

  for (const emp of employees) {
    if (!product.sizes.includes(emp.size)) {
      return res.status(400).json({ error: `Invalid size: ${emp.size}` })
    }
    const qty = parseInt(emp.qty) || 1
    const unitPrice = customPricing[emp.size] + CUSTOM_SURCHARGE
    const lineTotal = unitPrice * qty
    total += lineTotal
    totalQty += qty
    lineItems.push({
      name: emp.name || '',
      size: emp.size,
      qty,
      unitPrice,
      lineTotal,
    })
  }

  const perUnit = totalQty > 0 ? Math.round(total / totalQty) : 0
  const quoteId = `Q-${Date.now().toString(36).toUpperCase()}`

  const quote = {
    id: quoteId,
    productId,
    productName: product.name,
    color: color || null,
    lineItems,
    totalQty,
    perUnit,
    total,
    note: 'Final pricing may vary with print complexity & fabric. We will confirm before production.',
    createdAt: new Date().toISOString(),
  }

  quotes.push(quote)

  res.status(201).json(quote)
})

// GET /api/quotes - list all quotes
router.get('/', (req, res) => {
  res.json(quotes)
})

export default router
