const { prisma } = require('../utils/prisma')

async function createHari(req, res, next) {
  try {
    const { nama_hari, tanggal } = req.body
    if (!nama_hari || !tanggal) return res.status(400).json({ error: 'nama_hari and tanggal are required' })
    const day = await prisma.hari.create({ data: { nama_hari, tanggal: new Date(tanggal) } })
    res.status(201).json(day)
  } catch (e) { next(e) }
}

async function getAllHari(req, res, next) {
  try {
    const days = await prisma.hari.findMany({ orderBy: { tanggal: 'asc' } })
    res.json(days)
  } catch (e) { next(e) }
}

async function deleteHari(req, res, next) {
  try {
    const id = Number(req.params.id)
    await prisma.hari.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) { next(e) }
}

module.exports = { createHari, getAllHari, deleteHari }
