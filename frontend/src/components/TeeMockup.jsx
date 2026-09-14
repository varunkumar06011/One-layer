import { getProductImage, hasPerColorImage } from '../data/productImages.js'

const PLACEMENT_OPTIONS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'both', label: 'Both' },
]

/**
 * TeeMockup — renders the real product image for the chosen color,
 * with the uploaded design overlaid at the selected placement (front/back/both).
 *
 * The per-color images show front view on the LEFT half and back view on the
 * RIGHT half of a 3:2 landscape image. Design positions reflect that.
 *
 * Props:
 *   product   — product object (must have id, name, fit)
 *   color     — { name, hex } selected color
 *   design    — { name, url } uploaded design file, or null
 *   placement — 'front' | 'back' | 'both'
 *   onPlacementChange — callback(placement) optional, shows toggle buttons when provided
 *   size      — 'sm' | 'md' | 'lg' (controls the image container sizing)
 */
export default function TeeMockup({
  product,
  color,
  design = null,
  placement = 'front',
  onPlacementChange = null,
  size = 'lg',
}) {
  const hex = color?.hex || '#f7f6f3'
  const colorName = color?.name

  const img = getProductImage(product?.id, colorName)
  // If we have a per-color image, no tint needed. If using fallback, apply tint.
  const useTint = !hasPerColorImage(product?.id, colorName)

  const showFront = design && (placement === 'front' || placement === 'both')
  const showBack = design && (placement === 'back' || placement === 'both')

  return (
    <div className={`tee-mockup tee-mockup-${size}`}>
      <div className="tee-mockup-canvas">
        {img ? (
          <>
            <img
              src={img}
              alt={product?.name || 'Tee'}
              className="tee-mockup-img"
              crossOrigin="anonymous"
            />
            {useTint && (
              <div className="tee-mockup-tint" style={{ background: hex }} />
            )}
          </>
        ) : (
          <div className="tee-mockup-silhouette" style={{ background: hex }}>
            {product?.fit === 'polo' && <div className="tee-collar"></div>}
          </div>
        )}

        {/* Design overlay — front and/or back */}
        {showFront && (
          <div className={`tee-mockup-print ${placement === 'both' ? 'tee-mockup-print-front-both' : 'tee-mockup-print-front'}`}>
            <img src={design.url} alt="Your design" crossOrigin="anonymous" />
          </div>
        )}
        {showBack && (
          <div className={`tee-mockup-print ${placement === 'both' ? 'tee-mockup-print-back-both' : 'tee-mockup-print-back'}`}>
            <img src={design.url} alt="Your design (back)" crossOrigin="anonymous" />
          </div>
        )}

        {/* Front / Back / Both toggle */}
        {onPlacementChange && (
          <div className="tee-mockup-controls">
            {PLACEMENT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`mockup-side ${placement === opt.key ? 'active' : ''}`}
                onClick={() => onPlacementChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
