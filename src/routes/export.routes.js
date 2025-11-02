const { Router } = require('express')
const { exportHariExcel } = require('../controllers/export.controller')
const { requireAuth } = require('@clerk/express')

const router = Router()

router.get('/hari/:id_hari', requireAuth(), exportHariExcel)

module.exports = router
