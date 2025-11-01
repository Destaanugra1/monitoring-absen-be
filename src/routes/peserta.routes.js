const { Router } = require('express')
const { getAllPeserta, getPesertaById, deletePeserta } = require('../controllers/peserta.controller')
const { uploadPesertaExcel } = require('../controllers/upload.controller')
const { requirePanitia } = require('../middlewares/auth')
const { uploadSingle } = require('../middlewares/upload')

const router = Router()

router.post('/upload', requirePanitia(), uploadSingle('file'), uploadPesertaExcel)
router.get('/', getAllPeserta)
router.get('/:id', getPesertaById)
router.delete('/:id', requirePanitia(), deletePeserta)

module.exports = router
