const { Router } = require('express')
const { createHari, getAllHari, deleteHari } = require('../controllers/hari.controller')
const { requirePanitia } = require('../middlewares/auth')

const router = Router()

router.post('/', requirePanitia(), createHari)
router.get('/', getAllHari)
router.delete('/:id', requirePanitia(), deleteHari)

module.exports = router
