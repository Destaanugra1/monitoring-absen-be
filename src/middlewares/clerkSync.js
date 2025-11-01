const { clerkMiddleware, clerkClient, getAuth } = require('@clerk/express')
const { prisma } = require('../utils/prisma')

// 1) Attach Clerk auth context to every request
const withAuth = clerkMiddleware()

// 2) Ensure the currently authenticated Clerk user exists in DB
async function syncClerkUser(req, res, next) {
  try {
    const auth = getAuth(req)
    if (!auth || !auth.userId) return next()

    // Fetch from Clerk
    const user = await clerkClient.users.getUser(auth.userId)

    // Derive primary email if available
    const primaryEmail = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: primaryEmail || null,
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        image_url: user.imageUrl || null,
        last_sign_in_at: user.lastSignInAt ? new Date(user.lastSignInAt) : null,
      },
      create: {
        id: user.id,
        email: primaryEmail || null,
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        image_url: user.imageUrl || null,
        last_sign_in_at: user.lastSignInAt ? new Date(user.lastSignInAt) : null,
      },
    })

    return next()
  } catch (err) {
    // Don't block request if sync fails; log and continue
    console.error('[clerkSync] Failed to sync user:', err?.message)
    return next()
  }
}

module.exports = { withAuth, syncClerkUser }
