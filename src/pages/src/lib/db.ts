// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

// Reuse a single PrismaClient in dev to avoid connection exhaustion
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
