// ONE LAYER — API client
// In production, set VITE_API_URL to the backend Render URL (e.g. https://one-layer-api.onrender.com)
// In local dev, VITE_API_URL points to the local backend (http://localhost:5000)

import { WHATSAPP_NUMBERS } from '../data/products.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Re-export so existing imports from the API client keep working
export { WHATSAPP_NUMBERS }

async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// The admin access token is short-lived and kept in memory only. The long-lived
// refresh token lives in an HttpOnly cookie the browser never exposes to JS.
let adminAccessToken = null

async function refreshAdminSession() {
  const res = await fetch(`${API_URL}/api/admin/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    adminAccessToken = null
    return null
  }
  const data = await res.json()
  adminAccessToken = data.accessToken
  return data
}

async function authedRequest(path, options = {}, retry = true) {
  if (!adminAccessToken && retry) await refreshAdminSession()
  if (!adminAccessToken) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAccessToken}`,
      ...(options.headers || {}),
    },
  })

  if (res.status === 401 && retry) {
    adminAccessToken = null
    if (await refreshAdminSession()) return authedRequest(path, options, false)
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// Products
export async function getProducts() {
  return request('/api/products')
}

export async function getProductById(id) {
  return request(`/api/products/${id}`)
}

export async function getProductPrice(id, size, isCustom = false) {
  return request(`/api/products/${id}/price?size=${size}&custom=${isCustom}`)
}

// Shipping
export async function calculateShipping(pincode, itemCount, subtotal) {
  return request('/api/shipping/calculate', {
    method: 'POST',
    body: JSON.stringify({ pincode, itemCount, subtotal }),
  })
}

// Orders
export async function createOrder(orderData) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

// Quotes (B2B bulk)
export async function createQuote(quoteData) {
  return request('/api/quotes', {
    method: 'POST',
    body: JSON.stringify(quoteData),
  })
}

// Sample kit
export async function requestSampleKit(data) {
  return request('/api/sample-kit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Admin — login
export async function adminLogin(password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  const result = await res.json()
  adminAccessToken = result.accessToken
  return result
}

// Admin — restore a session from the refresh cookie (page reload)
export async function adminVerify() {
  try {
    if (!(await refreshAdminSession())) return null
    return await authedRequest('/api/admin/verify')
  } catch {
    return null
  }
}

// Admin — logout, revoking the refresh-token family server-side
export async function adminLogout() {
  adminAccessToken = null
  await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' }).catch(
    () => {}
  )
}

// Admin — list orders (with optional filters)
export async function getOrders(params = {}) {
  const query = new URLSearchParams(params).toString()
  const result = await authedRequest(`/api/orders${query ? `?${query}` : ''}`)
  return result.items
}

// Admin — get single order
export async function getOrderById(id) {
  return authedRequest(`/api/orders/${id}`)
}

// Admin — update order status
export async function updateOrderStatus(id, status) {
  return authedRequest(`/api/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// Build a WhatsApp deep link with the order message pre-filled
export function buildWhatsAppLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export { API_URL }
