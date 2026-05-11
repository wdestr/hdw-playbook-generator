export default function Landing({ onGetStarted, onSelectPhase, phaseStatus }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="space-y-2">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
              Home Delivery World USA 2026 · Nashville · May 20–21
            </p>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Your Conference.<br />
              <span className="text-blue-400">Your Playbook.</span>
            </h1>
          </div>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            3 minutes. 8 modules. A fully personalized game plan for HDW 2026 —
            sessions, booths, networking targets, talking points, and follow-up templates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-colors"
            >
              Build My Playbook →
            </button>
            <button
              onClick={onSelectPhase}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-10 rounded-xl text-lg transition-colors"
            >
              All Tools
            </button>
          </div>

          <p className="text-gray-600 text-sm">No email. No login. Free.</p>
        </div>
      </div>

      {/* Phase cards */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <PhaseCard
            phase={1}
            icon="📋"
            title="Pre-Conference Playbook"
            description="Full personalized game plan — sessions, booths, networking, schedule, conversation starters"
            status={phaseStatus?.[1]}
            onClick={onGetStarted}
          />
          <PhaseCard
            phase={2}
            icon="⚡"
            title="On The Floor"
            description="Real-time session debrief, people lookup, booth scan, conflict resolver"
            status={phaseStatus?.[2]}
            unlockDate="May 20"
            onClick={onSelectPhase}
          />
          <PhaseCard
            phase={3}
            icon="✉️"
            title="Post-Conference"
            description="Follow-up email generator, LinkedIn recap, connections tracker"
            status={phaseStatus?.[3]}
            unlockDate="May 22"
            onClick={onSelectPhase}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
        Built by{' '}
        <a
          href="https://www.linkedin.com/in/wileystrahan/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400"
        >
          Wiley Strahan
        </a>
        {' '}· Practitioner-built, not conference-sponsored
      </div>
    </div>
  )
}

function PhaseCard({ phase, icon, title, description, status, unlockDate, onClick }) {
  const unlocked = status?.unlocked ?? phase === 1
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      className={`text-left rounded-xl p-6 border transition-all ${
        unlocked
          ? 'bg-gray-800 border-gray-700 hover:border-blue-600 hover:bg-gray-750 cursor-pointer'
          : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        {!unlocked && (
          <span className="text-xs text-gray-500 whitespace-nowrap">🔒 {unlockDate}</span>
        )}
      </div>
      <p className="text-gray-400 text-xs mt-2 leading-relaxed">{description}</p>
    </button>
  )
}
