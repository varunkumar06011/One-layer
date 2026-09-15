import { Router } from 'express'
import { z } from 'zod'

import { CUSTOM_SURCHARGE, customPricing, getPrice, getProduct, products } from '../data/products.js'
import { notFound } from '../middleware/errors.js'
import { validate } from '../middleware/validate.js'
import { productId, size } from '../schemas/common.js'

const router = Router()

const idSchema = z.object({ id: productId })
const priceQuerySchema = z
  .object({ size, custom: z.enum(['true', 'false']).default('false') })
  .strip()

// GET /api/products
router.get('/', (req, res) => {
  res.json(products)
})

// GET /api/products/pricing/custom — declared before /:id so it is not shadowed
router.get('/pricing/custom', (req, res) => {
  res.json(customPricing)
})

// GET /api/products/:id
router.get('/:id', validate({ params: idSchema }), (req, res, next) => {
  const product = getProduct(req.params.id)
  if (!product) return next(notFound('Product not found'))
  res.json(product)
})

// GET /api/products/:id/price — authoritative unit price for a configuration
router.get(
  '/:id/price',
  validate({ params: idSchema, query: priceQuerySchema }),
  (req, res, next) => {
    const product = getProduct(req.params.id)
    if (!product) return next(notFound('Product not found'))
    if (!product.sizes.includes(req.query.size)) return next(notFound('Size not available'))

    const isCustom = req.query.custom === 'true'
    const basePrice = getPrice(product, req.query.size, isCustom)
    res.json({
      size: req.query.size,
      custom: isCustom,
      unitPrice: isCustom ? basePrice + CUSTOM_SURCHARGE : basePrice,
    })
  }
)

export default router
