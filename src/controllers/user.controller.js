const { prisma } = require('../utils/prisma')

async function getAllUsers(req, res, next) {
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
    res.json(users)
  } catch (e) {
    next(e)
  }
}

module.exports = { getAllUsers }
