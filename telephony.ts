
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import crypto from 'crypto'
import type { NextApiRequest } from 'next'

export function toE164(raw?: string|null, defaultCountry: string = 'US'): string|undefined {
  if (!raw) return undefined
  const str = String(raw).trim()
  const parsed = parsePhoneNumberFromString(str, defaultCountry)
  if (parsed && parsed.isValid()) return parsed.number // E.164
  // Try treating as US 10-digit
  const digits = str.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return undefined
}

// Read raw body and parse x-www-form-urlencoded into an object
export async function parseTwilioForm(req: NextApiRequest): Promise<Record<string,string>> {
  const chunks: Buffer[] = []
  await new Promise<void>((resolve) => {
    req.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve())
  })
  const raw = Buffer.concat(chunks).toString('utf8')
  const params = new URLSearchParams(raw)
  const obj: Record<string,string> = {}
  params.forEach((v,k)=>{ obj[k] = v })
  return obj
}

/**
 * Validate Twilio signature per docs:
 * base = PUBLIC_URL + path + concatenated(sortedParamsByKey(key + value))
 * signature = Base64(HMAC-SHA1(authToken, base))
 */
export function validateTwilioSignature(publicUrl: string, path: string, params: Record<string,string>, authToken: string, headerSig: string): boolean {
  const url = `${publicUrl}${path}`
  const concatenated = Object.keys(params).sort().map(k => k + params[k]).join('')
  const base = url + concatenated
  const hmac = crypto.createHmac('sha1', authToken).update(Buffer.from(base, 'utf8')).digest('base64')
  try { return crypto.timingSafeEqual(Buffer.from(headerSig), Buffer.from(hmac)) } catch { return false }
}
