const { prisma } = require('../utils/prisma')
const { ensureNotLockedAndMaybeLock } = require('../services/keaktifanService')

async function upsertKeaktifan(req, res, next) {
  try {
    const { id_peserta, id_materi, status } = req.body
    if (!id_peserta || !id_materi || !status) return res.status(400).json({ error: 'id_peserta, id_materi, status are required' })

    // Enforce auto-lock 23:59 (and persist lock when passed)
    await ensureNotLockedAndMaybeLock(id_materi)

    // Upsert by composite unique (id_peserta, id_materi)
    const result = await prisma.keaktifan.upsert({
      where: { id_peserta_id_materi: { id_peserta: Number(id_peserta), id_materi: Number(id_materi) } },
      update: { status, timestamp: new Date() },
      create: { id_peserta: Number(id_peserta), id_materi: Number(id_materi), status },
    })
    res.status(201).json(result)
  } catch (e) { next(e) }
}

async function getByMateri(req, res, next) {
  try {
    const id_materi = Number(req.params.id_materi)
    const rows = await prisma.keaktifan.findMany({
      where: { id_materi },
      include: { peserta: true },
      orderBy: { id: 'asc' }
    })
    res.json(rows)
  } catch (e) { next(e) }
}

async function rekapByHari(req, res, next) {
  try {
    const id_hari = Number(req.params.id_hari)
    const materiList = await prisma.materi.findMany({ where: { id_hari }, orderBy: { waktu_mulai: 'asc' } })
    const materiIds = materiList.map(m => m.id)
    const keaktifan = await prisma.keaktifan.groupBy({
      by: ['id_materi', 'status'],
      where: { id_materi: { in: materiIds } },
      _count: { _all: true }
    })
    const map = {}
    for (const m of materiList) map[m.id] = { materi: m, counts: { HIJAU: 0, KUNING: 0, MERAH: 0 } }
    for (const row of keaktifan) {
      const { id_materi, status, _count } = row
      if (map[id_materi]) map[id_materi].counts[status] = _count._all
    }
    res.json(Object.values(map))
  } catch (e) { next(e) }
}

module.exports = { upsertKeaktifan, getByMateri, rekapByHari }
