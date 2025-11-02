const { Router } = require('express')
const { getAllPeserta, getPesertaById, deletePeserta } = require('../controllers/peserta.controller')
const { uploadPesertaExcel } = require('../controllers/upload.controller')
const { requireAuthDev } = require('../middlewares/authDev')  // Use simpler auth for dev
const { uploadSingle } = require('../middlewares/upload')

const router = Router()

router.post('/upload', requireAuthDev(), uploadSingle('file'), uploadPesertaExcel)
router.get('/', getAllPeserta)
router.get('/:id', getPesertaById)
router.delete('/:id', requireAuthDev(), deletePeserta)

module.exports = router
