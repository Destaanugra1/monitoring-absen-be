const { Router } = require('express')
const { 
  getAllUsersForAdmin, 
  updateUserRole, 
  deleteBulkPeserta, 
  deleteHari, 
  deleteMateri,
  getAdminStats,
  lockMateri,
  unlockMateri,
  getAllMateri
} = require('../controllers/admin.controller')
const { requireAdmin } = require('../middlewares/auth')

const router = Router()

// All routes require admin role
router.use(requireAdmin())

// Admin dashboard stats
router.get('/stats', getAdminStats)

// User management
router.get('/users', getAllUsersForAdmin)
router.put('/users/:userId/role', updateUserRole)

// Bulk operations
router.delete('/peserta/bulk', deleteBulkPeserta)

// Delete operations
router.delete('/hari/:id', deleteHari)
router.delete('/materi/:id', deleteMateri)

// Materi lock management
router.post('/materi/:id/lock', lockMateri)
router.post('/materi/:id/unlock', unlockMateri)

// List all materi (admin overview)
router.get('/materi', getAllMateri)

module.exports = router