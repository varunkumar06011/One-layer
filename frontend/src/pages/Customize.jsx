import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../context/CartContext.jsx'
import { customPricing } from '../data/products.js'
import { getProductImage } from '../data/productImages.js'
import { captureMockup } from '../data/mockupCapture.js'
import { buildWhatsAppLink, WHATSAPP_NUMBERS } from '../api/client.js'
import TeeMockup from '../components/TeeMockup.jsx'

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
  const [placement, setPlacement] = useState('front')
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

  const handleSave = async () => {
    try {
      const dataUrl = await captureMockup(product?.id, activeColor?.name, activeColor?.hex, designFile?.url, placement)
      const link = document.createElement('a')
      link.download = `${product?.name || 'custom'} - ${activeColor?.name || ''} - ${placement}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to save mockup:', err)
      alert('Unable to save image. Please try again.')
    }
  }

  const handleBuyNow = async () => {
    // Build the order message
    const lines = [
      `Hi ONE LAYER,`,
      ``,
      `I would like to order a custom tee:`,
      `Product: ${product.name}`,
      `Color: ${activeColor.name}`,
      `Size: ${size}`,
      `Quantity: ${quantity}`,
      `Design placement: ${placement === 'both' ? 'Front & Back' : placement}`,
      `Total: Rs.${price}`,
    ]

    // If there's a custom design, try to save the mockup image and share
    let mockupDataUrl = null
    if (designFile) {
      try {
        mockupDataUrl = await captureMockup(product?.id, activeColor?.name, activeColor?.hex, designFile?.url, placement)
      } catch (err) {
        console.error('Mockup capture failed:', err)
      }
    }

    if (mockupDataUrl) {
      lines.push(``)
      lines.push(`I have saved the customized t-shirt preview image above.`)
      lines.push(`Please confirm the design matches what's shown before printing.`)
    }

    const message = lines.join('\n')
    const whatsappNumber = WHATSAPP_NUMBERS[0] // primary number
    const link = buildWhatsAppLink(whatsappNumber, message)

    // If we have the image, try Web Share API first (mobile), download it, then open WhatsApp
    if (mockupDataUrl) {
      try {
        const blob = await (await fetch(mockupDataUrl)).blob()
        const file = new File([blob], 'custom-tee.png', { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Custom Tee Design',
            text: message,
          })
          return // shared successfully
        }
      } catch (err) {
        // Web Share not available, fall through to download + WhatsApp link
      }
      // Download the image so the user has it
      const link = document.createElement('a')
      link.download = 'custom-tee.png'
      link.href = mockupDataUrl
      link.click()
    }

    // Open WhatsApp with the order details
    window.open(link, '_blank')
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
                    onClick={() => { setProduct(p); setColor(p.colors[0]); setStep(1) }}
                  >
                    <div className="fit-card-visual" style={{ background: p.colors[0].hex }}>
                      {getProductImage(p.id, p.colors[0]?.name) ? (
                        <img src={getProductImage(p.id, p.colors[0]?.name)} alt={p.name} className="fit-card-img" />
                      ) : (
                        <span>{p.fit}</span>
                      )}
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
                <TeeMockup
                  product={product}
                  color={activeColor}
                  size="lg"
                />
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
                <TeeMockup
                  product={product}
                  color={activeColor}
                  design={designFile}
                  placement={placement}
                  onPlacementChange={setPlacement}
                  size="lg"
                />
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
                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
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
                <TeeMockup
                  product={product}
                  color={activeColor}
                  design={designFile}
                  placement={placement}
                  onPlacementChange={setPlacement}
                  size="lg"
                />
                <div className="review-summary">
                  <div className="review-row"><span>Product</span><span>{product.name}</span></div>
                  <div className="review-row"><span>Color</span><span>{activeColor.name}</span></div>
                  <div className="review-row"><span>Placement</span><span>{placement === 'both' ? 'Front & Back' : placement}</span></div>
                  <div className="review-row"><span>Size</span><span>{size}</span></div>
                  <div className="review-row"><span>Quantity</span><span>{quantity}</span></div>
                  <div className="review-row review-row-total">
                    <span>Total</span><span>&#8377;{price}</span>
                  </div>
                  <div className="review-actions">
                    <button className="btn btn-outline btn-full" onClick={handleSave}>
                      Save design
                    </button>
                    <button className="btn btn-outline btn-full" onClick={handleAdd} disabled={added}>
                      {added ? 'Added to cart' : 'Add to cart'}
                    </button>
                    <button className="btn btn-primary btn-full" onClick={handleBuyNow}>
                      Buy Now — WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="step-nav">
            {step > 0 && <button className="btn btn-outline" onClick={prev}>Back</button>}
            {step < 4 && (
              <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
                Continue
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
