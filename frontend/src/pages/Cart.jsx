import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { calculateShipping, createOrder, buildWhatsAppLink, WHATSAPP_NUMBERS } from '../api/client.js'
import {
  customPricing as CUSTOM_PRICING,
  CUSTOM_SURCHARGE,
  FREE_SHIPPING_THRESHOLD,
} from '../data/products.js'
import { getProductImage } from '../data/productImages.js'

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart()
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', pincode: '' })
  const [shippingInfo, setShippingInfo] = useState(null)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [orderSaved, setOrderSaved] = useState(false)
  const [savedOrder, setSavedOrder] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [whatsappUsed, setWhatsappUsed] = useState(null)
  const [orderedItems, setOrderedItems] = useState([])

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  const customSurcharge = items
    .filter((i) => i.customDesign)
    .reduce((sum, i) => sum + CUSTOM_SURCHARGE * i.quantity, 0)

  const totalSubtotal = subtotal + customSurcharge

  const handleCustomerChange = (field, value) => {
    setCustomer((c) => ({ ...c, [field]: value }))
    // Reset shipping if pincode changes
    if (field === 'pincode') {
      setShippingInfo(null)
      setOrderError(null)
    }
  }

  const handleCheckPincode = async () => {
    if (customer.pincode.length !== 6) return
    setCheckingPincode(true)
    setOrderError(null)
    try {
      const result = await calculateShipping(customer.pincode, itemCount, totalSubtotal)
      setShippingInfo(result)
    } catch (err) {
      setOrderError(err.message)
    } finally {
      setCheckingPincode(false)
    }
  }

  const isFreeShipping = shippingInfo?.isFreeShipping || totalSubtotal >= FREE_SHIPPING_THRESHOLD
  const finalShipping = shippingInfo ? (isFreeShipping ? 0 : shippingInfo.shippingCost) : null
  const total = totalSubtotal + (finalShipping || 0)

  // Validate form
  const formValid =
    customer.name.trim() &&
    customer.phone.trim().length >= 10 &&
    customer.address.trim() &&
    customer.pincode.length === 6 &&
    shippingInfo // shipping must be calculated

  // Build the WhatsApp message
  const buildOrderMessage = () => {
    let msg = 'New order from ONE LAYER website\n\n'
    msg += `Name: ${customer.name}\n`
    msg += `Phone: ${customer.phone}\n`
    msg += `Delivery Address: ${customer.address}, Pincode: ${customer.pincode}\n\n`
    msg += 'Items:\n'
    items.forEach((item, i) => {
      const basePrice = item.customDesign
        ? CUSTOM_PRICING[item.size]
        : item.product.pricing[item.size]
      const lineTotal = basePrice * item.quantity + (item.customDesign ? CUSTOM_SURCHARGE * item.quantity : 0)
      msg += `${i + 1}. ${item.product.name}${item.customDesign ? ' (Custom)' : ''} — Color: ${item.color.name}, Size: ${item.size}, Qty: ${item.quantity}`
      if (item.customDesign) {
        msg += `\n   Design: ${item.customDesign.name}`
      }
      msg += ` — ₹${lineTotal}\n`
    })
    msg += `\nSubtotal: ₹${totalSubtotal}\n`
    msg += `Shipping: ${isFreeShipping ? 'Free' : `₹${finalShipping}`}\n`
    msg += `Total: ₹${total}\n`
    if (savedOrder) {
      msg += `\nOrder ID: ${savedOrder.id}`
    }
    return msg
  }

  // Save order to admin panel, then open WhatsApp
  const handleBuyNow = async (whatsappNumber) => {
    setPlacing(true)
    setOrderError(null)
    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        customDesign: i.customDesign || null,
        placement: i.placement || null,
      }))
      const order = await createOrder({
        items: orderItems,
        customer: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          pincode: customer.pincode,
        },
        whatsappNumber: whatsappNumber || null,
      })
      setSavedOrder(order)
      setOrderSaved(true)
      setWhatsappUsed(whatsappNumber)
      // Save items for the confirmation screen before clearing
      setOrderedItems(items.map((i) => ({ ...i })))
      // Open WhatsApp with pre-filled message
      const message = buildOrderMessage()
      const link = buildWhatsAppLink(whatsappNumber, message)
      window.open(link, '_blank')
      // Clear cart after saving items for confirmation
      clearCart()
    } catch (err) {
      setOrderError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (orderSaved) {
    return (
      <div className="container section">
        <div className="order-confirmed fade-in text-center">
          <h1>Order placed.</h1>
          <p className="text-muted">
            Thank you, {customer.name}. Your order has been saved and sent via WhatsApp.
            We'll confirm shortly.
          </p>
          {savedOrder && (
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Order ID: {savedOrder.id}
            </p>
          )}
        </div>

        {/* Ordered items summary */}
        {orderedItems.length > 0 && (
          <div className="ordered-items-summary" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Your order</h3>
            {orderedItems.map((item) => {
              const basePrice = item.customDesign
                ? CUSTOM_PRICING[item.size]
                : item.product.pricing[item.size]
              const lineTotal = basePrice * item.quantity + (item.customDesign ? CUSTOM_SURCHARGE * item.quantity : 0)
              const img = getProductImage(item.product.id, item.color?.name)
              return (
                <div key={item.key} className="cart-item" style={{ marginBottom: '1rem' }}>
                  <div className="cart-item-visual" style={{ background: item.color.hex, width: '64px', height: '64px' }}>
                    {img ? (
                      <img src={img} alt={item.product.name} className="cart-item-img" />
                    ) : (
                      <div className="tee-body-sm" />
                    )}
                  </div>
                  <div className="cart-item-info">
                    <h3>{item.product.name}{item.customDesign && ' (Custom)'}</h3>
                    <p className="text-muted">
                      {item.color.name} · Size {item.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <div className="cart-item-total">&#8377;{lineTotal}</div>
                </div>
              )
            })}
            <div className="summary-total" style={{ marginTop: '1rem' }}>
              <span>Total</span>
              <span>&#8377;{total}</span>
            </div>
          </div>
        )}

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <Link to="/shop" className="btn btn-primary">Continue shopping</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container section text-center">
        <div className="empty-cart fade-in">
          <h1>Your cart is empty.</h1>
          <p className="text-muted">No rush. Take your time.</p>
          <Link to="/shop" className="btn btn-primary">Shop Tees</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <section className="section-sm">
        <div className="container">
          <h1>Your cart</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items">
              {items.map((item) => {
                const basePrice = item.customDesign
                  ? CUSTOM_PRICING[item.size]
                  : item.product.pricing[item.size]
                const lineTotal = basePrice * item.quantity + (item.customDesign ? CUSTOM_SURCHARGE * item.quantity : 0)

                return (
                  <div key={item.key} className="cart-item">
                    <div className="cart-item-visual" style={{ background: item.color.hex }}>
                      {getProductImage(item.product.id, item.color?.name) ? (
                        <img
                          src={getProductImage(item.product.id, item.color?.name)}
                          alt={item.product.name}
                          className="cart-item-img"
                        />
                      ) : (
                        <div className="tee-body-sm">
                          {item.product.fit === 'polo' && <div className="tee-collar"></div>}
                        </div>
                      )}
                      {item.customDesign && (
                        <div className={`tee-print-sm tee-print-${item.placement}`}>
                          <img src={item.customDesign.url} alt="Design" />
                        </div>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <h3>{item.product.name}{item.customDesign && ' (Custom)'}</h3>
                      <p className="text-muted">
                        {item.color.name} · Size {item.size}
                        {item.customDesign && ` · ${item.placement}`}
                      </p>
                      <p className="cart-item-unit">&#8377;{basePrice}{item.customDesign ? ' + \u20B950 custom' : ''}</p>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.key, item.quantity - 1)}>-</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.key, item.quantity + 1)}>+</button>
                    </div>
                    <div className="cart-item-total">&#8377;{lineTotal}</div>
                    <button className="cart-item-remove" onClick={() => removeItem(item.key)}>x</button>
                  </div>
                )
              })}
              <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear cart</button>
            </div>

            {/* Summary + Checkout */}
            <div className="cart-summary">
              <h3>Checkout</h3>

              {/* Customer details form */}
              <div className="checkout-form">
                <div className="form-group">
                  <label className="option-label">Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={customer.name}
                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="option-label">Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit phone number"
                    maxLength="10"
                    value={customer.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="form-group">
                  <label className="option-label">Delivery Address</label>
                  <textarea
                    placeholder="House no, street, area, city"
                    rows="3"
                    value={customer.address}
                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="option-label">Pincode</label>
                  <div className="pincode-row">
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="6-digit pincode"
                      value={customer.pincode}
                      onChange={(e) => handleCustomerChange('pincode', e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleCheckPincode}
                      disabled={checkingPincode || customer.pincode.length !== 6}
                    >
                      {checkingPincode ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                  {orderError && customer.pincode && (
                    <p className="zone-info zone-error fade-in">
                      {orderError}
                    </p>
                  )}
                  {shippingInfo && (
                    <div className="zone-info fade-in">
                      <p className="zone-info-line">
                        <strong>Shipping to {customer.pincode}</strong>
                      </p>
                      <p className="zone-info-line text-muted">
                        {shippingInfo.location?.district}, {shippingInfo.location?.state} · {shippingInfo.zoneLabel}
                      </p>
                      <p className="zone-info-line">
                        Shipping: {shippingInfo.isFreeShipping
                          ? <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>FREE</span>
                          : <span style={{ fontWeight: 600 }}>&#8377;{shippingInfo.shippingCost}</span>
                        }
                      </p>
                      {!shippingInfo.isFreeShipping && shippingInfo.remainingForFreeShipping > 0 && (
                        <p className="zone-info-line text-muted" style={{ fontSize: '0.75rem' }}>
                          Add &#8377;{shippingInfo.remainingForFreeShipping} more for free shipping
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order summary */}
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>&#8377;{totalSubtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {finalShipping === null || finalShipping === undefined
                      ? '—'
                      : isFreeShipping
                        ? 'Free'
                        : `\u20B9${finalShipping}`}
                  </span>
                </div>
                {totalSubtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="free-shipping-note text-muted">
                    Add &#8377;{FREE_SHIPPING_THRESHOLD - totalSubtotal} more for free shipping.
                  </p>
                )}
                {isFreeShipping && (
                  <p className="free-shipping-note">Free shipping unlocked.</p>
                )}
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>&#8377;{total || totalSubtotal}</span>
              </div>

              {orderError && (
                <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{orderError}</p>
              )}

              {/* Buy Now via WhatsApp */}
              <div className="buy-now-section">
                <p className="buy-now-label">
                  {formValid ? 'Choose a WhatsApp number to confirm your order:' : 'Fill in your details and check pincode to continue.'}
                </p>
                <button
                  className="btn btn-primary btn-full whatsapp-btn"
                  onClick={() => handleBuyNow(WHATSAPP_NUMBERS[0])}
                  disabled={!formValid || placing}
                >
                  {placing ? 'Saving order...' : 'Buy Now — WhatsApp (1)'}
                </button>
                <button
                  className="btn btn-outline btn-full whatsapp-btn"
                  onClick={() => handleBuyNow(WHATSAPP_NUMBERS[1])}
                  disabled={!formValid || placing}
                >
                  Buy Now — WhatsApp (2)
                </button>
              </div>

              <Link to="/shop" className="btn btn-ghost btn-full">Continue shopping</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
