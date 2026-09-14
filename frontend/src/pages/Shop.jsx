import { useState, useMemo } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { useProducts } from '../hooks/useProducts.js'

const fitFilters = [
  { key: 'all', label: 'All' },
  { key: 'polo', label: 'Polo Collar' },
  { key: 'round', label: 'Round Neck' },
  { key: 'oversized', label: 'Oversized' },
]

export default function Shop() {
  const [filter, setFilter] = useState('all')
  const { products, loading, error } = useProducts()

  // Derive the global price bounds from all products once they load.
  // Each product's price range is [min(pricing), max(pricing)].
  const { minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) return { minPrice: 0, maxPrice: 0 }
    const allPrices = products.flatMap((p) => Object.values(p.pricing))
    return {
      minPrice: Math.min(...allPrices),
      maxPrice: Math.max(...allPrices),
    }
  }, [products])

  // Selected price range — initialised to the full bounds
  const [priceRange, setPriceRange] = useState({ min: null, max: null })

  // Once products load, initialise the slider to the full range
  const activeMin = priceRange.min ?? minPrice
  const activeMax = priceRange.max ?? maxPrice

  const filtered = useMemo(() => {
    if (!products) return []
    const byFit = filter === 'all' ? products : products.filter((p) => p.fit === filter)
    return byFit.filter((p) => {
      const pMin = Math.min(...Object.values(p.pricing))
      const pMax = Math.max(...Object.values(p.pricing))
      // Product overlaps the selected range
      return pMax >= activeMin && pMin <= activeMax
    })
  }, [products, filter, activeMin, activeMax])

  // Expand products into per-color variant cards.
  // Collar Polo and Neckless Round expand into one card per color.
  // Oversized Printed stays as a single card (color is chosen on the product page).
  const variants = useMemo(() => {
    if (!filtered.length) return []
    return filtered.flatMap((p) => {
      if (p.id === 'oversized-printed') {
        return [{
          ...p,
          variantId: p.id,
          variantColor: p.colors[0],
          variantName: p.name,
        }]
      }
      return p.colors.map((c) => ({
        ...p,
        variantId: `${p.id}--${c.name}`,
        variantColor: c,
        variantName: `${p.name} — ${c.name}`,
      }))
    })
  }, [filtered])

  return (
    <div className="shop">
      <section className="section-sm shop-header">
        <div className="container">
          <h1>Tees, by fit.</h1>
          <p className="text-muted shop-subtitle">
            Filter by silhouette. Each tee is made from combed cotton with a matte finish.
          </p>
        </div>
      </section>

      <section className="section shop-filters">
        <div className="container">
          <div className="filter-bar">
            {fitFilters.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Price range slider */}
          {maxPrice > 0 && (
            <div className="price-filter">
              <label className="option-label">Price range</label>
              <div className="price-filter-controls">
                <span className="price-filter-value">&#8377;{activeMin}</span>
                <div className="price-slider-wrap">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={activeMin}
                    onChange={(e) => setPriceRange((r) => ({
                      ...r,
                      min: Math.min(Number(e.target.value), activeMax),
                    }))}
                    className="price-slider price-slider-min"
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={activeMax}
                    onChange={(e) => setPriceRange((r) => ({
                      ...r,
                      max: Math.max(Number(e.target.value), activeMin),
                    }))}
                    className="price-slider price-slider-max"
                    aria-label="Maximum price"
                  />
                </div>
                <span className="price-filter-value">&#8377;{activeMax}</span>
              </div>
              {(activeMin !== minPrice || activeMax !== maxPrice) && (
                <button
                  className="btn btn-ghost btn-sm price-filter-reset"
                  onClick={() => setPriceRange({ min: minPrice, max: maxPrice })}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {loading && <p className="text-muted">Loading collection...</p>}
          {error && <p className="text-muted">Unable to load products. Please try again.</p>}

          {!loading && variants.length === 0 && products && (
            <p className="text-muted">No tees in this price range. Try widening the filter.</p>
          )}

          <div className="product-grid-large">
            {variants.map((v) => (
              <ProductCard key={v.variantId} product={v} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
