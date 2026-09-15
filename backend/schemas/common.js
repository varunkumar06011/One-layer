import { z } from 'zod'

export const pincode = z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode')
export const phone = z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit mobile number')
export const productId = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, 'Invalid product id')
export const size = z.enum(['S', 'M', 'L', 'XL'])
export const quantity = z.coerce.number().int().min(1).max(500)
export const shortText = (max = 120) => z.string().trim().min(1).max(max)

export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const ORDER_STATUSES = [
  'NEW',
  'CONFIRMED',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]
