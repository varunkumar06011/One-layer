import { Link } from 'react-router-dom'
import { getProductImage } from '../data/productImages.js'

export default function ProductCard({ product }) {
  // A color variant (from Shop) carries variantColor + variantName.
  // A plain product (from Home) uses its first color.
  const isVariant = !!product.variantColor
  const color = isVariant ? product.variantColor : product.colors[0]
  const name = isVariant ? product.variantName : product.name
  const linkTo = isVariant
    ? `/product/${product.id}?color=${encodeURIComponent(color.name)}`
    : `/product/${product.id}`

  const productImage = getProductImage(product.id, color?.name)

  return (
    <Link to={linkTo} className="product-card">
      <div className="product-card-image" style={{ background: color?.hex || '#f7f6f3' }}>
        {productImage ? (
          <img src={productImage} alt={name} className="product-card-img" />
        ) : (
          <div className="product-card-placeholder">
            <span className="product-card-fit">{product.fit}</span>
          </div>
        )}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{name}</h3>
        <p className="product-card-tagline text-muted">{product.tagline}</p>
        {/* Show color swatches only for single-card products (e.g. Oversized Printed) */}
        {!isVariant && product.colors.length > 1 && (
          <div className="product-card-swatches">
            {product.colors.map((c) => (
              <span
                key={c.name}
                className="product-card-swatch"
                style={{ background: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
        <p className="product-card-price">
          from &#8377;{Math.min(...Object.values(product.pricing))}
        </p>
      </div>
    </Link>
  )
}
