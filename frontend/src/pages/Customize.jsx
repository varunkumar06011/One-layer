import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../context/CartContext.jsx'
import { customPricing } from '../data/products.js'

const steps = ['Product', 'Color', 'Artwork', 'Size & Qty', 'Review']

export default function Customize() {
  const navigate = useNavigate()
  const { products } = useProducts()
  const { addItem } = useCart()
  const fileRef = useRef(null)

  const [step, setStep] = useState(0)
  const [product, setProduct] = useState(null)
  const [color, setColor] = useState(null)
  const [designFile, setDesignFile] = useState(null)
  const [placement, setPlacement] = useState('chest')
  const [size, setSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const price = customPricing[size] * quantity

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) setDesignFile({ name: file.name, url: URL.createObjectURL(file) })
  }

  const next = () => setStep((s) => Math.min(4, s + 1))
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const handleAdd = () => {
    addItem({ product, size, color: activeColor, quantity, customDesign: designFile, placement })
    setAdded(true)
    setTimeout(() => navigate('/cart'), 1200)
  }

  const canProceed = () => {
    if (step === 2 && !designFile) return false
    return true
  }

  // Set defaults once products load
  if (products && !product) {
    setProduct(products[0])
    setColor(products[0].colors[0])
  }

  if (!products || !product) {
    return (
      <div className="customize">
        <section className="section-sm customize-header">
          <div className="container">
            <p className="eyebrow">Design Studio</p>
            <h1>Customize your own.</h1>
          </div>
        </section>
        <div className="container section">
          <p className="text-muted">Loading studio...</p>
        </div>
      </div>
    )
  }

  const activeColor = color || product.colors[0]

  return (
    <div className="customize">
      <section className="section-sm customize-header">
        <div className="container">
          <p className="eyebrow">Design Studio</p>
          <h1>Customize your own.</h1>
        </div>
      </section>

      {/* Step indicator */}
      <div className="container">
        <div className="step-indicator">
          {steps.map((s, i) => (
            <div key={s} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{s}</span>
            </div>
          ))}
        </div>
        <div className="step-progress">
          <div className="step-progress-bar" style={{ width: `${((step + 1) / 5) * 100}%` }}></div>
        </div>
      </div>

      <section className="section customize-body">
        <div className="container">
          {/* Step 0: Product + Fit */}
          {step === 0 && (
            <div className="step-content fade-in">
              <h2>Choose your fit</h2>
              <div className="fit-grid">
                {products.map((p) => (
                  <button
                    key={p.id}
                    className={`fit-card ${product.id === p.id ? 'active' : ''}`}
                    onClick={() => { setProduct(p); setColor(p.colors[0]) }}
                  >
                    <div className="fit-card-visual" style={{ background: p.colors[0].hex }}>
                      <span>{p.fit}</span>
                    </div>
                    <h3>{p.name}</h3>
                    <p className="text-muted">{p.tagline}</p>
                    <p className="fit-card-price">from &#8377;{customPricing.S}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Color */}
          {step === 1 && (
            <div className="step-content fade-in">
              <h2>Choose a color</h2>
              <div className="color-step-layout">
                <div className="color-mockup" style={{ background: activeColor.hex }}>
                  <div className="tee-body">
                    {product.fit === 'polo' && <div className="tee-collar"></div>}
                  </div>
                </div>
                <div className="color-options">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      className={`color-option ${activeColor.name === c.name ? 'active' : ''}`}
                      onClick={() => setColor(c)}
                    >
                      <span className="color-swatch" style={{ background: c.hex }}></span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Artwork */}
          {step === 2 && (
            <div className="step-content fade-in">
              <h2>Upload your artwork</h2>
              <div className="artwork-layout">
                <div className="artwork-mockup" style={{ background: activeColor.hex }}>
                  <div className={`tee-body ${placement === 'back' ? 'back' : ''}`}>
                    {product.fit === 'polo' && <div className="tee-collar"></div>}
                    {designFile && (
                      <div className={`tee-print tee-print-${placement}`}>
                        <img src={designFile.url} alt="Design" />
                      </div>
                    )}
                  </div>
                  <div className="mockup-controls">
                    {['front', 'back', 'sleeve'].map((pl) => (
                      <button
                        key={pl}
                        className={`mockup-side ${placement === pl ? 'active' : ''}`}
                        onClick={() => setPlacement(pl)}
                      >
                        {pl.charAt(0).toUpperCase() + pl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="artwork-upload">
                  <div
                    className="upload-zone upload-zone-large"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files?.[0]
                      if (file) setDesignFile({ name: file.name, url: URL.createObjectURL(file) })
                    }}
                  >
                    {designFile ? (
                      <div className="upload-preview">
                        <img src={designFile.url} alt="Design preview" />
                        <span>{designFile.name}</span>
                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setDesignFile(null) }}>
                          Replace
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <p>Drag & drop your artwork</p>
                        <p className="text-muted">or click to browse</p>
                        <p className="text-muted">PNG (transparent) recommended · SVG · JPG</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Size & Qty */}
          {step === 3 && (
            <div className="step-content fade-in">
              <h2>Choose size & quantity</h2>
              <div className="size-qty-layout">
                <div className="size-step">
                  <label className="option-label">Size</label>
                  <div className="size-row">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        className={`size-btn ${size === s ? 'active' : ''}`}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="size-price text-muted">Price: &#8377;{customPricing[size]} per tee</p>
                </div>
                <div className="qty-step">
                  <label className="option-label">Quantity</label>
                  <div className="qty-row">
                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>&minus;</button>
                    <span className="qty-value">{quantity}</span>
                    <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-content fade-in">
              <h2>Review your design</h2>
              <div className="review-layout">
                <div className="review-mockup" style={{ background: activeColor.hex }}>
                  <div className={`tee-body ${placement === 'back' ? 'back' : ''}`}>
                    {product.fit === 'polo' && <div className="tee-collar"></div>}
                    {designFile && (
                      <div className={`tee-print tee-print-${placement}`}>
                        <img src={designFile.url} alt="Design" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="review-summary">
                  <div className="review-row"><span>Product</span><span>{product.name}</span></div>
                  <div className="review-row"><span>Color</span><span>{activeColor.name}</span></div>
                  <div className="review-row"><span>Placement</span><span>{placement}</span></div>
                  <div className="review-row"><span>Size</span><span>{size}</span></div>
                  <div className="review-row"><span>Quantity</span><span>{quantity}</span></div>
                  <div className="review-row review-row-total">
                    <span>Total</span><span>&#8377;{price}</span>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleAdd} disabled={added}>
                    {added ? 'Added — redirecting...' : 'Add to cart'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="step-nav">
            {step > 0 && <button className="btn btn-outline" onClick={prev}>&larr; Back</button>}
            {step < 4 && (
              <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
                Continue &rarr;
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
