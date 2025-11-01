const { Router } = require('express')
const { upsertKeaktifan, getByMateri, rekapByHari } = require('../controllers/keaktifan.controller')
const { requirePanitia } = require('../middlewares/auth')

const router = Router()

router.post('/', requirePanitia(), upsertKeaktifan)
router.get('/materi/:id_materi', getByMateri)
router.get('/hari/:id_hari', rekapByHari)

module.exports = router
