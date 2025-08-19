
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/db'
import { toE164, parseTwilioForm, validateTwilioSignature } from '@/lib/telephony'

export const config = { api: { bodyParser: false } } // we need the raw body

async function findClientIdByPhone(phoneRaw?: string): Promise<number|undefined> {
  const e164 = toE164(phoneRaw)
  if (!e164) return undefined
  const c = await prisma.client.findFirst({ where: { OR: [ { phone: e164 }, { mobile: e164 } ] } })
  return c?.id
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const params = await parseTwilioForm(req)
  const headerSig = String(req.headers['x-twilio-signature'] || '')
  const publicUrl = process.env.TWILIO_PUBLIC_URL || ''
  const authToken = process.env.TWILIO_AUTH_TOKEN || ''
  const path = req.url?.split('?')[0] || '/api/twilio-voice'

  if (process.env.NODE_ENV === 'production') {
    const ok = validateTwilioSignature(publicUrl, path, params, authToken, headerSig)
    if (!ok) return res.status(401).json({ error: 'Invalid Twilio signature' })
  }

  const CallStatus = params['CallStatus'] || ''
  const From = params['From'] || ''
  const RecordingUrl = params['RecordingUrl'] || ''

  let clientId = await findClientIdByPhone(From)
  if (!clientId) clientId = Number(process.env.DEMO_CLIENT_ID ?? 1)

  if (CallStatus === 'in-progress') {
    await prisma.interaction.create({
      data: { client_id: clientId, type: 'call', direction: 'inbound', phone_number: toE164(From), call_started_at: new Date(), subject: 'Inbound call (Twilio)', channel: 'voice' }
    })
  } else if (CallStatus === 'completed') {
    await prisma.interaction.create({
      data: { client_id: clientId, type: 'call', direction: 'inbound', phone_number: toE164(From), recording_url: RecordingUrl, subject: 'Call completed (Twilio)', outcome: 'Completed', channel: 'voice' }
    })
  }

  return res.status(200).json({ ok: true })
}
