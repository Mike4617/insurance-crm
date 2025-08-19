
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Insurance CRM</h1>
      <ul style={{ lineHeight: 1.8 }}>
        <li><Link href="/renewals">Renewals Watchlist</Link></li>
        <li><Link href="/client/1">Sample Client 360</Link></li>
      </ul>
      <div style={{ marginTop: 12, color: '#666' }}>You are role: {String(role)}</div>
      <p style={{ marginTop: 12 }}><a href="/login">Log out / Switch user</a></p>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions as any)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}
