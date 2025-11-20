const { prisma } = require('../utils/prisma')

function formatHHmmJakarta(date) {
  const dtf = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(date)
  const h = parts.find(p => p.type === 'hour')?.value || '00'
  const m = parts.find(p => p.type === 'minute')?.value || '00'
  return `${h}:${m}`
}

async function createMateri(req, res, next) {
  try {
    const { id_hari, judul_materi, pemateri, waktu_mulai, waktu_selesai, kelas } = req.body
    if (!id_hari || !judul_materi || !waktu_mulai || !waktu_selesai) {
      return res.status(400).json({ error: 'id_hari, judul_materi, waktu_mulai, waktu_selesai are required' })
    }
    
    const kelasValue = kelas || 'A'
    if (!['A', 'B', 'C'].includes(kelasValue)) {
      return res.status(400).json({ error: 'Kelas harus A, B, atau C' })
    }
    
    // Verify hari exists
    const hari = await prisma.hari.findUnique({ where: { id: Number(id_hari) } })
    if (!hari) return res.status(404).json({ error: 'Hari not found' })

    // Convert time format "HH:mm" to DateTime
    // Using hari.tanggal as the date and combining with time
    const hariDate = new Date(hari.tanggal)
    const [startHour, startMinute] = waktu_mulai.split(':').map(Number)
    const [endHour, endMinute] = waktu_selesai.split(':').map(Number)
    
    const waktuMulai = new Date(hariDate)
    waktuMulai.setHours(startHour, startMinute, 0, 0)
    
    const waktuSelesai = new Date(hariDate)
    waktuSelesai.setHours(endHour, endMinute, 0, 0)

    const materi = await prisma.materi.create({
      data: {
        id_hari: Number(id_hari),
        judul_materi,
        pemateri: pemateri || null,
        kelas: kelasValue,
        waktu_mulai: waktuMulai,
        waktu_selesai: waktuSelesai,
      }
    })
    res.status(201).json(materi)
  } catch (e) { next(e) }
}

async function getMateriByHari(req, res, next) {
  try {
    const id_hari = Number(req.params.id_hari)
    const kelas = req.query.kelas // Optional filter
    
    const where = { id_hari }
    if (kelas && ['A', 'B', 'C'].includes(kelas)) {
      where.kelas = kelas
    }
    
    const items = await prisma.materi.findMany({ 
      where, 
      orderBy: { waktu_mulai: 'asc' } 
    })
    
    // Convert DateTime back to HH:mm format for frontend
    const formattedItems = items.map(item => ({
      ...item,
      waktu_mulai: formatHHmmJakarta(item.waktu_mulai),
      waktu_selesai: formatHHmmJakarta(item.waktu_selesai),
      locked: item.locked ?? false,
    }))
    
    res.json(formattedItems)
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
      data: { locked: false, locked_at: null, unlock_override: true },
    })
    res.json({ message: 'Materi unlocked', materi: updated })
  } catch (e) { next(e) }
}

module.exports.unlockMateri = unlockMateri

// Update materi
async function updateMateri(req, res, next) {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.materi.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Materi not found' })

    const { judul_materi, pemateri, waktu_mulai, waktu_selesai, kelas } = req.body || {}
    const data = {}

    if (typeof judul_materi === 'string') data.judul_materi = judul_materi
    if (typeof pemateri !== 'undefined') data.pemateri = pemateri || null
    if (kelas && ['A', 'B', 'C'].includes(kelas)) data.kelas = kelas

    // If time strings provided, combine with parent hari date
    if (typeof waktu_mulai === 'string' || typeof waktu_selesai === 'string') {
      const hari = await prisma.hari.findUnique({ where: { id: existing.id_hari } })
      if (!hari) return res.status(404).json({ error: 'Hari not found' })
      const hariDate = new Date(hari.tanggal)
      if (typeof waktu_mulai === 'string') {
        const [h, m] = waktu_mulai.split(':').map(Number)
        const d = new Date(hariDate)
        d.setHours(h || 0, m || 0, 0, 0)
        data.waktu_mulai = d
      }
      if (typeof waktu_selesai === 'string') {
        const [h, m] = waktu_selesai.split(':').map(Number)
        const d = new Date(hariDate)
        d.setHours(h || 0, m || 0, 0, 0)
        data.waktu_selesai = d
      }
    }

    const updated = await prisma.materi.update({ where: { id }, data })
    return res.json(updated)
  } catch (e) { next(e) }
}

module.exports.updateMateri = updateMateri
