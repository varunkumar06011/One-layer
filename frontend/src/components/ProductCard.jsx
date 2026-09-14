import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image" style={{ background: product.colors[0].hex }}>
        <div className="product-card-placeholder">
          <span className="product-card-fit">{product.fit}</span>
        </div>
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-tagline text-muted">{product.tagline}</p>
        <p className="product-card-price">
          from &#8377;{Math.min(...Object.values(product.pricing))}
        </p>
      </div>
    </Link>
  )
}
