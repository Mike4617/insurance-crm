
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method === 'GET') {
    const q = String(req.query.q ?? '').trim()
    const where: any = q ? { OR: [ { legal_name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { mobile: { contains: q } } ] } : {}
    const clients = await prisma.client.findMany({ where, include: { policies: true }, take: 50, orderBy: { created_at: 'desc' } })
    return res.status(200).json(clients)
  }
  if (req.method === 'POST') {
    const role = (session.user as any).role
    if (![1,2].includes(role)) return res.status(403).json({ error: 'Forbidden' })
    const { legal_name, type = 'person', phone, mobile, email } = req.body
    if (!legal_name) return res.status(400).json({ error: 'legal_name required' })
    const client = await prisma.client.create({ data: { legal_name, type, phone, mobile, email } })
    return res.status(201).json(client)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
