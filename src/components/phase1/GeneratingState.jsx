import { useEffect, useState, useCallback } from 'react'
import { loadIntake } from '../../lib/storage'

const MESSAGES = [
  'Reading your intake...',
  'Scanning 93 sessions for your persona...',
  'Filtering exhibitors to what matters for you...',
  'Writing your conference brief...',
  'Building your priority session list...',
  'Drafting your honest skip list...',
  'Mapping booth strategy by tier...',
  'Identifying networking targets...',
  'Assembling your 2-day schedule...',
  'Crafting conversation starters...',
  'Writing your LinkedIn post draft...',
  'Almost done...',
]

export default function GeneratingState({ onDone, onError }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [dots, setDots] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const intake = loadIntake()
    if (!intake) {
      setErrorMsg('No intake found. Please go back and complete the form.')
      return
    }

    const msgInterval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 2000)

    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: '1', tool: 'playbook', intake }),
    })
      .then(r => r.json())
      .then(data => {
        clearInterval(msgInterval)
        clearInterval(dotInterval)
        if (data.error) {
          setErrorMsg(`API error: ${data.error}`)
        } else {
          onDone(data)
        }
      })
      .catch(err => {
        clearInterval(msgInterval)
        clearInterval(dotInterval)
        setErrorMsg(`Network error: ${err.message}`)
      })

    return () => {
      clearInterval(msgInterval)
      clearInterval(dotInterval)
    }
  }, []) // run once on mount only

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-4xl">⚠️</div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl p-3 font-mono">{errorMsg}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setErrorMsg(null); setMsgIndex(0); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Try again
            </button>
            <button
              onClick={onError}
              className="w-full text-gray-500 hover:text-gray-300 py-2 transition-colors text-sm"
            >
              ← Back to intake
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-full border-4 border-gray-700" />
          <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute inset-0" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Building your playbook{dots}</h2>
          <p className="text-gray-400 text-sm min-h-[20px]">{MESSAGES[msgIndex]}</p>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${((msgIndex + 1) / MESSAGES.length) * 100}%` }}
          />
        </div>

        <p className="text-gray-600 text-xs">Usually takes 15–25 seconds · Powered by Gemini</p>
      </div>
    </div>
  )
}
