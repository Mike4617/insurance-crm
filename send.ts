
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { toE164 } from '@/lib/telephony'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import Twilio from 'twilio'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { client_id, message } = req.body
  if (!client_id || !message) return res.status(400).json({ error: 'client_id and message required' })

  const client = await prisma.client.findUnique({ where: { id: Number(client_id) } })
  if (!client) return res.status(404).json({ error: 'Client not found' })
  if (client.do_not_text) return res.status(403).json({ error: 'Client has opted out of texts' })

  const destRaw = client.mobile || client.phone
  const to = toE164(destRaw || '')
  if (!to) return res.status(400).json({ error: 'No valid phone number on client' })

  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const token = process.env.TWILIO_AUTH_TOKEN || ''
  if (!sid || !token) return res.status(500).json({ error: 'Twilio credentials missing' })

  const clientTwilio = Twilio(sid, token)
  const svc = process.env.TWILIO_MESSAGING_SERVICE_SID || ''
  const from = process.env.TWILIO_FROM_NUMBER || ''

  const payload: any = { to, body: message }
  if (svc) payload.messagingServiceSid = svc
  else {
    if (!from) return res.status(500).json({ error: 'Provide TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER' })
    payload.from = from
  }

  const msg = await clientTwilio.messages.create(payload)

  await prisma.interaction.create({
    data: {
      client_id: Number(client_id),
      type: 'sms',
      direction: 'outbound',
      subject: 'Outbound SMS',
      body: message,
      phone_number: to,
      channel: 'sms'
    }
  })

  return res.status(200).json({ sid: msg.sid })
}
