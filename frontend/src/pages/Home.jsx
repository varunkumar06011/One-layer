import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import logoImg from '../assets/logo/one-layer-logo.jpeg'
import mainLanding from '../assets/images/main-landing.png'
import collarTshirt from '../assets/images/collar-tshirt.png'
import customizeTee from '../assets/images/customize-tee.png'
import forCompany from '../assets/images/for-company.png'
import { getProductImage } from '../data/productImages.js'

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
              <img src={mainLanding} alt="ONE LAYER collection" className="hero-image-img" />
            </div>
          </div>
        </div>
      </section>

      {/* Three Entry Points */}
      <section className="section entry-points">
        <div className="container">
          <div className="entry-grid">
            <Link to="/shop" className="entry-card">
              <div className="entry-card-visual">
                <img src={collarTshirt} alt="Shop Tees" className="entry-card-img" />
              </div>
              <div className="entry-card-body">
                <h3>Shop Tees</h3>
                <p className="text-muted">Polo collar. Round neck. Oversized printed. Pick your fit.</p>
                <span className="entry-card-link">Explore</span>
              </div>
            </Link>

            <Link to="/customize" className="entry-card">
              <div className="entry-card-visual">
                <img src={customizeTee} alt="Customize Your Own" className="entry-card-img" />
              </div>
              <div className="entry-card-body">
                <h3>Customize Your Own</h3>
                <p className="text-muted">Upload your design. Choose placement. See it live.</p>
                <span className="entry-card-link">Start designing</span>
              </div>
            </Link>

            <Link to="/companies" className="entry-card">
              <div className="entry-card-visual">
                <img src={forCompany} alt="For Companies" className="entry-card-img" />
              </div>
              <div className="entry-card-body">
                <h3>For Companies</h3>
                <p className="text-muted">Employee uniforms in bulk. Logo, names, sizes — one flow.</p>
                <span className="entry-card-link">Get a quote</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy strip */}
      <section className="section bg-stone philosophy">
        <div className="container-narrow text-center">
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
            <Link to="/shop" className="btn btn-ghost">View all</Link>
          </div>
          <div className="product-grid">
            {(products || []).map((p, i) => {
              const productImage = getProductImage(p.id, p.colors[0]?.name)
              return (
              <div key={p.id} className="product-preview">
                <div className="product-preview-image" style={{ background: p.colors[0].hex }}>
                  {productImage ? (
                    <img src={productImage} alt={p.name} className="product-preview-img" />
                  ) : (
                    <span className="product-preview-fit">{p.fit}</span>
                  )}
                </div>
                <h3>{p.name}</h3>
                <p className="text-muted">{p.tagline}</p>
                <p className="product-preview-price">
                  from &#8377;{Math.min(...Object.values(p.pricing))}
                </p>
                <Link to={`/product/${p.id}`} className="btn btn-outline btn-sm">View</Link>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Companies CTA */}
      <section className="section bg-ink companies-cta">
        <div className="container">
          <div className="companies-cta-inner">
            <div>
              <h2>Uniforms that don't feel like uniforms.</h2>
              <p style={{ color: '#a0a0a0', maxWidth: '500px' }}>
                Upload your logo once. Save your team's sizes. Reorder in 30 seconds.
              </p>
            </div>
            <Link to="/companies" className="btn btn-outline" style={{ borderColor: '#f7f6f3', color: '#f7f6f3' }}>
              For Companies
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
