const { prisma } = require('../utils/prisma')

// Compute end-of-day (23:59:59.999) for the given Date in local server timezone
function endOfDayLocal(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Ensure materi is not locked; if past deadline, set locked and throw 423
async function ensureNotLockedAndMaybeLock(id_materi) {
  const materi = await prisma.materi.findUnique({
    where: { id: Number(id_materi) },
    include: { hari: true },
  })
  if (!materi) {
    const err = new Error('Materi not found')
    err.status = 404
    throw err
  }

  // If already locked, block
  if (materi.locked) {
    const err = new Error('Locked: input ditutup')
    err.status = 423 // Locked
    throw err
  }

  // Compare now to deadline (23:59 of the day)
  const deadline = endOfDayLocal(materi.hari.tanggal)
  const now = new Date()

  if (now > deadline) {
    // Auto-lock and block
    await prisma.materi.update({
      where: { id: materi.id },
      data: { locked: true, locked_at: new Date() },
    })
    const err = new Error('Locked: lewat batas waktu 23:59')
    err.status = 423
    throw err
  }

  return { materi, deadline }
}

module.exports = { ensureNotLockedAndMaybeLock, endOfDayLocal }
