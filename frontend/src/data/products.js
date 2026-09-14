// ONE LAYER — Product catalog & pricing

export const products = [
  {
    id: 'collar-polo',
    name: 'Collar Polo',
    tagline: 'Clean lines, structured collar.',
    fit: 'polo',
    description: 'A considered polo with a soft structured collar and a body that drapes without clinging. Made from combed cotton with a matte finish.',
    colors: [
      { name: 'Black', hex: '#111114' },
      { name: 'Navy Blue', hex: '#1a2238' },
      { name: 'White', hex: '#f7f6f3' },
      { name: 'Maroon', hex: '#6b1f1f' },
      { name: 'Grey', hex: '#8a8680' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    pricing: { S: 329, M: 349, L: 369, XL: 399 },
    customizable: true,
    image: '/src/assets/products/collar-polo.jpg',
  },
  {
    id: 'neckless-round',
    name: 'Neckless Round',
    tagline: 'No collar. Just fabric and form.',
    fit: 'round',
    description: 'A round-neck tee cut for an unhurried silhouette. Lightweight combed cotton with a smooth, matte hand-feel.',
    colors: [
      { name: 'Lavender', hex: '#b0a8c0' },
      { name: 'White', hex: '#f7f6f3' },
      { name: 'Black', hex: '#111114' },
      { name: 'Navy Blue', hex: '#1a2238' },
      { name: 'Beige', hex: '#e7e3dc' },
      { name: 'Grey', hex: '#8a8680' },
      { name: 'Sky Blue', hex: '#87ceeb' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    pricing: { S: 319, M: 329, L: 349, XL: 369 },
    customizable: true,
    image: '/src/assets/products/neckless-round.jpg',
  },
  {
    id: 'oversized-printed',
    name: 'Oversized Printed',
    tagline: 'More fabric. More canvas.',
    fit: 'oversized',
    description: 'A drop-shoulder oversized tee with a larger print area. Heavier weight cotton, relaxed drape, designed for statement prints.',
    colors: [
      { name: 'Lavender', hex: '#b0a8c0' },
      { name: 'White', hex: '#f7f6f3' },
      { name: 'Black', hex: '#111114' },
      { name: 'Navy Blue', hex: '#1a2238' },
      { name: 'Beige', hex: '#e7e3dc' },
      { name: 'Grey', hex: '#8a8680' },
      { name: 'Sky Blue', hex: '#87ceeb' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    pricing: { S: 449, M: 469, L: 489, XL: 499 },
    customizable: true,
    image: '/src/assets/products/oversized-printed.jpg',
  },
]

export const customPricing = { S: 369, M: 379, L: 399, XL: 419 }

// Flat surcharge added per custom-printed tee (on top of the custom price)
export const CUSTOM_SURCHARGE = 50

// Order subtotal (after custom surcharge) at which shipping becomes free
export const FREE_SHIPPING_THRESHOLD = 1999

// WhatsApp order numbers (with country code 91) — single source of truth
export const WHATSAPP_NUMBERS = ['919391798370', '918317674764']

export function getProduct(id) {
  return products.find((p) => p.id === id)
}

export function getPrice(product, size, isCustom = false) {
  if (isCustom) return customPricing[size] || 0
  return product?.pricing?.[size] || 0
}

// Shipping tiers (GST-inclusive, per order)
// Zones: local, state, metro, rest
export const shippingTiers = [
  { minItems: 1, maxItems: 1, rates: { local: 40, state: 90, metro: 100, rest: 110 } },
  { minItems: 2, maxItems: 3, rates: { local: 60, state: 120, metro: 165, rest: 175 } },
  { minItems: 4, maxItems: 6, rates: { local: 75, state: 155, metro: 215, rest: 270 } },
]

export function getShippingCost(itemCount, zone) {
  if (!zone) return null
  const tier = shippingTiers.find(
    (t) => itemCount >= t.minItems && itemCount <= t.maxItems
  )
  if (!tier && itemCount > 6) {
    // For larger orders, use the last tier
    return shippingTiers[shippingTiers.length - 1].rates[zone]
  }
  return tier ? tier.rates[zone] : null
}
