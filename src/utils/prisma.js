const { PrismaClient } = require('@prisma/client')

// Singleton Prisma client to avoid exhausting connections (esp. on serverless like Vercel)
const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = { prisma }
