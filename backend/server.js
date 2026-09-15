import 'dotenv/config'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './config/env.js'
import { errorHandler, notFoundHandler, requestId } from './middleware/errors.js'
import { generalLimiter } from './middleware/rateLimit.js'
import adminRouter from './routes/admin.js'
import ordersRouter from './routes/orders.js'
import productsRouter from './routes/products.js'
import quotesRouter from './routes/quotes.js'
import sampleKitRouter from './routes/sampleKit.js'
import shippingRouter from './routes/shipping.js'

const app = express()

// Behind Render/Vercel/Cloudflare: trust exactly one proxy hop so req.ip is the
// client address (rate limiting depends on it) without accepting spoofed chains.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(requestId)

app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
)

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin/server-to-server requests send no Origin header.
      if (!origin) return callback(null, true)
      callback(null, config.corsOrigins.includes(origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
)

// Uploads go to object storage via signed URLs, so JSON bodies stay small.
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())

app.use(morgan(config.isProduction ? 'combined' : 'dev'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', generalLimiter)
app.use('/api/products', productsRouter)
app.use('/api/shipping', shippingRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/quotes', quotesRouter)
app.use('/api/sample-kit', sampleKitRouter)
app.use('/api/admin', adminRouter)

app.get('/', (req, res) => {
  res.json({ name: 'ONE LAYER API', version: '1.0.0' })
})

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`ONE LAYER API running on port ${config.port} (${config.env})`)
  console.log(`CORS origins: ${config.corsOrigins.join(', ')}`)
})
