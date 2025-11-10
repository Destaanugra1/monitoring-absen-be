const { Router } = require('express')
const { clerkClient } = require('@clerk/express')

const router = Router()

// Temporary endpoint to set admin role - REMOVE IN PRODUCTION
router.post('/set-admin/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Set admin role in Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'admin' }
    })
    
    res.json({ 
      success: true, 
      message: `Successfully set admin role for user: ${userId}`,
      userId 
    })
  } catch (error) {
    console.error('Error setting admin role:', error)
    res.status(500).json({ 
      error: 'Failed to set admin role', 
      details: error.message 
    })
  }
})

// Get user metadata to check role
router.get('/check-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await clerkClient.users.getUser(userId)
    
    res.json({
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.publicMetadata?.role || 'user',
      publicMetadata: user.publicMetadata
    })
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({ 
      error: 'Failed to get user', 
      details: error.message 
    })
  }
})

module.exports = router