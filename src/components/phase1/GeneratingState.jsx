import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const intake = loadIntake()
    if (!intake) { onError(); return }

    // Progress animation
    const msgInterval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 2000)

    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)

    // Actual API call
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
          onError()
        } else {
          onDone(data)
        }
      })
      .catch(() => {
        clearInterval(msgInterval)
        clearInterval(dotInterval)
        onError()
      })

    return () => {
      clearInterval(msgInterval)
      clearInterval(dotInterval)
    }
  }, [onDone, onError])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Spinner */}
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
