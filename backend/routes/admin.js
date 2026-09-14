import { Router } from 'express'

const router = Router()

// Admin password — set via env var, default for dev
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'onelayer-admin'

// Simple session token store (in production, use JWT or a proper session)
const validTokens = new Set()

// POST /api/admin/login
// Body: { password }
router.post('/login', (req, res) => {
  const { password } = req.body
  if (!password) {
    return res.status(400).json({ error: 'Password is required' })
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  // Generate a simple token
  const token = `adm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  validTokens.add(token)
  res.json({ token })
})

// Middleware to check admin auth
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const token = auth.slice(7)
  if (!validTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  next()
}

// GET /api/admin/verify - verify token is still valid
router.get('/verify', requireAuth, (req, res) => {
  res.json({ valid: true })
})

export { router as default, requireAuth }
