import { useState } from 'react'
import { loadIntake } from '../../lib/storage'

const TABS = [
  { id: 'followUp', icon: '✉️', label: 'Follow-Up Email' },
  { id: 'linkedInRecap', icon: '🔗', label: 'LinkedIn Recap' },
  { id: 'connections', icon: '👥', label: 'Connections Tracker' },
]

export default function PostConference({ onBack }) {
  const [activeTab, setActiveTab] = useState('followUp')

  return (
    <div className="min-h-screen">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">✉️ Post-Conference</h1>
          <p className="text-xs text-gray-500">HDW 2026 Debrief</p>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
      </div>

      <div className="px-4 py-3 flex gap-2 border-b border-gray-800 bg-gray-900/50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap text-sm font-medium py-2 px-4 rounded-full transition-colors ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        {activeTab === 'followUp' && <FollowUpEmailTool />}
        {activeTab === 'linkedInRecap' && <LinkedInRecapTool />}
        {activeTab === 'connections' && <ConnectionsTracker />}
      </div>
    </div>
  )
}

function useAITool(tool) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit(query) {
    const intake = loadIntake()
    if (!intake) { setError('No intake found.'); return }
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: '3', tool, intake, query }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message === 'rate_limited' ? 'Too many requests — try again shortly.' : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, submit }
}

function FollowUpEmailTool() {
  const [form, setForm] = useState({ name: '', company: '', role: '', whatDiscussed: '', nextStep: '' })
  const { result, loading, error, submit } = useAITool('followUpEmail')

  function handleSubmit(e) {
    e.preventDefault()
    submit(JSON.stringify(form))
  }

  function copyEmail() {
    if (!result) return
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`)
      .then(() => alert('Copied!'))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Their name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Jane Smith" />
          <Input label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Acme Corp" />
        </div>
        <Input label="Their role" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} placeholder="VP of Logistics" />
        <Textarea label="What you talked about" value={form.whatDiscussed} onChange={v => setForm(f => ({ ...f, whatDiscussed: v }))} placeholder="We discussed their FADR challenges and how they're evaluating last-mile carriers..." rows={3} />
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Desired next step</label>
          <select
            value={form.nextStep}
            onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="demo">Schedule a demo</option>
            <option value="call">Set up a call</option>
            <option value="intro">Make an introduction</option>
            <option value="coffee">Grab coffee</option>
            <option value="no-ask">No ask yet — just staying in touch</option>
          </select>
        </div>
        <button type="submit" disabled={loading || !form.name || !form.whatDiscussed}
          className={`w-full font-semibold py-3 rounded-xl transition-colors ${!loading && form.name && form.whatDiscussed ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
          {loading ? 'Writing...' : '✉️ Generate Follow-Up Email'}
        </button>
      </form>

      {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl p-3">{error}</div>}

      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-medium text-white">Subject: {result.subject}</p>
            <button onClick={copyEmail} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">Copy</button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-200 whitespace-pre-line">{result.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function LinkedInRecapTool() {
  const [observations, setObservations] = useState(['', '', ''])
  const [honestTake, setHonestTake] = useState('')
  const { result, loading, error, submit } = useAITool('linkedInRecap')

  function handleSubmit(e) {
    e.preventDefault()
    const filled = observations.filter(o => o.trim())
    submit(JSON.stringify({ observations: filled, honestTake }))
  }

  function copyPost() {
    if (result?.post) navigator.clipboard.writeText(result.post).then(() => alert('Copied!'))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">3–5 things you saw, heard, or noticed at HDW</label>
          <div className="space-y-2">
            {observations.map((obs, i) => (
              <input key={i} type="text" value={obs}
                onChange={e => setObservations(prev => { const next = [...prev]; next[i] = e.target.value; return next })}
                placeholder={`Observation ${i + 1}...`}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
            ))}
            {observations.length < 5 && (
              <button type="button" onClick={() => setObservations(prev => [...prev, ''])}
                className="text-blue-400 hover:text-blue-300 text-sm">+ Add another observation</button>
            )}
          </div>
        </div>
        <Textarea label="Your honest take on the event" value={honestTake} onChange={setHonestTake}
          placeholder="What surprised you? What lived up to the hype? What was overrated? Be real." rows={3} />
        <button type="submit" disabled={loading || !observations.some(o => o.trim()) || !honestTake.trim()}
          className={`w-full font-semibold py-3 rounded-xl transition-colors ${!loading && observations.some(o => o.trim()) && honestTake.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
          {loading ? 'Writing...' : '🔗 Generate LinkedIn Recap'}
        </button>
      </form>

      {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl p-3">{error}</div>}

      {result?.post && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <p className="text-sm text-gray-400">Ready to post</p>
            <button onClick={copyPost} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">Copy</button>
          </div>
          <div className="p-4"><p className="text-sm text-gray-200 whitespace-pre-line">{result.post}</p></div>
        </div>
      )}
    </div>
  )
}

function ConnectionsTracker() {
  const [connections, setConnections] = useState([])
  const [form, setForm] = useState({ name: '', company: '', discussed: '', status: 'pending' })

  function addConnection(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setConnections(prev => [...prev, { ...form, id: Date.now() }])
    setForm({ name: '', company: '', discussed: '', status: 'pending' })
  }

  function updateStatus(id, status) {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  function removeConnection(id) {
    setConnections(prev => prev.filter(c => c.id !== id))
  }

  function exportCSV() {
    const rows = [['Name', 'Company', 'What Discussed', 'Follow-Up Status'], ...connections.map(c => [c.name, c.company, c.discussed, c.status])]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hdw-2026-connections.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const STATUS_OPTIONS = ['pending', 'emailed', 'meeting-scheduled', 'done', 'no-follow-up']

  return (
    <div className="space-y-6">
      <form onSubmit={addConnection} className="space-y-3 bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm font-medium text-white">Add a connection</p>
        <div className="grid grid-cols-2 gap-2">
          <Input label="" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Name" />
          <Input label="" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Company" />
        </div>
        <Input label="" value={form.discussed} onChange={v => setForm(f => ({ ...f, discussed: v }))} placeholder="What you discussed..." />
        <button type="submit" disabled={!form.name.trim()}
          className={`w-full text-sm font-medium py-2 rounded-xl transition-colors ${form.name.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
          + Add
        </button>
      </form>

      {connections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{connections.length} connection{connections.length !== 1 ? 's' : ''}</p>
            <button onClick={exportCSV} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">↓ Export CSV</button>
          </div>
          <div className="space-y-3">
            {connections.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-500">{c.company}</p>}
                    {c.discussed && <p className="text-xs text-gray-400 mt-1">{c.discussed}</p>}
                  </div>
                  <button onClick={() => removeConnection(c.id)} className="text-gray-600 hover:text-red-400 text-sm">✕</button>
                </div>
                <select
                  value={c.status}
                  onChange={e => updateStatus(c.id, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {connections.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-8">No connections yet. Add people you met at HDW.</p>
      )}
    </div>
  )
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-300 mb-1.5">{label}</label>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-300 mb-1.5">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm" />
    </div>
  )
}
