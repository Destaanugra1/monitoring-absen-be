const { prisma } = require('../utils/prisma')

async function createMateri(req, res, next) {
  try {
    const { id_hari, judul_materi, pemateri, waktu_mulai, waktu_selesai } = req.body
    if (!id_hari || !judul_materi || !waktu_mulai || !waktu_selesai) {
      return res.status(400).json({ error: 'id_hari, judul_materi, waktu_mulai, waktu_selesai are required' })
    }
    // Verify hari exists
    const hari = await prisma.hari.findUnique({ where: { id: Number(id_hari) } })
    if (!hari) return res.status(404).json({ error: 'Hari not found' })

    const materi = await prisma.materi.create({
      data: {
        id_hari: Number(id_hari),
        judul_materi,
        pemateri: pemateri || null,
        waktu_mulai: new Date(waktu_mulai),
        waktu_selesai: new Date(waktu_selesai),
      }
    })
    res.status(201).json(materi)
  } catch (e) { next(e) }
}

async function getMateriByHari(req, res, next) {
  try {
    const id_hari = Number(req.params.id_hari)
    const items = await prisma.materi.findMany({ where: { id_hari }, orderBy: { waktu_mulai: 'asc' } })
    res.json(items)
  } catch (e) { next(e) }
}

async function deleteMateri(req, res, next) {
  try {
    const id = Number(req.params.id)
    await prisma.materi.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) { next(e) }
}

module.exports = { createMateri, getMateriByHari, deleteMateri }

// Admin/Panitia unlock materi (manual override)
async function unlockMateri(req, res, next) {
  try {
    const id = Number(req.params.id)
    const updated = await prisma.materi.update({
      where: { id },
      data: { locked: false, locked_at: null },
    })
    res.json({ message: 'Materi unlocked', materi: updated })
  } catch (e) { next(e) }
}

module.exports.unlockMateri = unlockMateri
