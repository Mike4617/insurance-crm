
import useSWR from 'swr'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Renewals() {
  const { data } = useSWR('/api/renewals?within_days=90', fetcher)
  if (!data) return <div style={{ padding: 24 }}>Loading…</div>
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Renewals (Next 90 Days)</h1>
      <table>
        <thead><tr><th>Client</th><th>Policy #</th><th>LOB</th><th>Expiry</th><th>Premium</th></tr></thead>
        <tbody>
          {data.map((p: any) => (
            <tr key={p.id}>
              <td>{p.client.legal_name}</td>
              <td>{p.policy_number || '-'}</td>
              <td>{p.lob}</td>
              <td>{new Date(p.expiration_date).toLocaleDateString()}</td>
              <td>{p.premium_amount ?? '-'}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={5}>No upcoming renewals.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions as any)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}
