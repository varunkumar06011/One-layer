import { getProductImage, hasPerColorImage } from './productImages.js'

// Design overlay positions on the 3:2 landscape product images.
// The per-color images show front on the LEFT half and back on the RIGHT half.
// x/y are the design CENTER as a fraction of canvas width/height.
const POSITIONS = {
  front: { x: 0.25, y: 0.40, w: 0.14 },  // center of left half, chest area (moved down)
  back:  { x: 0.75, y: 0.28, w: 0.19 },  // center of right half, back area
}

/**
 * Capture a customized product mockup as a PNG data URL.
 * Composites: product image + tint (if needed) + design overlay(s).
 *
 * @param {string} productId - Product ID (e.g. 'collar-polo')
 * @param {string} colorName - Color name (e.g. 'Black')
 * @param {string} colorHex  - Color hex for tint fallback
 * @param {string} designUrl - URL/data URL of the uploaded design
 * @param {string} placement - 'front' | 'back' | 'both'
 * @returns {Promise<string>} - PNG data URL
 */
export async function captureMockup(productId, colorName, colorHex, designUrl, placement) {
  const imgSrc = getProductImage(productId, colorName)
  const canvas = document.createElement('canvas')

  // Load product image
  const productImg = await loadImage(imgSrc)
  canvas.width = productImg.naturalWidth
  canvas.height = productImg.naturalHeight
  const ctx = canvas.getContext('2d')

  // Draw product image
  ctx.drawImage(productImg, 0, 0)

  // Apply tint if no per-color image (fallback)
  if (!imgSrc || !hasPerColorImage(productId, colorName)) {
    // Simple tint approximation — draw a colored rectangle with 'color' blend
    ctx.globalCompositeOperation = 'hue'
    ctx.fillStyle = colorHex
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Draw design overlay(s)
  if (designUrl) {
    const designImg = await loadImage(designUrl)
    const designAspect = designImg.naturalHeight / designImg.naturalWidth

    if (placement === 'front' || placement === 'both') {
      drawDesign(ctx, designImg, POSITIONS.front, designAspect, canvas.width, canvas.height)
    }
    if (placement === 'back' || placement === 'both') {
      drawDesign(ctx, designImg, POSITIONS.back, designAspect, canvas.width, canvas.height)
    }
  }

  return canvas.toDataURL('image/png')
}

function drawDesign(ctx, img, pos, aspect, cw, ch) {
  const dw = cw * pos.w
  const dh = dw * aspect
  const dx = cw * pos.x - dw / 2
  const dy = ch * pos.y - dh / 2
  ctx.globalAlpha = 0.92
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
