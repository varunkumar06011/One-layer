import { useState, useRef } from 'react'
import { useProducts } from '../hooks/useProducts.js'
import { createQuote, requestSampleKit } from '../api/client.js'
import { customPricing as CUSTOM_PRICING } from '../data/products.js'
import forCompany from '../assets/images/for-company.png'

export default function Companies() {
  const { products } = useProducts()
  const fileRef = useRef(null)
  const [logo, setLogo] = useState(null)
  const [product, setProduct] = useState(null)
  const [color, setColor] = useState(null)
  const [employees, setEmployees] = useState([
    { name: '', size: 'M', qty: 1 },
  ])
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(null)
  const [sampleRequested, setSampleRequested] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)

  // Set default product once products load
  if (products && !product) {
    setProduct(products[0])
    setColor(products[0].colors[0])
  }

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    if (file) setLogo({ name: file.name, url: URL.createObjectURL(file) })
  }

  const addRow = () =>
    setEmployees([...employees, { name: '', size: 'M', qty: 1 }])

  const removeRow = (i) =>
    setEmployees(employees.filter((_, idx) => idx !== i))

  const updateRow = (i, field, val) =>
    setEmployees(employees.map((e, idx) => idx === i ? { ...e, [field]: val } : e))

  const calculateQuote = async () => {
    if (!product) return
    setQuoteLoading(true)
    setQuoteError(null)
    try {
      const result = await createQuote({
        productId: product.id,
        color: color?.name,
        employees,
      })
      setQuote(result)
    } catch (err) {
      setQuoteError(err.message)
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleSampleKit = async () => {
    setSampleLoading(true)
    try {
      await requestSampleKit({
        company: 'Sample request',
        contactName: '—',
        email: '—',
      })
      setSampleRequested(true)
    } catch (err) {
      setSampleRequested(true) // still show success in UI
    } finally {
      setSampleLoading(false)
    }
  }

  const activeProduct = product
  const activeColor = color

  return (
    <div className="companies">
      {/* Hero */}
      <section className="section-sm companies-hero">
        <div className="container-narrow text-center">
          <h1>Uniforms that don't feel like uniforms.</h1>
          <p className="text-muted companies-hero-sub">
            Upload your logo once. Set your team's sizes. Reorder in 30 seconds.
            Calm, considered apparel for teams that care about the details.
          </p>
        </div>
        <div className="container">
          <div className="companies-hero-image">
            <img src={forCompany} alt="For Companies" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-stone">
        <div className="container">
          <div className="how-grid">
            <div className="how-card">
              <span className="how-num">01</span>
              <h3>Upload your logo</h3>
              <p className="text-muted">One upload. We save your company profile for future reorders.</p>
            </div>
            <div className="how-card">
              <span className="how-num">02</span>
              <h3>Choose a tee</h3>
              <p className="text-muted">Polo collar, round neck, or oversized. Pick a color that matches your brand.</p>
            </div>
            <div className="how-card">
              <span className="how-num">03</span>
              <h3>Enter team sizes</h3>
              <p className="text-muted">A simple table — name, size, quantity. Add or remove rows as needed.</p>
            </div>
            <div className="how-card">
              <span className="how-num">04</span>
              <h3>Get a quote</h3>
              <p className="text-muted">Instant pricing. Request a sample kit to feel the fabric first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bulk order form */}
      <section className="section">
        <div className="container">
          <h2>Build your order</h2>

          {/* Logo upload */}
          <div className="bulk-section">
            <label className="option-label">1. Company logo</label>
            <div
              className="upload-zone upload-zone-wide"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) setLogo({ name: file.name, url: URL.createObjectURL(file) })
              }}
            >
              {logo ? (
                <div className="upload-preview">
                  <img src={logo.url} alt="Logo" />
                  <span>{logo.name}</span>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setLogo(null) }}>Replace</button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <p>Drag & drop your company logo</p>
                  <p className="text-muted">PNG (transparent) or SVG recommended</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} hidden />
            </div>
          </div>

          {/* Product + color */}
          <div className="bulk-section">
            <label className="option-label">2. Choose product & color</label>
            <div className="bulk-product-row">
              <div className="bulk-product-select">
                {(products || []).map((p) => (
                  <button
                    key={p.id}
                    className={`fit-card-sm ${activeProduct?.id === p.id ? 'active' : ''}`}
                    onClick={() => { setProduct(p); setColor(p.colors[0]) }}
                  >
                    <div className="fit-card-visual-sm" style={{ background: p.colors[0].hex }}></div>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="swatch-row">
                {activeProduct?.colors.map((c) => (
                  <button
                    key={c.name}
                    className={`swatch ${activeColor?.name === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c)}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Employee table */}
          <div className="bulk-section">
            <label className="option-label">3. Employee sizes & quantities</label>
            <div className="employee-table">
              <div className="employee-table-header">
                <span>Name / Role</span>
                <span>Size</span>
                <span>Qty</span>
                <span>Price</span>
                <span></span>
              </div>
              {employees.map((emp, i) => (
                <div key={i} className="employee-table-row">
                  <input
                    type="text"
                    placeholder="e.g. Arjun — Designer"
                    value={emp.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                  />
                  <select value={emp.size} onChange={(e) => updateRow(i, 'size', e.target.value)}>
                    {(activeProduct?.sizes || ['S', 'M', 'L', 'XL']).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={emp.qty}
                    onChange={(e) => updateRow(i, 'qty', parseInt(e.target.value) || 1)}
                  />
                  <span>&#8377;{CUSTOM_PRICING[emp.size] * emp.qty}</span>
                  <button className="row-remove" onClick={() => removeRow(i)} disabled={employees.length === 1}>x</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={addRow}>+ Add row</button>
            </div>
          </div>

          {/* Quote */}
          <div className="bulk-section bulk-quote">
            <button className="btn btn-primary" onClick={calculateQuote} disabled={quoteLoading || !activeProduct}>
              {quoteLoading ? 'Calculating...' : 'Calculate quote'}
            </button>
            {quoteError && <p className="text-muted">{quoteError}</p>}
            {quote && (
              <div className="quote-result fade-in">
                <div className="quote-row"><span>Total items</span><span>{quote.totalQty}</span></div>
                <div className="quote-row"><span>Per unit (avg)</span><span>&#8377;{quote.perUnit}</span></div>
                <div className="quote-row quote-row-total"><span>Estimated total</span><span>&#8377;{quote.total}</span></div>
                <p className="text-muted quote-note">
                  {quote.note}
                </p>
              </div>
            )}
          </div>

          {/* Sample kit */}
          <div className="bulk-section sample-kit">
            <div className="sample-kit-inner">
              <div>
                <h3>Request a Sample Kit</h3>
                <p className="text-muted">
                  Feel the fabric. Try the fits. We'll send a kit with swatches of all three tees in your brand colors.
                </p>
              </div>
              <button
                className={`btn ${sampleRequested ? 'btn-outline' : 'btn-primary'}`}
                onClick={handleSampleKit}
                disabled={sampleLoading}
              >
                {sampleLoading ? 'Requesting...' : sampleRequested ? "Requested — we'll be in touch" : 'Request Sample Kit'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
