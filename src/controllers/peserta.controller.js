const { prisma } = require('../utils/prisma')
const { normalizeName } = require('../services/validationService')

async function getAllPeserta(req, res, next) {
  try {
    const kelas = req.query.kelas // Optional filter
    const where = {}
    if (kelas && ['A', 'B', 'C'].includes(kelas)) {
      where.kelas = kelas
    }
    const data = await prisma.peserta.findMany({ where, orderBy: { id: 'asc' } })
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
    const { nama, kelas } = req.body || {}
    const clean = String(nama || '').trim()
    if (!clean) return res.status(400).json({ error: 'Nama wajib diisi' })
    
    const kelasValue = kelas || 'A'
    if (!['A', 'B', 'C'].includes(kelasValue)) {
      return res.status(400).json({ error: 'Kelas harus A, B, atau C' })
    }

    const targetNorm = normalizeName(clean)
    // Fetch existing names in the same kelas and compare in JS to ensure space/case insensitivity
    const existing = await prisma.peserta.findMany({ 
      where: { kelas: kelasValue },
      select: { id: true, nama: true, kelas: true } 
    })
    const dup = existing.find(p => normalizeName(p.nama) === targetNorm)
    if (dup) {
      return res.status(409).json({ error: 'Peserta sudah ada di kelas ini', peserta: dup })
    }

    const created = await prisma.peserta.create({ data: { nama: clean, kelas: kelasValue } })
    return res.status(201).json(created)
  } catch (e) { next(e) }
}

module.exports = { getAllPeserta, getPesertaById, deletePeserta, createPeserta }
