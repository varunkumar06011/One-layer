// ONE LAYER — Per-color product image mapping
// Returns the correct product image for a given product ID + color name

import collarPoloBlack from '../assets/images/collar-polo-black.png'
import collarPoloNavyBlue from '../assets/images/collar-polo-navy-blue.png'
import collarPoloWhite from '../assets/images/collar-polo-white.png'
import collarPoloMaroon from '../assets/images/collar-polo-maroon.png'
import collarPoloGrey from '../assets/images/collar-polo-grey.png'
import collarTshirt from '../assets/images/collar-tshirt.png'

import necklessRoundLavender from '../assets/images/neckless-round-lavender.png'
import necklessRoundWhite from '../assets/images/neckless-round-white.png'
import necklessRoundBlack from '../assets/images/neckless-round-black.png'
import necklessRoundNavyBlue from '../assets/images/neckless-round-navy-blue.png'
import necklessRoundBeige from '../assets/images/neckless-round-beige.png'
import necklessRoundGrey from '../assets/images/neckless-round-grey.png'
import necklessRoundSkyBlue from '../assets/images/neckless-round-sky-blue.png'
import necklessRound from '../assets/images/neckless-round.png'

import oversizedPrinted from '../assets/images/oversized-printed.png'

// Per-color product images — keyed by productId → colorName → image
const PRODUCT_COLOR_IMAGES = {
  'collar-polo': {
    'Black': collarPoloBlack,
    'Navy Blue': collarPoloNavyBlue,
    'White': collarPoloWhite,
    'Maroon': collarPoloMaroon,
    'Grey': collarPoloGrey,
  },
  'neckless-round': {
    'Lavender': necklessRoundLavender,
    'White': necklessRoundWhite,
    'Black': necklessRoundBlack,
    'Navy Blue': necklessRoundNavyBlue,
    'Beige': necklessRoundBeige,
    'Grey': necklessRoundGrey,
    'Sky Blue': necklessRoundSkyBlue,
  },
}

// Fallback images (used when no per-color image exists, e.g. oversized-printed)
const PRODUCT_FALLBACK_IMAGES = {
  'collar-polo': collarTshirt,
  'neckless-round': necklessRound,
  'oversized-printed': oversizedPrinted,
}

/**
 * Get the product image for a specific color.
 * Returns the per-color image if available, otherwise the fallback product image.
 *
 * @param {string} productId - Product ID (e.g. 'collar-polo')
 * @param {string} colorName - Color name (e.g. 'Black')
 * @returns {string|null} - Image URL or null
 */
export function getProductImage(productId, colorName) {
  const perColor = PRODUCT_COLOR_IMAGES[productId]?.[colorName]
  if (perColor) return perColor
  return PRODUCT_FALLBACK_IMAGES[productId] || null
}

/**
 * Check whether a product has a per-color image for the given color
 * (vs. a fallback that would need tinting)
 */
export function hasPerColorImage(productId, colorName) {
  return !!PRODUCT_COLOR_IMAGES[productId]?.[colorName]
}

export { PRODUCT_COLOR_IMAGES, PRODUCT_FALLBACK_IMAGES }
