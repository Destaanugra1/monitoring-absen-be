const { Router } = require('express')
const { upsertKeaktifan, getByMateri, rekapByHari } = require('../controllers/keaktifan.controller')
const { requireAuthDev } = require('../middlewares/authDev')

const router = Router()

router.post('/', requireAuthDev(), upsertKeaktifan)
router.get('/materi/:id_materi', getByMateri)
router.get('/hari/:id_hari', rekapByHari)

module.exports = router
