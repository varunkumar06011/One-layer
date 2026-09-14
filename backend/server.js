import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import productsRouter from './routes/products.js'
import shippingRouter from './routes/shipping.js'
import ordersRouter from './routes/orders.js'
import quotesRouter from './routes/quotes.js'
import sampleKitRouter from './routes/sampleKit.js'
import adminRouter, { requireAuth } from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 5000

// CORS - allow configured origins
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(cors({
  origin: origins,
  credentials: true,
}))

// Body parser
app.use(express.json({ limit: '10mb' }))

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// Health check (for Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/products', productsRouter)
app.use('/api/shipping', shippingRouter)
app.use('/api/orders', ordersRouter) // POST is public (creates order), GET/PATCH protected inside
app.use('/api/quotes', quotesRouter)
app.use('/api/sample-kit', sampleKitRouter)
app.use('/api/admin', adminRouter)

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'ONE LAYER API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/products',
      'GET  /api/products/:id',
      'GET  /api/products/:id/price?size=&custom=',
      'POST /api/shipping/calculate',
      'POST /api/orders',
      'GET  /api/orders',
      'POST /api/quotes',
      'POST /api/sample-kit',
      'GET  /health',
    ],
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong' })
})

app.listen(PORT, () => {
  console.log(`ONE LAYER API running on port ${PORT}`)
  console.log(`CORS origins: ${origins.join(', ')}`)
})
