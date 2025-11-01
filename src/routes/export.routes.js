const { Router } = require('express')
const { exportHariExcel } = require('../controllers/upload.controller')
const { requirePanitia } = require('../middlewares/auth')

const router = Router()

router.get('/hari/:id_hari', requirePanitia(), exportHariExcel)

module.exports = router
