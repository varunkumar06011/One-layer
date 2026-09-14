import { Router } from 'express'
import { products, getProduct, getPrice, customPricing, CUSTOM_SURCHARGE } from '../data/products.js'

const router = Router()

// GET /api/products - list all products
router.get('/', (req, res) => {
  res.json(products)
})

// GET /api/products/:id - single product
router.get('/:id', (req, res) => {
  const product = getProduct(req.params.id)
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  res.json(product)
})

// GET /api/products/:id/price - calculate price for a config
router.get('/:id/price', (req, res) => {
  const { size, custom } = req.query
  const product = getProduct(req.params.id)
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  if (!size || !product.sizes.includes(size)) {
    return res.status(400).json({ error: 'Invalid or missing size' })
  }
  const isCustom = custom === 'true'
  const basePrice = getPrice(product, size, isCustom)
  const unitPrice = isCustom ? basePrice + CUSTOM_SURCHARGE : basePrice
  res.json({ size, custom: isCustom, unitPrice })
})

// GET /api/pricing/custom - custom pricing table
router.get('/pricing/custom', (req, res) => {
  res.json(customPricing)
})

export default router
