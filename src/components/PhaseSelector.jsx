export default function PhaseSelector({ phaseStatus, onSelect, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block">
            ← Back
          </button>
          <h2 className="text-3xl font-bold text-white">Choose Your Mode</h2>
          <p className="text-gray-400 mt-2">All three phases in one URL — unlocks as the conference progresses.</p>
        </div>

        <div className="grid gap-4">
          <PhaseSelectorCard
            phase={1}
            icon="📋"
            title="Pre-Conference Playbook"
            subtitle="Available now"
            description="Build your personalized 2-day game plan. Sessions, booths, networking targets, schedule, conversation starters, and a pre-conference LinkedIn post."
            unlocked={true}
            onSelect={() => onSelect(1)}
          />
          <PhaseSelectorCard
            phase={2}
            icon="⚡"
            title="On The Floor"
            subtitle="Unlocks May 20"
            description="Real-time tools for the conference floor. Session debrief, people lookup, booth scan, and session conflict resolver. Mobile-optimized."
            unlocked={phaseStatus?.[2]?.unlocked ?? false}
            onSelect={() => onSelect(2)}
          />
          <PhaseSelectorCard
            phase={3}
            icon="✉️"
            title="Post-Conference Debrief"
            subtitle="Unlocks May 22"
            description="Follow-up email generator, LinkedIn recap post, and a connections tracker with CSV export."
            unlocked={phaseStatus?.[3]?.unlocked ?? false}
            onSelect={() => onSelect(3)}
          />
        </div>
      </div>
    </div>
  )
}

function PhaseSelectorCard({ phase, icon, title, subtitle, description, unlocked, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`text-left rounded-2xl p-6 border transition-all w-full ${
        unlocked
          ? 'bg-gray-900 border-gray-700 hover:border-blue-500 hover:bg-gray-800 cursor-pointer'
          : 'bg-gray-900/40 border-gray-800 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className={`text-xs font-medium whitespace-nowrap ${unlocked ? 'text-green-400' : 'text-gray-500'}`}>
              {unlocked ? '✓ Available' : `🔒 ${subtitle}`}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}
