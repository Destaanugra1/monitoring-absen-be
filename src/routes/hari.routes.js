const { Router } = require('express')
const { createHari, getAllHari, deleteHari } = require('../controllers/hari.controller')
const { requireAuthDev } = require('../middlewares/authDev')

const router = Router()

router.post('/', requireAuthDev(), createHari)
router.get('/', getAllHari)
router.delete('/:id', requireAuthDev(), deleteHari)

module.exports = router
