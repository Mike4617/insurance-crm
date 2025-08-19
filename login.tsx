
import { signIn, signOut, useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { useState } from 'react'

export default function LoginPage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password123')
  if (session) {
    return (
      <div style={{ padding: 24 }}>
        <p>Signed in as {(session.user as any).email} (role {(session.user as any).role})</p>
        <a href="/">Home</a> • <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={() => signIn('credentials', { email, password, callbackUrl: '/' })}>Sign in</button>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions as any)
  if (session) return { redirect: { destination: '/', permanent: false } }
  return { props: {} }
}
