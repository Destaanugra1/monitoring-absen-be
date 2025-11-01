require('dotenv/config')
const express = require('express')
const { withAuth, syncClerkUser } = require('./src/middlewares/clerkSync')
const pesertaRoutes = require('./src/routes/peserta.routes')
const hariRoutes = require('./src/routes/hari.routes')
const materiRoutes = require('./src/routes/materi.routes')
const keaktifanRoutes = require('./src/routes/keaktifan.routes')
const exportRoutes = require('./src/routes/export.routes')
const { notFoundHandler, errorHandler } = require('./src/middlewares/errors')
const { prisma } = require('./src/utils/prisma')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

// Attach Clerk auth to all requests, then upsert the user in DB if logged in
app.use(withAuth, syncClerkUser)

app.get('/', (req, res) => {
  res.send('API is up')
})

// Mount API routes
app.use('/api/peserta', pesertaRoutes)
app.use('/api/hari', hariRoutes)
app.use('/api/materi', materiRoutes)
app.use('/api/keaktifan', keaktifanRoutes)
app.use('/api/export', exportRoutes)

// Optional: quick check to see the current Clerk user stored in DB
app.get('/me', async (req, res) => {
  try {
    const { auth } = req
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
