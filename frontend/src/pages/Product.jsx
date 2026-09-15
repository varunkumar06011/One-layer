import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts.js'
import { useCart } from '../context/CartContext.jsx'
import { customPricing } from '../data/products.js'
import { getProductImage, hasPerColorImage } from '../data/productImages.js'

export default function Product() {
  const { id } = useParams()
  const { product, loading, error } = useProduct(id)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const fileRef = useRef(null)
  const [searchParams] = useSearchParams()
  const preselectedColor = searchParams.get('color')

  const [size, setSize] = useState('M')
  const [color, setColor] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [customMode, setCustomMode] = useState(false)
  const [designFile, setDesignFile] = useState(null)
  const [placement, setPlacement] = useState('front')
  const [added, setAdded] = useState(false)

  // Set default color once product loads.
  // If a color was passed via ?color= query param, prefer that one.
  useEffect(() => {
    if (product && !color) {
      const match = preselectedColor
        ? product.colors.find((c) => c.name === preselectedColor)
        : null
      setColor(match || product.colors[0])
    }
  }, [product, color, preselectedColor])

  if (loading) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container section text-center">
        <h1>Product not found</h1>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    )
  }

  const isCustom = customMode
  const price = isCustom ? customPricing[size] : product.pricing[size]
  const activeColor = color || product.colors[0]
  const productImage = getProductImage(product.id, activeColor?.name)
  const useTint = !hasPerColorImage(product.id, activeColor?.name)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setDesignFile({ name: file.name, url: URL.createObjectURL(file) })
    }
  }

  const handleAdd = () => {
    addItem({
      product,
      size,
      color: activeColor,
      quantity,
      customDesign: customMode ? designFile : null,
      placement: customMode ? placement : null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const handleBuyNow = () => {
    addItem({
      product,
      size,
      color: activeColor,
      quantity,
      customDesign: customMode ? designFile : null,
      placement: customMode ? placement : null,
    })
    navigate('/cart')
  }

  return (
    <div className="product-page">
      <div className="product-layout">
        {/* Visual / Mockup */}
        <div className="product-visual">
          <div
            className="product-mockup"
            style={{ background: activeColor.hex }}
          >
            {productImage && !customMode ? (
              <>
                <img src={productImage} alt={product.name} className="product-mockup-img" />
                {useTint && <div className="product-mockup-tint" style={{ background: activeColor.hex }} />}
              </>
            ) : (
              <div className={`product-mockup-tee ${placement === 'back' ? 'back' : ''}`}>
                <div className="tee-body">
                  {product.fit === 'polo' && <div className="tee-collar"></div>}
                  {customMode && designFile && (
                    <div className={`tee-print tee-print-${placement}`}>
                      <img src={designFile.url} alt="Your design" />
                    </div>
                  )}
                  {!customMode && (
                    <div className="tee-label">
                      <span>{product.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="product-mockup-controls">
              <button
                className={`mockup-side ${placement === 'front' ? 'active' : ''}`}
                onClick={() => setPlacement('front')}
              >Front</button>
              <button
                className={`mockup-side ${placement === 'back' ? 'active' : ''}`}
                onClick={() => setPlacement('back')}
              >Back</button>
            </div>
          </div>
        </div>

        {/* Info / Options */}
        <div className="product-info">
          <p className="eyebrow">{product.fit === 'polo' ? 'Polo Collar' : product.fit === 'round' ? 'Round Neck' : 'Oversized'}</p>
          <h1 className="product-title">{product.name}</h1>
          <p className="product-desc text-muted">{product.description}</p>

          <div className="product-price-row">
            <span className="product-price">&#8377;{price}</span>
            {customMode && <span className="product-price-note">incl. custom print</span>}
          </div>

          {/* Color swatches */}
          <div className="option-group">
            <label className="option-label">Color — {activeColor.name}</label>
            <div className="swatch-row">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className={`swatch ${activeColor.name === c.name ? 'active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c)}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div className="option-group">
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
          </div>

          {/* Custom mode toggle */}
          {product.customizable && (
            <div className="option-group">
              <label className="option-label">
                Custom design
                <button
                  className={`custom-toggle ${customMode ? 'active' : ''}`}
                  onClick={() => setCustomMode(!customMode)}
                >
                  {customMode ? 'On' : 'Off'}
                </button>
              </label>
              {customMode && (
                <div className="custom-module">
                  <div
                    className="upload-zone"
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
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <p>Drag & drop your artwork here</p>
                        <p className="text-muted">PNG, SVG, or JPG — transparent PNG works best</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} hidden />
                  </div>

                  <div className="placement-row">
                    <label className="option-label">Placement</label>
                    <div className="placement-options">
                      {['front', 'back', 'sleeve'].map((pl) => (
                        <button
                          key={pl}
                          className={`placement-btn ${placement === pl ? 'active' : ''}`}
                          onClick={() => setPlacement(pl)}
                        >
                          {pl.charAt(0).toUpperCase() + pl.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="option-group">
            <label className="option-label">Quantity</label>
            <div className="qty-row">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {/* Add to cart */}
          <div className="product-actions">
            <button className="btn btn-primary btn-full" onClick={handleAdd}>
              {added ? 'Added to cart' : `Add to cart — \u20B9${price * quantity}`}
            </button>
            <button className="btn btn-outline btn-full" onClick={handleBuyNow}>
              Buy Now — &#8377;{price * quantity}
            </button>
            <Link to="/shop" className="btn btn-ghost">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
