
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { toE164, parseTwilioForm, validateTwilioSignature } from '@/lib/telephony'

export const config = { api: { bodyParser: false } }

async function findOrCreateClientByPhone(phoneRaw?: string): Promise<number> {
  const e164 = toE164(phoneRaw) || 'unknown'
  const existing = await prisma.client.findFirst({ where: { OR: [ { phone: e164 }, { mobile: e164 } ] } })
  if (existing) return existing.id
  const client = await prisma.client.create({ data: { type: 'person', legal_name: `Unknown Caller ${e164}`, phone: e164 } })
  return client.id
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const params = await parseTwilioForm(req)
  const headerSig = String(req.headers['x-twilio-signature'] || '')
  const publicUrl = process.env.TWILIO_PUBLIC_URL || ''
  const authToken = process.env.TWILIO_AUTH_TOKEN || ''
  const path = req.url?.split('?')[0] || '/api/twilio-sms'

  if (process.env.NODE_ENV === 'production') {
    const ok = validateTwilioSignature(publicUrl, path, params, authToken, headerSig)
    if (!ok) return res.status(401).json({ error: 'Invalid Twilio signature' })
  }

  const From = params['From'] || ''
  const Body = params['Body'] || ''

  const clientId = await findOrCreateClientByPhone(From)

  await prisma.interaction.create({
    data: { client_id: clientId, type: 'sms', direction: 'inbound', subject: 'Inbound SMS', body: Body, phone_number: toE164(From), channel: 'sms' }
  })

  return res.status(200).json({ ok: true })
}
