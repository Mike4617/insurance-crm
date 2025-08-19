
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/db'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'

const InteractionModal = dynamic(() => import('@/components/InteractionModal'), { ssr: false })
const SendSmsModal = dynamic(() => import('@/components/SendSmsModal'), { ssr: false })

function RoleGuard({ children, allow }: { children: any; allow: number[] }) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  if (!allow.includes(role)) return null
  return children
}

export default function ClientPage({ client }: any) {
  if (!client) return <div style={{ padding: 24 }}>Client not found.</div>
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{client.legal_name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RoleGuard allow={[1,2,3]}>
            <SendSmsModal clientId={client.id} />
          </RoleGuard>
          <RoleGuard allow={[1,2,3]}>
            <InteractionModal clientId={client.id} />
          </RoleGuard>
        </div>
      </div>
      <h3 style={{ fontWeight: 600, marginTop: 16 }}>Policies</h3>
      <table>
        <thead><tr><th>Policy #</th><th>LOB</th><th>Status</th><th>Effective</th><th>Expiration</th><th>Premium</th></tr></thead>
        <tbody>
          {client.policies.map((p: any) => (
            <tr key={p.id}>
              <td>{p.policy_number || '-'}</td><td>{p.lob}</td><td>{p.status}</td>
              <td>{new Date(p.effective_date).toLocaleDateString()}</td>
              <td>{new Date(p.expiration_date).toLocaleDateString()}</td>
              <td>{p.premium_amount ?? '-'}</td>
            </tr>
          ))}
          {client.policies.length === 0 && <tr><td colSpan={6}>No policies.</td></tr>}
        </tbody>
      </table>
      <h3 style={{ fontWeight: 600, marginTop: 16 }}>Open Tasks</h3>
      <ul>
        {client.tasks.map((t: any) => (
          <li key={t.id}>{t.title} — {t.due_at ? new Date(t.due_at).toLocaleDateString() : '-'}</li>
        ))}
        {client.tasks.length === 0 && <li>No open tasks.</li>}
      </ul>
      <h3 style={{ fontWeight: 600, marginTop: 16 }}>Recent Interactions</h3>
      <ul>
        {client.interactions.map((i: any) => (
          <li key={i.id}>
            <div style={{ color: '#666' }}>{i.type} • {new Date(i.created_at).toLocaleString()} • {i.channel || ''}</div>
            <div>{i.subject || '(no subject)'} — {i.outcome || ''} {i.duration_sec ? `• ${i.duration_sec}s` : ''}</div>
            {i.transcript && <div>{i.transcript}</div>}
            {i.body && <div>{i.body}</div>}
          </li>
        ))}
        {client.interactions.length === 0 && <li>No interactions yet.</li>}
      </ul>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions as any)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  const id = Number(ctx.params?.id)
  const client = await prisma.client.findUnique({
    where: { id },
    include: { policies: true, interactions: { orderBy: { created_at: 'desc' }, take: 10 }, tasks: { where: { status: 'open' }, orderBy: { due_at: 'asc' }, take: 10 } }
  })
  return { props: { client: JSON.parse(JSON.stringify(client)) } }
}
