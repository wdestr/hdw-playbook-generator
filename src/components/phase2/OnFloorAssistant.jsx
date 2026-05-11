import { useState } from 'react'
import { loadIntake } from '../../lib/storage'

const TOOLS = [
  { id: 'sessionDebrief', icon: '🎤', label: 'Session Debrief', placeholder: 'Session title you just attended...' },
  { id: 'peopleLookup', icon: '🔍', label: 'People Lookup', placeholder: 'Name or company...' },
  { id: 'boothScan', icon: '🏢', label: 'Booth Scan', placeholder: 'Booth number or company name...' },
  { id: 'conflictResolver', icon: '⚡', label: 'Session Conflict', placeholder: 'Session A | Session B' },
]

export default function OnFloorAssistant({ onBack }) {
  const [activeTool, setActiveTool] = useState('sessionDebrief')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const tool = TOOLS.find(t => t.id === activeTool)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return

    const intake = loadIntake()
    if (!intake) {
      setError('No intake found. Please complete Phase 1 first.')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: '2', tool: activeTool, intake, query }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message === 'rate_limited'
        ? 'Getting a lot of requests right now — try again in a minute.'
        : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleToolSwitch(toolId) {
    setActiveTool(toolId)
    setQuery('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">⚡ On The Floor</h1>
          <p className="text-xs text-gray-500">HDW 2026 · Nashville</p>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
      </div>

      {/* Tool selector */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-gray-800 bg-gray-900/50">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => handleToolSwitch(t.id)}
            className={`whitespace-nowrap text-sm font-medium py-2 px-4 rounded-full transition-colors ${
              activeTool === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          {activeTool === 'conflictResolver' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Session A title"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs text-center">vs.</p>
              <input
                type="text"
                value={query.split('|')[1] || ''}
                onChange={e => setQuery(q => (q.split('|')[0] || '') + ' | ' + e.target.value)}
                placeholder="Session B title"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tool.placeholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-lg"
            />
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={`w-full font-semibold py-3 rounded-xl transition-colors ${
              loading || !query.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Looking up...' : `${tool.icon} ${tool.label}`}
          </button>
        </form>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">{error}</div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            {activeTool === 'sessionDebrief' && <SessionDebriefResult data={result} />}
            {activeTool === 'peopleLookup' && <PeopleLookupResult data={result} />}
            {activeTool === 'boothScan' && <BoothScanResult data={result} />}
            {activeTool === 'conflictResolver' && <ConflictResult data={result} />}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ children }) {
  return <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">{children}</div>
}
function Label({ children }) {
  return <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{children}</p>
}

function SessionDebriefResult({ data }) {
  return (
    <div className="space-y-4">
      <Card>
        <Label>Key Takeaways</Label>
        <ul className="space-y-2">
          {(data.takeaways || []).map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-200">
              <span className="text-blue-400 mt-0.5">•</span>{t}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <Label>Conversation Starters (use with others who attended)</Label>
        <ul className="space-y-2">
          {(data.conversationStarters || []).map((s, i) => (
            <li key={i} className="text-sm text-gray-200 italic">"{s}"</li>
          ))}
        </ul>
      </Card>
      {data.linkedInInsight && (
        <Card>
          <Label>LinkedIn Insight</Label>
          <p className="text-sm text-gray-200">{data.linkedInInsight}</p>
        </Card>
      )}
    </div>
  )
}

function PeopleLookupResult({ data }) {
  return (
    <div className="space-y-4">
      <Card>
        <p className="font-semibold text-white">{data.who}</p>
        {data.whatTheyDo && <p className="text-sm text-gray-300">{data.whatTheyDo}</p>}
      </Card>
      {data.whyAtHDW && (
        <Card>
          <Label>Why they're at HDW</Label>
          <p className="text-sm text-gray-200">{data.whyAtHDW}</p>
        </Card>
      )}
      {data.conversationAngle && (
        <Card>
          <Label>Conversation angle for you</Label>
          <p className="text-sm text-gray-200 italic">"{data.conversationAngle}"</p>
        </Card>
      )}
    </div>
  )
}

function BoothScanResult({ data }) {
  const tierColors = { '1': 'text-green-400', '2': 'text-yellow-400', '3': 'text-gray-400' }
  const tierLabels = { '1': 'Must Visit', '2': 'If Time', '3': 'Skip' }
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <Label>Tier</Label>
          <span className={`font-bold ${tierColors[data.tier] || 'text-gray-400'}`}>
            Tier {data.tier} — {tierLabels[data.tier]}
          </span>
        </div>
        {data.whatTheyDo && <p className="text-sm text-gray-200">{data.whatTheyDo}</p>}
        {data.tierReason && <p className="text-xs text-gray-400">{data.tierReason}</p>}
      </Card>
      {data.questionToAsk && (
        <Card>
          <Label>Question to ask</Label>
          <p className="text-sm text-white italic">"{data.questionToAsk}"</p>
        </Card>
      )}
    </div>
  )
}

function ConflictResult({ data }) {
  return (
    <div className="space-y-4">
      <Card>
        <Label>Recommendation</Label>
        <p className="text-2xl font-bold text-blue-400">Session {data.recommendation}</p>
        {data.reason && <p className="text-sm text-gray-200">{data.reason}</p>}
      </Card>
      {data.alternativeIfMissed && (
        <Card>
          <Label>If you miss the recommended session</Label>
          <p className="text-sm text-gray-200">{data.alternativeIfMissed}</p>
        </Card>
      )}
    </div>
  )
}
