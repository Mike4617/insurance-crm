
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const within = parseInt(String(req.query.within_days ?? '60'), 10)
  const now = new Date()
  const end = new Date(Date.now() + within * 24 * 3600 * 1000)
  const policies = await prisma.policy.findMany({
    where: { status: { in: ['active','renewed'] }, expiration_date: { gte: now, lte: end } },
    include: { client: true },
    orderBy: { expiration_date: 'asc' }
  })
  return res.status(200).json(policies)
}
