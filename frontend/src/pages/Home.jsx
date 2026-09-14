import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import logoImg from '../assets/logo/one-layer-logo.jpeg'

export default function Home() {
  const { products } = useProducts()
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <img src={logoImg} alt="ONE LAYER" className="hero-logo fade-in" />
            <p className="hero-subtitle fade-in fade-in-delay-2">
              Your style, without the rules.
            </p>
            <div className="hero-actions fade-in fade-in-delay-3">
              <Link to="/shop" className="btn btn-primary">Shop Tees</Link>
              <Link to="/customize" className="btn btn-outline">Customize Your Own</Link>
            </div>
          </div>
          <div className="hero-visual fade-in fade-in-delay-2">
            <div className="hero-image-block">
              <div className="hero-image-bg"></div>
              <p className="hero-image-label">SS / 26</p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Entry Points */}
      <section className="section entry-points">
        <div className="container">
          <div className="entry-grid">
            <Link to="/shop" className="entry-card">
              <div className="entry-card-visual" style={{ background: '#e7e3dc' }}>
                <span className="entry-card-num">01</span>
              </div>
              <div className="entry-card-body">
                <h3>Shop Tees</h3>
                <p className="text-muted">Polo collar. Round neck. Oversized printed. Pick your fit.</p>
                <span className="entry-card-link">Explore &rarr;</span>
              </div>
            </Link>

            <Link to="/customize" className="entry-card">
              <div className="entry-card-visual" style={{ background: '#d4cec3' }}>
                <span className="entry-card-num">02</span>
              </div>
              <div className="entry-card-body">
                <h3>Customize Your Own</h3>
                <p className="text-muted">Upload your design. Choose placement. See it live.</p>
                <span className="entry-card-link">Start designing &rarr;</span>
              </div>
            </Link>

            <Link to="/companies" className="entry-card">
              <div className="entry-card-visual" style={{ background: '#111114' }}>
                <span className="entry-card-num" style={{ color: '#f7f6f3' }}>03</span>
              </div>
              <div className="entry-card-body">
                <h3>For Companies</h3>
                <p className="text-muted">Employee uniforms in bulk. Logo, names, sizes — one flow.</p>
                <span className="entry-card-link">Get a quote &rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy strip */}
      <section className="section bg-stone philosophy">
        <div className="container-narrow text-center">
          <p className="eyebrow">The philosophy</p>
          <h2 className="philosophy-text">
            We believe in one layer of fabric, one layer of identity.
            No excess. No noise. Just the tee you reach for, again and again.
          </h2>
        </div>
      </section>

      {/* Product preview */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>The Collection</h2>
            <Link to="/shop" className="btn btn-ghost">View all &rarr;</Link>
          </div>
          <div className="product-grid">
            {(products || []).map((p) => (
              <div key={p.id} className="product-preview">
                <div className="product-preview-image" style={{ background: p.colors[0].hex }}>
                  <span className="product-preview-fit">{p.fit}</span>
                </div>
                <h3>{p.name}</h3>
                <p className="text-muted">{p.tagline}</p>
                <p className="product-preview-price">
                  from &#8377;{Math.min(...Object.values(p.pricing))}
                </p>
                <Link to={`/product/${p.id}`} className="btn btn-outline btn-sm">View</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies CTA */}
      <section className="section bg-ink companies-cta">
        <div className="container">
          <div className="companies-cta-inner">
            <div>
              <p className="eyebrow" style={{ color: '#8a8680' }}>For Teams</p>
              <h2>Uniforms that don't feel like uniforms.</h2>
              <p style={{ color: '#a0a0a0', maxWidth: '500px' }}>
                Upload your logo once. Save your team's sizes. Reorder in 30 seconds.
              </p>
            </div>
            <Link to="/companies" className="btn btn-outline" style={{ borderColor: '#f7f6f3', color: '#f7f6f3' }}>
              For Companies &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
