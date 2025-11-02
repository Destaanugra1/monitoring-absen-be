const { Router } = require('express')
const { createMateri, getMateriByHari, deleteMateri, unlockMateri, updateMateri } = require('../controllers/materi.controller')
const { requireAuthDev } = require('../middlewares/authDev')

const router = Router()

router.post('/', requireAuthDev(), createMateri)
router.get('/hari/:id_hari', getMateriByHari)
router.delete('/:id', requireAuthDev(), deleteMateri)
router.post('/:id/unlock', requireAuthDev(), unlockMateri)
router.put('/:id', requireAuthDev(), updateMateri)

module.exports = router
