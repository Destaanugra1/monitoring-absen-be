const { Router } = require('express')
const { createMateri, getMateriByHari, deleteMateri, unlockMateri } = require('../controllers/materi.controller')
const { requirePanitia } = require('../middlewares/auth')

const router = Router()

router.post('/', requirePanitia(), createMateri)
router.get('/hari/:id_hari', getMateriByHari)
router.delete('/:id', requirePanitia(), deleteMateri)
router.post('/:id/unlock', requirePanitia(), unlockMateri)

module.exports = router
