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

async function authedRequest(path, options = {}) {
  const token = localStorage.getItem('one-layer-admin-token')
  if (!token) throw new Error('Not authenticated')
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...options,
  })

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
  const result = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  localStorage.setItem('one-layer-admin-token', result.token)
  return result
}

// Admin — verify session
export async function adminVerify() {
  try {
    return await authedRequest('/api/admin/verify')
  } catch {
    localStorage.removeItem('one-layer-admin-token')
    return null
  }
}

// Admin — list orders (with optional filters)
export async function getOrders(params = {}) {
  const query = new URLSearchParams(params).toString()
  return authedRequest(`/api/orders${query ? `?${query}` : ''}`)
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
