import { useState, useEffect } from 'react'
import { adminLogin, adminVerify, getOrders, getOrderById, updateOrderStatus } from '../api/client.js'

const STATUSES = [
  'New — sent via WhatsApp',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
]

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Check if already logged in
  useEffect(() => {
    adminVerify()
      .then((r) => setAuthed(!!r))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError(null)
    try {
      await adminLogin(password)
      setAuthed(true)
      setPassword('')
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('one-layer-admin-token')
    setAuthed(false)
    setOrders([])
    setSelectedOrder(null)
  }

  // Fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const params = {}
      if (filter) params.status = filter
      if (search) params.search = search
      const result = await getOrders(params)
      setOrders(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (authed) fetchOrders()
  }, [authed, filter, search])

  const handleViewOrder = async (id) => {
    try {
      const order = await getOrderById(id)
      setSelectedOrder(order)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingStatus(true)
    try {
      const updated = await updateOrderStatus(id, newStatus)
      // Update in list
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
      if (selectedOrder?.id === id) {
        setSelectedOrder(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (checking) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="admin-login-page">
        <div className="container-narrow">
          <div className="admin-login-card">
            <p className="eyebrow">ONE LAYER</p>
            <h1>Admin Panel</h1>
            <p className="text-muted">Password protected. Not publicly linked.</p>
            <form onSubmit={handleLogin} className="admin-login-form">
              <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {loginError && <p className="admin-error">{loginError}</p>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loggingIn || !password}>
                {loggingIn ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <section className="section-sm admin-header">
        <div className="container">
          <div className="admin-header-row">
            <div>
              <p className="eyebrow">ONE LAYER</p>
              <h1>Orders</h1>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          {/* Filters */}
          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search by name, phone, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-status-filter">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={fetchOrders}>Refresh</button>
          </div>

          {/* Orders table */}
          {loadingOrders ? (
            <p className="text-muted">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="admin-empty">
              <p className="text-muted">No orders found.</p>
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-header">
                <span>Order ID</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Status</span>
                <span>Date</span>
                <span></span>
              </div>
              {orders.map((order) => (
                <div key={order.id} className="admin-table-row" onClick={() => handleViewOrder(order.id)}>
                  <span className="admin-order-id">{order.id}</span>
                  <span>
                    <div className="admin-customer-name">{order.customer?.name}</div>
                    <div className="admin-customer-phone text-muted">{order.customer?.phone}</div>
                  </span>
                  <span>{order.itemCount} items</span>
                  <span>&#8377;{order.total}</span>
                  <span>
                    <span className={`admin-status admin-status-${order.status.split(' ')[0].toLowerCase()}`}>
                      {order.status}
                    </span>
                  </span>
                  <span className="text-muted admin-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span>
                    <button className="btn btn-ghost btn-sm">View &rarr;</button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>{selectedOrder.id}</h2>
                <p className="text-muted">
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>

            <div className="admin-modal-body">
              {/* Customer */}
              <div className="admin-section">
                <h4>Customer</h4>
                <div className="admin-detail-row"><span>Name</span><span>{selectedOrder.customer?.name}</span></div>
                <div className="admin-detail-row"><span>Phone</span><span>{selectedOrder.customer?.phone}</span></div>
                <div className="admin-detail-row"><span>Address</span><span>{selectedOrder.customer?.address}</span></div>
                <div className="admin-detail-row"><span>Pincode</span><span>{selectedOrder.customer?.pincode}</span></div>
                {selectedOrder.location && (
                  <div className="admin-detail-row">
                    <span>Location</span>
                    <span>{selectedOrder.location.district}, {selectedOrder.location.state}</span>
                  </div>
                )}
                {selectedOrder.zone && (
                  <div className="admin-detail-row">
                    <span>Zone</span>
                    <span>{selectedOrder.zone}</span>
                  </div>
                )}
                {selectedOrder.whatsappNumber && (
                  <div className="admin-detail-row">
                    <span>WhatsApp</span>
                    <span>{selectedOrder.whatsappNumber}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="admin-section">
                <h4>Items</h4>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="admin-item-row">
                    <div>
                      <strong>{item.productName}</strong>
                      {item.customDesign && ' (Custom)'}
                      <br />
                      <span className="text-muted">
                        {item.color?.name} · Size {item.size} · Qty {item.quantity}
                        {item.placement && ` · ${item.placement}`}
                      </span>
                      {item.customDesign && (
                        <div className="admin-design-link">
                          <a href={item.customDesign.url} target="_blank" rel="noopener noreferrer">
                            View design: {item.customDesign.name} &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                    <span>&#8377;{item.lineTotal}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="admin-section">
                <div className="admin-detail-row"><span>Subtotal</span><span>&#8377;{selectedOrder.subtotal}</span></div>
                <div className="admin-detail-row">
                  <span>Shipping</span>
                  <span>&#8377;{selectedOrder.shippingCost}</span>
                </div>
                <div className="admin-detail-row admin-detail-total">
                  <span>Total</span><span>&#8377;{selectedOrder.total}</span>
                </div>
              </div>

              {/* Status update */}
              <div className="admin-section">
                <h4>Update Status</h4>
                <div className="admin-status-buttons">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`admin-status-btn ${selectedOrder.status === s ? 'active' : ''}`}
                      onClick={() => handleStatusUpdate(selectedOrder.id, s)}
                      disabled={updatingStatus || selectedOrder.status === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
