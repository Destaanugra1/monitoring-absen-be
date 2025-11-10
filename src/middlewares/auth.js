const { requireAuth, clerkClient } = require('@clerk/express')

function isPanitiaFromUser(user) {
  const role = user?.publicMetadata?.role || user?.privateMetadata?.role
  if (typeof role === 'string') return role.toLowerCase() === 'panitia'
  if (Array.isArray(role)) return role.map(r => String(r).toLowerCase()).includes('panitia')
  return false
}

function isAdminFromUser(user) {
  const role = user?.publicMetadata?.role || user?.privateMetadata?.role
  if (typeof role === 'string') return role.toLowerCase() === 'admin'
  if (Array.isArray(role)) return role.map(r => String(r).toLowerCase()).includes('admin')
  return false
}

// Ensure the request is authenticated (via Clerk) and the user has role Panitia
function requirePanitia() {
  const authMw = requireAuth()
  return async (req, res, next) => {
    // First ensure authenticated
    return authMw(req, res, async (authErr) => {
      if (authErr) return next(authErr)
      try {
        const auth = req.auth()
        const userId = auth?.userId
        if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
        const user = await clerkClient.users.getUser(userId)
        if (!isPanitiaFromUser(user)) {
          return res.status(403).json({ error: 'Forbidden: Panitia only' })
        }
        return next()
      } catch (e) {
        return next(e)
      }
    })
  }
}

// Ensure the request is authenticated (via Clerk) and the user has role Admin
function requireAdmin() {
  const authMw = requireAuth()
  return async (req, res, next) => {
    // First ensure authenticated
    return authMw(req, res, async (authErr) => {
      if (authErr) return next(authErr)
      try {
        const auth = req.auth()
        const userId = auth?.userId
        if (!userId) return res.status(401).json({ error: 'Unauthenticated' })
        const user = await clerkClient.users.getUser(userId)
        if (!isAdminFromUser(user)) {
          return res.status(403).json({ error: 'Forbidden: Admin only' })
        }
        return next()
      } catch (e) {
        return next(e)
      }
    })
  }
}

module.exports = { requirePanitia, requireAdmin }
