import { Router } from 'express'

const router = Router()

// In-memory sample kit request store
const requests = []

// POST /api/sample-kit - request a sample kit
// Body: { company, contactName, email, address, pincode, colors }
router.post('/', (req, res) => {
  const { company, contactName, email, address, pincode } = req.body

  if (!company || !contactName || !email) {
    return res.status(400).json({ error: 'company, contactName, and email are required' })
  }

  const request = {
    id: `SK-${Date.now().toString(36).toUpperCase()}`,
    company,
    contactName,
    email,
    address: address || null,
    pincode: pincode || null,
    colors: req.body.colors || [],
    status: 'requested',
    createdAt: new Date().toISOString(),
  }

  requests.push(request)

  res.status(201).json({
    message: 'Sample kit requested. We will be in touch shortly.',
    request,
  })
})

// GET /api/sample-kit - list all requests
router.get('/', (req, res) => {
  res.json(requests)
})

export default router
