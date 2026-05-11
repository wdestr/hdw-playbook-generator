import { useState } from 'react'
import { saveIntake } from '../../lib/storage'
import { detectPersona, PERSONA_LABELS, PERSONAS } from '../../lib/personas'

const GOALS = [
  { id: 'find-tech', label: 'Find a technology solution' },
  { id: 'meet-carriers', label: 'Meet carrier / hauler partners' },
  { id: 'meet-shippers', label: 'Meet retail / shipper prospects' },
  { id: 'competitive-intel', label: 'Competitive intelligence' },
  { id: 'personal-brand', label: 'Build personal brand / visibility' },
  { id: 'validate', label: 'Validate a problem or hypothesis' },
  { id: 'hire', label: 'Hire or be hired' },
  { id: 'investor-meetings', label: 'Investor meetings' },
]

const PAIN_POINTS = [
  { id: 'cost', label: 'Cost' },
  { id: 'fadr', label: 'Failed delivery rate (FADR)' },
  { id: 'carrier-capacity', label: 'Carrier capacity' },
  { id: 'damage', label: 'Damage rates' },
  { id: 'cx', label: 'Customer experience' },
  { id: 'technology', label: 'Technology gaps' },
  { id: 'compliance', label: 'Compliance / regulation' },
  { id: 'other', label: 'Other' },
]

const SEGMENTS = ['Parcel', 'Big & Bulky', 'Grocery / Fresh', 'Furniture', 'Appliances', 'Other']
const VOLUME_RANGES = ['Under 1,000/mo', '1K–10K/mo', '10K–100K/mo', '100K–500K/mo', '500K+/mo']

export default function IntakeWizard({ onComplete, onBack }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    company: '',
    role: '',
    persona: '',
    oneProblem: '',
    goals: [],
    volumeRange: '',
    segment: '',
    painPoints: [],
    avoidTypes: '',
    linkedin: '',
  })

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleGoal(id) {
    setForm(prev => {
      const goals = prev.goals.includes(id)
        ? prev.goals.filter(g => g !== id)
        : prev.goals.length < 3 ? [...prev.goals, id] : prev.goals
      return { ...prev, goals }
    })
  }

  function togglePain(id) {
    setForm(prev => {
      const pts = prev.painPoints.includes(id)
        ? prev.painPoints.filter(p => p !== id)
        : [...prev.painPoints, id]
      return { ...prev, painPoints: pts }
    })
  }

  function handleRoleBlur() {
    if (!form.persona && form.role) {
      const detected = detectPersona(form.role)
      if (detected) updateField('persona', detected)
    }
  }

  function canProceed() {
    if (step === 1) return form.name.trim() && form.company.trim() && form.role.trim() && form.persona
    if (step === 2) return form.oneProblem.trim().length > 10 && form.goals.length > 0
    if (step === 3) return true // optional step
    if (step === 4) return true // optional step
    return false
  }

  function handleNext() {
    if (step < 4) setStep(s => s + 1)
    else handleSubmit()
  }

  function handleSubmit() {
    const intake = { ...form, completedAt: new Date().toISOString() }
    saveIntake(intake)
    onComplete(intake)
  }

  const progressPct = (step / 4) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm mb-4 inline-block">
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-white">Build Your Playbook</h2>
          <p className="text-gray-400 text-sm mt-1">Step {step} of 4 · ~3 minutes</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step content */}
        <div className="bg-gray-900 rounded-2xl p-8 space-y-6">
          {step === 1 && <Step1 form={form} updateField={updateField} onRoleBlur={handleRoleBlur} />}
          {step === 2 && <Step2 form={form} updateField={updateField} toggleGoal={toggleGoal} />}
          {step === 3 && <Step3 form={form} updateField={updateField} togglePain={togglePain} />}
          {step === 4 && <Step4 form={form} updateField={updateField} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}
            className="text-gray-500 hover:text-gray-300 py-2 transition-colors"
          >
            ← {step === 1 ? 'Back' : 'Previous'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`font-semibold py-3 px-8 rounded-xl transition-colors ${
              canProceed()
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step === 4 ? 'Generate My Playbook →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Step1({ form, updateField, onRoleBlur }) {
  const personaOptions = Object.entries(PERSONA_LABELS)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Tell us about yourself</h3>
        <p className="text-gray-400 text-sm">This personalizes every module of your playbook.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">First name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="Alex"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Company *</label>
          <input
            type="text"
            value={form.company}
            onChange={e => updateField('company', e.target.value)}
            placeholder="Acme Corp"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Your role / title *</label>
        <input
          type="text"
          value={form.role}
          onChange={e => updateField('role', e.target.value)}
          onBlur={onRoleBlur}
          placeholder="VP of Supply Chain, Account Executive, Founder..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">You are a... *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {personaOptions.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => updateField('persona', id)}
              className={`text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                form.persona === id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {form.role && !form.persona && (
          <p className="text-xs text-gray-500 mt-2">Select the option that best fits your role at HDW.</p>
        )}
      </div>
    </div>
  )
}

function Step2({ form, updateField, toggleGoal }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">What brings you to HDW?</h3>
        <p className="text-gray-400 text-sm">This is the most important input. Be specific — it drives everything.</p>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          The one problem you're hoping to make progress on at HDW *
        </label>
        <textarea
          value={form.oneProblem}
          onChange={e => updateField('oneProblem', e.target.value)}
          rows={4}
          placeholder="e.g. Our FADR for big & bulky is 18% and we need to get it under 10%. We're evaluating new carriers and considering a TMS upgrade but haven't pulled the trigger..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">{form.oneProblem.length} chars · Be specific, not generic</p>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Goals at this conference * <span className="text-gray-500">(pick up to 3)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GOALS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGoal(g.id)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                form.goals.includes(g.id)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              } ${!form.goals.includes(g.id) && form.goals.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!form.goals.includes(g.id) && form.goals.length >= 3}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">{form.goals.length}/3 selected</p>
      </div>
    </div>
  )
}

function Step3({ form, updateField, togglePain }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Operational context</h3>
        <p className="text-gray-400 text-sm">Optional — adds more specificity to your session and booth recommendations.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Delivery volume</label>
          <select
            value={form.volumeRange}
            onChange={e => updateField('volumeRange', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select range...</option>
            {VOLUME_RANGES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Primary delivery segment</label>
          <select
            value={form.segment}
            onChange={e => updateField('segment', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select segment...</option>
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-2">Biggest pain points right now</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAIN_POINTS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePain(p.id)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                form.painPoints.includes(p.id)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4({ form, updateField }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Last few things</h3>
        <p className="text-gray-400 text-sm">Both optional — but they make the output better.</p>
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Who / what are you actively trying to avoid?</label>
        <textarea
          value={form.avoidTypes}
          onChange={e => updateField('avoidTypes', e.target.value)}
          rows={3}
          placeholder="e.g. vendor pitch sessions, EV startups, anything to do with grocery cold chain..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">LinkedIn handle</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">linkedin.com/in/</span>
          <input
            type="text"
            value={form.linkedin}
            onChange={e => updateField('linkedin', e.target.value)}
            placeholder="yourhandle"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Used to personalize your LinkedIn post in Module 8</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <p className="text-sm text-gray-300 font-medium">You're about to generate:</p>
        <ul className="mt-2 space-y-1 text-xs text-gray-400">
          <li>• Conference brief tailored to your goals</li>
          <li>• 8–10 priority sessions with prep questions</li>
          <li>• Honest skip list (the sessions not worth your time)</li>
          <li>• Booth strategy by tier</li>
          <li>• Networking targets with conversation openers</li>
          <li>• 2-day schedule</li>
          <li>• Conversation starters for 5 scenarios</li>
          <li>• Pre-conference LinkedIn post draft</li>
        </ul>
      </div>
    </div>
  )
}
