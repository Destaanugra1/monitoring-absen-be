const { prisma } = require('../utils/prisma')
const { normalizeName } = require('../services/validationService')

async function getAllPeserta(req, res, next) {
  try {
    const data = await prisma.peserta.findMany({ orderBy: { id: 'asc' } })
    res.json(data)
  } catch (e) { next(e) }
}

async function getPesertaById(req, res, next) {
  try {
    const id = Number(req.params.id)
    const data = await prisma.peserta.findUnique({ where: { id } })
    if (!data) return res.status(404).json({ error: 'Peserta not found' })
    res.json(data)
  } catch (e) { next(e) }
}

async function deletePeserta(req, res, next) {
  try {
    const id = Number(req.params.id)
    await prisma.peserta.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) { next(e) }
}

async function createPeserta(req, res, next) {
  try {
    const { nama } = req.body || {}
    const clean = String(nama || '').trim()
    if (!clean) return res.status(400).json({ error: 'Nama wajib diisi' })

    const targetNorm = normalizeName(clean)
    // Fetch existing names and compare in JS to ensure space/case insensitivity
    const existing = await prisma.peserta.findMany({ select: { id: true, nama: true } })
    const dup = existing.find(p => normalizeName(p.nama) === targetNorm)
    if (dup) {
      return res.status(409).json({ error: 'Peserta sudah ada', peserta: dup })
    }

    const created = await prisma.peserta.create({ data: { nama: clean } })
    return res.status(201).json(created)
  } catch (e) { next(e) }
}

module.exports = { getAllPeserta, getPesertaById, deletePeserta, createPeserta }
