
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function InteractionModal({ clientId }: { clientId: number }) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canLog = role === 1 || role === 2 || role === 3

  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [outcome, setOutcome] = useState('Connected')
  const [direction, setDirection] = useState('outbound')
  const [type, setType] = useState<'call'|'sms'|'email'|'note'>('call')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')
  const [duration, setDuration] = useState(0)

  async function save() {
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        type,
        direction,
        subject,
        outcome,
        phone_number: phone,
        duration_sec: duration,
        transcript: type === 'call' ? notes : undefined,
        body: type === 'sms' || type === 'email' ? notes : undefined
      })
    })
    if (!res.ok) alert('Failed to save'); else setOpen(false)
    location.reload()
  }

  if (!canLog) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded border">Log Interaction</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-lg space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Log Interaction</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <label className="text-sm">Type</label>
            <select className="border rounded px-2 py-1 w-full" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="call">Call</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
            </select>
            <input className="border rounded px-2 py-1 w-full" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1 w-full" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
              <input className="border rounded px-2 py-1 w-full" type="number" placeholder="Duration (sec)" value={duration} onChange={e=>setDuration(parseInt(e.target.value||'0'))} />
            </div>
            <label className="text-sm">Direction</label>
            <select className="border rounded px-2 py-1 w-full" value={direction} onChange={e=>setDirection(e.target.value)}>
              {['inbound','outbound','n/a'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="text-sm">Outcome</label>
            <select className="border rounded px-2 py-1 w-full" value={outcome} onChange={e=>setOutcome(e.target.value)}>
              {['Connected','Left VM','No Answer','Transferred','Escalated','Issue Resolved','Quote Sent','Bound','Lost'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" placeholder={type==='call' ? 'Call notes / transcript' : (type==='sms' ? 'SMS message' : 'Notes')} value={notes} onChange={e=>setNotes(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded border" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
