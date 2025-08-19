
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials?.email } })
        if (!user) return null
        const valid = await compare(credentials!.password, user.password)
        if (!valid) return null
        return { id: String(user.id), name: user.name, email: user.email, role: user.roleId }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) { if (user) (token as any).role = (user as any).role; return token },
    async session({ session, token }) { if (session.user) (session.user as any).role = (token as any).role; return session }
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions as any)
