import { useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { useProducts } from '../hooks/useProducts.js'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'polo', label: 'Polo Collar' },
  { key: 'round', label: 'Round Neck' },
  { key: 'oversized', label: 'Oversized' },
]

export default function Shop() {
  const [filter, setFilter] = useState('all')
  const { products, loading, error } = useProducts()

  const filtered = !products
    ? []
    : filter === 'all'
      ? products
      : products.filter((p) => p.fit === filter)

  return (
    <div className="shop">
      <section className="section-sm shop-header">
        <div className="container">
          <p className="eyebrow">The Collection</p>
          <h1>Tees, by fit.</h1>
          <p className="text-muted shop-subtitle">
            Filter by silhouette. Each tee is made from combed cotton with a matte finish.
          </p>
        </div>
      </section>

      <section className="section shop-filters">
        <div className="container">
          <div className="filter-bar">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && <p className="text-muted">Loading collection...</p>}
          {error && <p className="text-muted">Unable to load products. Please try again.</p>}

          <div className="product-grid-large">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
