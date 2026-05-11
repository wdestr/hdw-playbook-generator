import { useState } from 'react'
import { usePhase } from './hooks/usePhase'
import { loadIntake, clearIntake } from './lib/storage'
import Landing from './components/Landing'
import PhaseSelector from './components/PhaseSelector'

// Lazy-loaded heavy components
import IntakeWizard from './components/phase1/IntakeWizard'
import GeneratingState from './components/phase1/GeneratingState'
import Playbook from './components/phase1/Playbook'
import OnFloorAssistant from './components/phase2/OnFloorAssistant'
import PostConference from './components/phase3/PostConference'

// view: 'landing' | 'phase-selector' | 'intake' | 'returning' | 'generating' | 'playbook' | 'phase2' | 'phase3'

export default function App() {
  const [view, setView] = useState('landing')
  const [playbook, setPlaybook] = useState(null)
  const { activePhase, selectPhase, phaseStatus } = usePhase()

  function handleGetStarted() {
    const existing = loadIntake()
    if (existing) {
      setView('returning')
    } else {
      setView('intake')
    }
  }

  function handlePhaseSelect(phase) {
    selectPhase(phase)
    if (phase === 1) {
      const existing = loadIntake()
      if (existing && playbook) {
        setView('playbook')
      } else if (existing) {
        setView('returning')
      } else {
        setView('intake')
      }
    } else if (phase === 2) {
      setView('phase2')
    } else if (phase === 3) {
      setView('phase3')
    }
  }

  function handleIntakeComplete(intake) {
    setView('generating')
    // intake is passed down, GeneratingState fetches and calls onDone
  }

  function handlePlaybookReady(playbookData) {
    setPlaybook(playbookData)
    setView('playbook')
  }

  function handleStartOver() {
    clearIntake()
    setPlaybook(null)
    setView('intake')
  }

  function handleRegenerate() {
    setView('generating')
  }

  function handleStartFresh() {
    clearIntake()
    setPlaybook(null)
    setView('intake')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {view === 'landing' && (
        <Landing
          onGetStarted={handleGetStarted}
          onSelectPhase={() => setView('phase-selector')}
          phaseStatus={phaseStatus}
        />
      )}

      {view === 'phase-selector' && (
        <PhaseSelector
          phaseStatus={phaseStatus}
          onSelect={handlePhaseSelect}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'returning' && (
        <ReturningUser
          onRegenerate={handleRegenerate}
          onStartFresh={handleStartFresh}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'intake' && (
        <IntakeWizard
          onComplete={handleIntakeComplete}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'generating' && (
        <GeneratingState
          onDone={handlePlaybookReady}
          onError={() => setView('intake')}
        />
      )}

      {view === 'playbook' && playbook && (
        <Playbook
          playbook={playbook}
          onStartOver={handleStartOver}
          onSwitchPhase={() => setView('phase-selector')}
        />
      )}

      {view === 'phase2' && (
        <OnFloorAssistant onBack={() => setView('phase-selector')} />
      )}

      {view === 'phase3' && (
        <PostConference onBack={() => setView('phase-selector')} />
      )}
    </div>
  )
}

function ReturningUser({ onRegenerate, onStartFresh, onBack }) {
  const intake = loadIntake()
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gray-900 rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back{intake?.name ? `, ${intake.name}` : ''}</h2>
          <p className="text-gray-400 mt-2">You have a saved playbook. What would you like to do?</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onRegenerate}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Regenerate my playbook
          </button>
          <button
            onClick={onStartFresh}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Start fresh with new intake
          </button>
          <button
            onClick={onBack}
            className="w-full text-gray-500 hover:text-gray-300 py-2 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
