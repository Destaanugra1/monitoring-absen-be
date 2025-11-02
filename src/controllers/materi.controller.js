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
    const items = await prisma.materi.findMany({ 
      where: { id_hari }, 
      orderBy: { waktu_mulai: 'asc' } 
    })
    
    // Convert DateTime back to HH:mm format for frontend
    const formattedItems = items.map(item => ({
      ...item,
      waktu_mulai: item.waktu_mulai.toTimeString().slice(0, 5), // "HH:mm"
      waktu_selesai: item.waktu_selesai.toTimeString().slice(0, 5), // "HH:mm"
      locked: false // You can add logic here to determine if materi is locked
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
      data: { locked: false, locked_at: null },
    })
    res.json({ message: 'Materi unlocked', materi: updated })
  } catch (e) { next(e) }
}

module.exports.unlockMateri = unlockMateri
