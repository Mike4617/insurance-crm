
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function SendSmsModal({ clientId }: { clientId: number }) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canSend = role === 1 || role === 2 || role === 3

  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('Hello!')

  async function send() {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, message })
    })
    const data = await res.json()
    if (!res.ok) alert(data?.error || 'Failed to send')
    else { alert('SMS sent'); setOpen(false) }
  }

  if (!canSend) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded border">Send SMS</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-lg space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Send SMS</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <textarea className="border rounded px-2 py-1 w-full min-h-[120px]" value={message} onChange={e=>setMessage(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded border" onClick={send}>Send</button>
            </div>
            <p className="text-sm text-gray-600">Respects client Do-Not-Text flag.</p>
          </div>
        </div>
      )}
    </>
  )
}
