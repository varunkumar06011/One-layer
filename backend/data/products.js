// ONE LAYER — Product catalog & pricing (backend source of truth)

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
  },
]

export const customPricing = { S: 369, M: 379, L: 399, XL: 419 }
export const CUSTOM_SURCHARGE = 50

// Shipping rate table (Speed Post base + 18% GST, rounded)
// Used internally by the calculator — never shown on-site as a table.
// Zones: local, state, metro, rest
// Weight tiers based on item count (~200-250g per tee)
export const shippingTiers = [
  // Up to 500g (1 item)
  { minItems: 1, maxItems: 1, rates: { local: 33, state: 90, metro: 97, rest: 106 } },
  // 501g-1000g (2-3 items)
  { minItems: 2, maxItems: 3, rates: { local: 57, state: 119, metro: 162, rest: 169 } },
  // 1001g-1500g (4-6 items)
  { minItems: 4, maxItems: 6, rates: { local: 71, state: 153, metro: 215, rest: 269 } },
  // 1501g-2000g (7-8 items)
  { minItems: 7, maxItems: 8, rates: { local: 103, state: 210, metro: 300, rest: 376 } },
]

export const FREE_SHIPPING_THRESHOLD = 1999

// Store location — used to determine "local" vs "within state" zones
export const STORE_LOCATION = {
  city: 'Delhi',
  state: 'Delhi',
}

// Metro zones — major cities classified as metro
const METRO_CITIES = ['Mumbai', 'Bengaluru', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Jodhpur', 'Ranchi', 'Raipur', 'Guwahati', 'Chandigarh', 'Mysuru', 'Mysore', 'Coimbatore', 'Vishakhapatnam', 'Visakhapatnam', 'Madurai', 'Noida', 'Gurugram', 'Gurgaon', 'Thiruvananthapuram', 'Bhubaneswar', 'Salem', 'Tiruchirappalli', 'Trichy', 'Amritsar', 'Allahabad', 'Prayagraj', 'Vijayawada', 'Gwalior', 'Jabalpur']

export function getProduct(id) {
  return products.find((p) => p.id === id)
}

export function getPrice(product, size, isCustom = false) {
  if (isCustom) return customPricing[size] || 0
  return product?.pricing?.[size] || 0
}

// Look up pincode via India Post public API
// Returns { district, state, city } or null on failure
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/

export async function lookupPincode(pincode) {
  if (!PINCODE_PATTERN.test(String(pincode ?? ''))) return null
  try {
    const url = new URL(`https://api.postalpincode.in/pincode/${pincode}`)
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' })
    const data = await res.json()
    if (!data || !Array.isArray(data) || data.length === 0) return null
    const postOffices = data[0]?.PostOffice
    if (!postOffices || postOffices.length === 0) return null
    const po = postOffices[0]
    return {
      district: po.District || '',
      state: po.State || '',
      region: po.Region || '',
      division: po.Division || '',
    }
  } catch (err) {
    console.error('Pincode lookup failed:', err.message)
    return null
  }
}

// Classify order into a zone based on the pincode location info
export function classifyZone(location) {
  if (!location || !location.state) return null

  const state = location.state.trim()
  const city = (location.district || location.region || '').trim()

  // Local — same city as store
  if (city.toLowerCase() === STORE_LOCATION.city.toLowerCase() ||
      state.toLowerCase() === STORE_LOCATION.state.toLowerCase() && city.toLowerCase() === 'new delhi') {
    return 'local'
  }

  // Within state — same state as store
  if (state.toLowerCase() === STORE_LOCATION.state.toLowerCase()) {
    return 'state'
  }

  // Metro — known metro cities
  if (METRO_CITIES.some((m) => city.toLowerCase().includes(m.toLowerCase()))) {
    return 'metro'
  }

  // Everything else
  return 'rest'
}

// Async version: looks up pincode via India Post API, then classifies zone
export async function getZoneFromPincodeAsync(pincode) {
  const location = await lookupPincode(pincode)
  if (!location) return null
  return classifyZone(location)
}

// Synchronous fallback (used when API is unavailable)
export function getZoneFromPincode(pincode) {
  if (!pincode || pincode.length !== 6) return null
  const code = parseInt(pincode, 10)
  // Delhi (110xxx) — local
  if (code >= 110000 && code <= 111999) return 'local'
  // NCR (same state-ish)
  if ((code >= 201000 && code <= 201999) || (code >= 122000 && code <= 122999)) return 'state'
  // Metro pincodes
  if (
    (code >= 400000 && code <= 400999) ||  // Mumbai
    (code >= 560000 && code <= 560999) ||  // Bangalore
    (code >= 600000 && code <= 600999) ||  // Chennai
    (code >= 700000 && code <= 700999) ||  // Kolkata
    (code >= 500000 && code <= 500999)     // Hyderabad
  )
    return 'metro'
  return 'rest'
}

export function getShippingCost(itemCount, zone) {
  if (!zone) return null
  const tier = shippingTiers.find(
    (t) => itemCount >= t.minItems && itemCount <= t.maxItems
  )
  if (!tier && itemCount > 8) {
    return shippingTiers[shippingTiers.length - 1].rates[zone]
  }
  return tier ? tier.rates[zone] : null
}
