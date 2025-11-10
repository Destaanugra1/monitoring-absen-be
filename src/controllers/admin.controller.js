const { prisma } = require('../utils/prisma')
const { clerkClient } = require('@clerk/express')
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

async function getAllUsersForAdmin(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        image_url: true,
        last_sign_in_at: true,
        created_at: true,
        updated_at: true,
      },
    })
    
    // Get roles from Clerk for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        try {
          const clerkUser = await clerkClient.users.getUser(user.id)
          const role = clerkUser?.publicMetadata?.role || clerkUser?.privateMetadata?.role || 'user'
          return { ...user, role }
        } catch (error) {
          return { ...user, role: 'user' }
        }
      })
    )
    
    res.json(usersWithRoles)
  } catch (e) {
    next(e)
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params
    const { role } = req.body
    
    if (!role || !['admin', 'panitia', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, panitia, or user' })
    }
    
    // Update role in Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role }
    })
    
    res.json({ message: 'Role updated successfully', userId, role })
  } catch (e) {
    if (e.status === 404) {
      return res.status(404).json({ error: 'User not found' })
    }
    next(e)
  }
}

async function deleteBulkPeserta(req, res, next) {
  try {
    const { pesertaIds } = req.body
    
    if (!Array.isArray(pesertaIds) || pesertaIds.length === 0) {
      return res.status(400).json({ error: 'pesertaIds must be a non-empty array' })
    }
    
    // Delete keaktifan records first (due to foreign key constraints)
    await prisma.keaktifan.deleteMany({
      where: {
        id_peserta: { in: pesertaIds }
      }
    })
    
    // Delete peserta records
    const result = await prisma.peserta.deleteMany({
      where: {
        id: { in: pesertaIds }
      }
    })
    
    res.json({ 
      message: `Successfully deleted ${result.count} peserta`,
      deletedCount: result.count 
    })
  } catch (e) {
    next(e)
  }
}

async function deleteHari(req, res, next) {
  try {
    const { id } = req.params
    const hariId = parseInt(id)
    
    if (isNaN(hariId)) {
      return res.status(400).json({ error: 'Invalid hari ID' })
    }
    
    // Check if hari exists
    const hari = await prisma.hari.findUnique({
      where: { id: hariId },
      include: { 
        materi: {
          include: {
            keaktifan: true
          }
        }
      }
    })
    
    if (!hari) {
      return res.status(404).json({ error: 'Hari not found' })
    }
    
    // Delete will cascade to materi and keaktifan due to schema relations
    await prisma.hari.delete({
      where: { id: hariId }
    })
    
    res.json({ 
      message: 'Hari deleted successfully',
      deletedHari: hari.nama_hari 
    })
  } catch (e) {
    next(e)
  }
}

async function deleteMateri(req, res, next) {
  try {
    const { id } = req.params
    const materiId = parseInt(id)
    
    if (isNaN(materiId)) {
      return res.status(400).json({ error: 'Invalid materi ID' })
    }
    
    // Check if materi exists
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
      include: { keaktifan: true }
    })
    
    if (!materi) {
      return res.status(404).json({ error: 'Materi not found' })
    }
    
    // Delete will cascade to keaktifan due to schema relations
    await prisma.materi.delete({
      where: { id: materiId }
    })
    
    res.json({ 
      message: 'Materi deleted successfully',
      deletedMateri: materi.judul_materi 
    })
  } catch (e) {
    next(e)
  }
}

async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, totalPeserta, totalHari, totalMateri, totalKeaktifan] = await Promise.all([
      prisma.user.count(),
      prisma.peserta.count(),
      prisma.hari.count(),
      prisma.materi.count(),
      prisma.keaktifan.count()
    ])
    
    // Get recent activities
    const recentPeserta = await prisma.peserta.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    })
    
    const recentHari = await prisma.hari.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    })
    
    res.json({
      stats: {
        totalUsers,
        totalPeserta,
        totalHari,
        totalMateri,
        totalKeaktifan
      },
      recent: {
        peserta: recentPeserta,
        hari: recentHari
      }
    })
  } catch (e) {
    next(e)
  }
}

async function lockMateri(req, res, next) {
  try {
    const materiId = parseInt(req.params.id)
    if (isNaN(materiId)) return res.status(400).json({ error: 'Invalid materi ID' })

    const materi = await prisma.materi.update({
      where: { id: materiId },
      data: { locked: true, locked_at: new Date(), unlock_override: false },
      select: { id: true, judul_materi: true, locked: true, locked_at: true, unlock_override: true }
    })

    return res.json({ message: 'Materi locked', materi })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Materi not found' })
    next(e)
  }
}

async function unlockMateri(req, res, next) {
  try {
    const materiId = parseInt(req.params.id)
    if (isNaN(materiId)) return res.status(400).json({ error: 'Invalid materi ID' })

    const materi = await prisma.materi.update({
      where: { id: materiId },
      data: { locked: false, locked_at: null, unlock_override: true },
      select: { id: true, judul_materi: true, locked: true, locked_at: true, unlock_override: true }
    })

    return res.json({ message: 'Materi unlocked', materi })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Materi not found' })
    next(e)
  }
}

async function getAllMateri(req, res, next) {
  try {
    const items = await prisma.materi.findMany({
      orderBy: [
        { id_hari: 'asc' },
        { waktu_mulai: 'asc' }
      ],
      select: {
        id: true,
        id_hari: true,
        judul_materi: true,
        waktu_mulai: true,
        waktu_selesai: true,
        locked: true,
        locked_at: true,
        unlock_override: true,
      }
    })

    const formatted = items.map(i => ({
      ...i,
      waktu_mulai: formatHHmmJakarta(i.waktu_mulai),
      waktu_selesai: formatHHmmJakarta(i.waktu_selesai),
      locked: i.locked ?? false,
      unlock_override: i.unlock_override ?? false,
    }))

    return res.json(formatted)
  } catch (e) { next(e) }
}

module.exports = { 
  getAllUsersForAdmin, 
  updateUserRole, 
  deleteBulkPeserta, 
  deleteHari, 
  deleteMateri,
  getAdminStats,
  lockMateri,
  unlockMateri,
  getAllMateri
}