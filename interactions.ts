
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const b = req.body
  const interaction = await prisma.interaction.create({
    data: {
      client_id: b.client_id,
      policy_id: b.policy_id,
      type: b.type,
      direction: b.direction ?? 'n/a',
      subject: b.subject,
      body: b.body,
      outcome: b.outcome,
      call_started_at: b.call_started_at ? new Date(b.call_started_at) : undefined,
      duration_sec: b.duration_sec,
      phone_number: b.phone_number,
      recording_url: b.recording_url,
      transcript: b.transcript,
      channel: b.channel ?? (b.type === 'sms' ? 'sms' : b.type === 'call' ? 'voice' : 'other')
    }
  })
  return res.status(201).json(interaction)
}
