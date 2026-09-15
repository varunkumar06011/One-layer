import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getProductImage } from '../data/productImages.js'
import { useProducts } from '../hooks/useProducts.js'

export default function Account() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { products } = useProducts()
  const navigate = useNavigate()
  const [section, setSection] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const [addresses, setAddresses] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [coupons, setCoupons] = useState([])
  const [reviews, setReviews] = useState([])
  const [notifSettings, setNotifSettings] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      email: profile?.email || user?.email || ''
    })
    loadAllData()
  }, [user, profile])

  const loadAllData = async () => {
    if (!user) return
    setLoading(true)
    const [addrRes, wishRes, coupRes, revRes, notifRes] = await Promise.all([
      supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notification_settings').select('*').eq('user_id', user.id).single()
    ])
    setAddresses(addrRes.data || [])
    setWishlist(wishRes.data || [])
    setCoupons(coupRes.data || [])
    setReviews(revRes.data || [])
    setNotifSettings(notifRes.data || { order_updates: true, offers: true, newsletter: false })
    setLoading(false)
  }

  const handleSaveProfile = async () => {
    await updateProfile({ name: formData.name, phone: formData.phone })
    setEditing(false)
  }

  const handleAddAddress = async () => {
    if (!user) return
    await supabase.from('addresses').insert({
      user_id: user.id,
      label: 'Home',
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: 'New address',
      pincode: '',
      city: '',
      state: '',
    })
    loadAllData()
  }

  const handleDeleteAddress = async (id) => {
    await supabase.from('addresses').delete().eq('id', id)
    loadAllData()
  }

  const handleRemoveWishlist = async (id) => {
    await supabase.from('wishlist').delete().eq('id', id)
    loadAllData()
  }

  const handleDeleteReview = async (id) => {
    await supabase.from('reviews').delete().eq('id', id)
    loadAllData()
  }

  const handleNotifChange = async (key, value) => {
    const updated = { ...notifSettings, [key]: value, updated_at: new Date().toISOString() }
    setNotifSettings(updated)
    await supabase.from('notification_settings').update(updated).eq('user_id', user.id)
  }

  const handleChangePassword = async () => {
    await supabase.auth.updateUser({ password: prompt('Enter new password (min 6 chars):') })
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.from('addresses').delete().eq('user_id', user.id)
    await supabase.from('wishlist').delete().eq('user_id', user.id)
    await supabase.from('reviews').delete().eq('user_id', user.id)
    await supabase.from('notification_settings').delete().eq('user_id', user.id)
    await signOut()
    navigate('/')
  }

  if (!user) return null

  const sections = [
    { id: 'profile', label: 'Profile', group: 'My Account' },
    { id: 'orders', label: 'All Orders', group: 'My Orders' },
    { id: 'track', label: 'Track Order', group: 'My Orders' },
    { id: 'returns', label: 'Returns & Refunds', group: 'My Orders' },
    { id: 'wishlist', label: 'Wishlist', group: 'My Saved Items' },
    { id: 'addresses', label: 'Manage Addresses', group: 'Saved Addresses' },
    { id: 'coupons', label: 'My Coupons', group: 'Coupons & Offers' },
    { id: 'reviews', label: 'My Reviews', group: 'Reviews' },
    { id: 'contact', label: 'Contact Us', group: 'Help & Support' },
    { id: 'faqs', label: 'FAQs', group: 'Help & Support' },
    { id: 'shipping-info', label: 'Shipping & Returns', group: 'Help & Support' },
    { id: 'notifications', label: 'Notifications', group: 'Account Settings' },
    { id: 'password', label: 'Change Password', group: 'Account Settings' },
    { id: 'delete', label: 'Delete Account', group: 'Account Settings' },
  ]

  const currentSection = sections.find((s) => s.id === section)

  return (
    <div className="account-page">
      <section className="section-sm">
        <div className="container">
          <h1>My Account</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="account-layout">
            {/* Sidebar */}
            <aside className="account-sidebar">
              <div className="account-user">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="account-avatar" />
                ) : (
                  <div className="account-avatar-placeholder">
                    {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="account-user-name">{profile?.name || 'User'}</p>
                  <p className="account-user-email text-muted">{user.email}</p>
                </div>
              </div>

              {Object.entries(
                sections.reduce((acc, s) => {
                  (acc[s.group] = acc[s.group] || []).push(s)
                  return acc
                }, {})
              ).map(([group, items]) => (
                <div key={group} className="account-nav-group">
                  <p className="account-nav-title">{group}</p>
                  {items.map((s) => (
                    <button
                      key={s.id}
                      className={`account-nav-link ${section === s.id ? 'active' : ''}`}
                      onClick={() => setSection(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              ))}

              <button className="account-nav-link account-logout" onClick={() => { signOut(); navigate('/') }}>
                Logout
              </button>
            </aside>

            {/* Content */}
            <div className="account-content">
              {loading && <p className="text-muted">Loading...</p>}

              {/* Profile */}
              {section === 'profile' && !loading && (
                <div className="account-section">
                  <h2>Profile</h2>
                  <div className="profile-form">
                    <div className="form-group">
                      <label className="option-label">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        disabled={!editing}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="option-label">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        disabled={!editing}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="option-label">Email</label>
                      <input type="email" value={formData.email} disabled />
                    </div>
                    <div className="profile-actions">
                      {editing ? (
                        <>
                          <button className="btn btn-primary" onClick={handleSaveProfile}>Save</button>
                          <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders */}
              {section === 'orders' && !loading && (
                <div className="account-section">
                  <h2>All Orders</h2>
                  <p className="text-muted">Your order history will appear here once you place an order via WhatsApp checkout.</p>
                  <Link to="/shop" className="btn btn-outline btn-sm">Start shopping</Link>
                </div>
              )}

              {/* Track Order */}
              {section === 'track' && !loading && (
                <div className="account-section">
                  <h2>Track Order</h2>
                  <p className="text-muted">Enter your order ID to track its status.</p>
                  <div className="form-group">
                    <input type="text" placeholder="Order ID (e.g. OL-XXXXX)" />
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Track</button>
                  </div>
                </div>
              )}

              {/* Returns & Refunds */}
              {section === 'returns' && !loading && (
                <div className="account-section">
                  <h2>Returns & Refunds</h2>
                  <p className="text-muted">We offer 7-day easy returns. Items must be unworn and unwashed.</p>
                  <div className="info-card">
                    <h4>Return Policy</h4>
                    <p>7 days from delivery. Refund processed within 5-7 business days.</p>
                  </div>
                  <div className="info-card">
                    <h4>How to return</h4>
                    <p>Contact us via WhatsApp with your order ID. We'll arrange a pickup.</p>
                  </div>
                </div>
              )}

              {/* Wishlist */}
              {section === 'wishlist' && !loading && (
                <div className="account-section">
                  <h2>Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <p className="text-muted">Your wishlist is empty. Save items you love to find them quickly later.</p>
                  ) : (
                    <div className="wishlist-grid">
                      {wishlist.map((item) => {
                        const product = products?.find((p) => p.id === item.product_id)
                        const img = getProductImage(item.product_id, item.color_name)
                        return (
                          <div key={item.id} className="wishlist-item">
                            <Link to={`/product/${item.product_id}`} className="wishlist-item-visual" style={{ background: '#f7f6f3' }}>
                              {img && <img src={img} alt={product?.name || 'Product'} className="wishlist-item-img" />}
                            </Link>
                            <div className="wishlist-item-info">
                              <h3>{product?.name || item.product_id}</h3>
                              <p className="text-muted">{item.color_name} · {item.size}</p>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveWishlist(item.id)}>Remove</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Addresses */}
              {section === 'addresses' && !loading && (
                <div className="account-section">
                  <h2>Saved Addresses</h2>
                  {addresses.length === 0 ? (
                    <p className="text-muted">No saved addresses yet.</p>
                  ) : (
                    <div className="address-list">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="address-card">
                          <div className="address-card-header">
                            <span className="address-label">{addr.label}</span>
                            {addr.is_default && <span className="address-default">Default</span>}
                          </div>
                          <p>{addr.name} · {addr.phone}</p>
                          <p className="text-muted">{addr.address}</p>
                          <p className="text-muted">{addr.city}, {addr.state} — {addr.pincode}</p>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={handleAddAddress}>Add address</button>
                </div>
              )}

              {/* Coupons */}
              {section === 'coupons' && !loading && (
                <div className="account-section">
                  <h2>My Coupons</h2>
                  {coupons.length === 0 ? (
                    <p className="text-muted">No coupons available right now. Check back during sales!</p>
                  ) : (
                    <div className="coupon-list">
                      {coupons.map((c) => (
                        <div key={c.id} className={`coupon-card ${c.used ? 'used' : ''}`}>
                          <div className="coupon-code">{c.code}</div>
                          <div className="coupon-discount">
                            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                          </div>
                          <div className="coupon-status">
                            {c.used ? 'Used' : c.expires_at ? `Expires ${new Date(c.expires_at).toLocaleDateString()}` : 'Available'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {section === 'reviews' && !loading && (
                <div className="account-section">
                  <h2>My Reviews</h2>
                  {reviews.length === 0 ? (
                    <p className="text-muted">You haven't written any reviews yet.</p>
                  ) : (
                    <div className="review-list">
                      {reviews.map((r) => {
                        const product = products?.find((p) => p.id === r.product_id)
                        return (
                          <div key={r.id} className="review-card">
                            <div className="review-header">
                              <h4>{product?.name || r.product_id}</h4>
                              <div className="review-stars">
                                {[1,2,3,4,5].map((n) => (
                                  <span key={n} className={n <= r.rating ? 'star filled' : 'star'}>★</span>
                                ))}
                              </div>
                            </div>
                            {r.title && <p className="review-title">{r.title}</p>}
                            <p className="text-muted">{r.body}</p>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Us */}
              {section === 'contact' && (
                <div className="account-section">
                  <h2>Contact Us</h2>
                  <div className="info-card">
                    <h4>WhatsApp</h4>
                    <p>9391798370 / 8317674764</p>
                  </div>
                  <div className="info-card">
                    <h4>Email</h4>
                    <p>hello@onelayer.in</p>
                  </div>
                  <div className="info-card">
                    <h4>Hours</h4>
                    <p>Mon - Sat, 10am - 7pm IST</p>
                  </div>
                </div>
              )}

              {/* FAQs */}
              {section === 'faqs' && (
                <div className="account-section">
                  <h2>FAQs</h2>
                  <div className="faq-item">
                    <h4>How long does delivery take?</h4>
                    <p className="text-muted">3-7 business days depending on your location.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Can I customize my tee?</h4>
                    <p className="text-muted">Yes! Visit the Customize page to upload your design.</p>
                  </div>
                  <div className="faq-item">
                    <h4>What is the return policy?</h4>
                    <p className="text-muted">7-day easy returns on unworn items.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Do you offer bulk orders?</h4>
                    <p className="text-muted">Yes, visit our For Companies page for team uniforms.</p>
                  </div>
                </div>
              )}

              {/* Shipping & Returns */}
              {section === 'shipping-info' && (
                <div className="account-section">
                  <h2>Shipping & Returns</h2>
                  <div className="info-card">
                    <h4>Shipping</h4>
                    <p>Calculated by pincode via India Post rates. Free shipping on orders above ₹999.</p>
                  </div>
                  <div className="info-card">
                    <h4>Returns</h4>
                    <p>7-day return window. Items must be unworn and unwashed with tags intact.</p>
                  </div>
                  <div className="info-card">
                    <h4>Refunds</h4>
                    <p>Processed within 5-7 business days to the original payment method.</p>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {section === 'notifications' && notifSettings && (
                <div className="account-section">
                  <h2>Notifications</h2>
                  <div className="notif-toggle">
                    <div>
                      <p>Order updates</p>
                      <p className="text-muted">Get notified about your order status</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.order_updates}
                      onChange={(e) => handleNotifChange('order_updates', e.target.checked)}
                    />
                  </div>
                  <div className="notif-toggle">
                    <div>
                      <p>Offers & promotions</p>
                      <p className="text-muted">Receive deals and sale alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.offers}
                      onChange={(e) => handleNotifChange('offers', e.target.checked)}
                    />
                  </div>
                  <div className="notif-toggle">
                    <div>
                      <p>Newsletter</p>
                      <p className="text-muted">Monthly updates from ONE LAYER</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.newsletter}
                      onChange={(e) => handleNotifChange('newsletter', e.target.checked)}
                    />
                  </div>
                </div>
              )}

              {/* Change Password */}
              {section === 'password' && (
                <div className="account-section">
                  <h2>Change Password</h2>
                  <p className="text-muted">Since you signed in with Google, you can set a password to also log in with email.</p>
                  <button className="btn btn-outline" onClick={handleChangePassword}>Set password</button>
                </div>
              )}

              {/* Delete Account */}
              {section === 'delete' && (
                <div className="account-section">
                  <h2>Delete Account</h2>
                  <p className="text-muted">This will permanently delete your account, profile, addresses, wishlist, and reviews. This action cannot be undone.</p>
                  <button className="btn btn-primary" style={{ background: '#c0392b' }} onClick={handleDeleteAccount}>
                    Delete my account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
