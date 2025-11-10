require('dotenv/config')
const express = require('express')
const cors = require('cors')
const { withAuth, syncClerkUser } = require('./src/middlewares/clerkSync')
const pesertaRoutes = require('./src/routes/peserta.routes')
const hariRoutes = require('./src/routes/hari.routes')
const materiRoutes = require('./src/routes/materi.routes')
const keaktifanRoutes = require('./src/routes/keaktifan.routes')
const exportRoutes = require('./src/routes/export.routes')
const userRoutes = require('./src/routes/user.routes')
const adminRoutes = require('./src/routes/admin.routes')
const setupRoutes = require('./src/routes/setup.routes')
const { getAuth } = require('@clerk/express')
const { notFoundHandler, errorHandler } = require('./src/middlewares/errors')
const { prisma } = require('./src/utils/prisma')

const app = express()
const port = process.env.PORT || 5000

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both ports
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

// Attach Clerk auth to all requests, then upsert the user in DB if logged in
app.use(withAuth, syncClerkUser)

// Serve static test page
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))

// Expose safe runtime env to the browser (DO NOT expose secrets)
app.get('/env.js', (_req, res) => {
  const payload = {
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
    API_BASE: '',
  }
  res.type('application/javascript').send(`window.__ENV__ = ${JSON.stringify(payload)};`)
})

app.get('/', (req, res) => {
  res.send('API is up')
})

// Debug: inspect auth payload as seen by the server
app.get('/auth/debug', (req, res) => {
  const auth = getAuth(req)
  const hasAuthz = Boolean(req.headers?.authorization)
  return res.json({ auth, hasAuthorizationHeader: hasAuthz })
})

// Force-read current user from DB after sync middleware
app.post('/auth/sync', async (req, res) => {
  try {
    const auth = getAuth(req)
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthenticated' })
    const me = await prisma.user.findUnique({ where: { id: auth.userId } })
    return res.json({ synced: !!me, user: me })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to sync user' })
  }
})

// Mount API routes
app.use('/api/peserta', pesertaRoutes)
app.use('/api/hari', hariRoutes)
app.use('/api/materi', materiRoutes)
app.use('/api/keaktifan', keaktifanRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/setup', setupRoutes)

// Optional: quick check to see the current Clerk user stored in DB
app.get('/me', async (req, res) => {
  try {
    const auth = getAuth(req)
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthenticated' })
    const me = await prisma.user.findUnique({ where: { id: auth.userId } })
    return res.json(me)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load user' })
  }
})

// 404 + error
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
