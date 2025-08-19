
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const publicPaths = ['/login','/api/auth','/api/twilio-voice','/api/twilio-sms']
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
