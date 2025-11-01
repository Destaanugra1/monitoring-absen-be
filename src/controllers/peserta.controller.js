const { prisma } = require('../utils/prisma')

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

module.exports = { getAllPeserta, getPesertaById, deletePeserta }
