import { useRef, useState, useEffect } from 'react'
import { loadIntake } from '../../lib/storage'
import { savePlaybook, supabaseEnabled } from '../../lib/supabase'
import { notificationsSupported, permissionGranted, requestPermission, scheduleReminders } from '../../lib/notifications'

const MODULES = [
  { id: 'brief', label: '📋 Conference Brief', icon: '📋' },
  { id: 'sessions', label: '🗓 Priority Sessions', icon: '🗓' },
  { id: 'skipList', label: '🚫 Skip List', icon: '🚫' },
  { id: 'boothStrategy', label: '🏢 Booth Strategy', icon: '🏢' },
  { id: 'networkingTargets', label: '🤝 Networking', icon: '🤝' },
  { id: 'schedule', label: '📅 Schedule', icon: '📅' },
  { id: 'conversationStarters', label: '💬 Conversation Starters', icon: '💬' },
  { id: 'linkedInDraft', label: '🔗 LinkedIn Post', icon: '🔗' },
]

export default function Playbook({ playbook, onStartOver, onSwitchPhase }) {
  const intake = loadIntake()
  const moduleRefs = useRef({})
  const [shareState, setShareState] = useState('idle') // idle | saving | copied | error
  const [notifState, setNotifState] = useState(() =>
    permissionGranted() ? 'on' : 'off'
  )
  const [reminderCount, setReminderCount] = useState(0)

  useEffect(() => {
    if (permissionGranted() && playbook?.schedule) {
      const n = scheduleReminders(playbook.schedule)
      setReminderCount(n)
    }
  }, [playbook])

  function scrollTo(id) {
    moduleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleDownloadPDF() {
    const { exportPlaybookPDF } = await import('../../lib/pdfExport')
    exportPlaybookPDF(moduleRefs.current, intake?.name || 'HDW Playbook')
  }

  async function handleShare() {
    setShareState('saving')
    try {
      const id = await savePlaybook(intake, playbook)
      const url = `${window.location.origin}/?id=${id}`
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 3000)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 3000)
    }
  }

  async function handleNotifications() {
    if (notifState === 'on') {
      setNotifState('off')
      return
    }
    const granted = await requestPermission()
    if (granted && playbook?.schedule) {
      const n = scheduleReminders(playbook.schedule)
      setReminderCount(n)
      setNotifState('on')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {intake?.name ? `${intake.name}'s HDW Playbook` : 'Your HDW Playbook'}
            </h1>
            <p className="text-xs text-gray-500">Home Delivery World 2026 · Nashville</p>
          </div>
          <div className="flex gap-2">
            {notificationsSupported() && (
              <button
                onClick={handleNotifications}
                title={notifState === 'on' ? `${reminderCount} reminders set` : 'Enable session reminders'}
                className={`text-sm py-2 px-3 rounded-lg transition-colors ${
                  notifState === 'on'
                    ? 'bg-green-900/40 text-green-400 border border-green-800'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                }`}
              >
                {notifState === 'on' ? `🔔 ${reminderCount}` : '🔕'}
              </button>
            )}
            {supabaseEnabled && (
              <button
                onClick={handleShare}
                disabled={shareState === 'saving'}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {shareState === 'saving' ? 'Saving…' : shareState === 'copied' ? '✓ Link copied!' : shareState === 'error' ? 'Error' : '↗ Share'}
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              ↓ PDF
            </button>
            <button
              onClick={onStartOver}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 px-4 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>

        {/* Module nav */}
        <div className="max-w-4xl mx-auto px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => scrollTo(m.id)}
              className="whitespace-nowrap text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
            >
              {m.icon} {m.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {/* Module 1: Brief */}
        <div ref={el => moduleRefs.current['brief'] = el} id="brief">
          <ModuleHeader icon="📋" title="Your Conference Brief" />
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-200 text-base leading-relaxed">{playbook.brief}</p>
          </div>
        </div>

        {/* Module 2: Sessions */}
        <div ref={el => moduleRefs.current['sessions'] = el} id="sessions">
          <ModuleHeader icon="🗓" title="Priority Sessions" subtitle="Top 8–10 sessions curated for your goals" />
          <SessionList sessions={playbook.sessions} />
        </div>

        {/* Module 3: Skip List */}
        <div ref={el => moduleRefs.current['skipList'] = el} id="skipList">
          <ModuleHeader icon="🚫" title="Honest Skip List" subtitle="Sessions that sound relevant but probably aren't worth your time" />
          <SkipList items={playbook.skipList} />
        </div>

        {/* Module 4: Booth Strategy */}
        <div ref={el => moduleRefs.current['boothStrategy'] = el} id="boothStrategy">
          <ModuleHeader icon="🏢" title="Booth Strategy" subtitle="300+ exhibitors, filtered to what matters for you" />
          <BoothStrategy strategy={playbook.boothStrategy} />
        </div>

        {/* Module 5: Networking */}
        <div ref={el => moduleRefs.current['networkingTargets'] = el} id="networkingTargets">
          <ModuleHeader icon="🤝" title="Networking Targets" />
          <NetworkingTargets targets={playbook.networkingTargets} />
        </div>

        {/* Module 6: Schedule */}
        <div ref={el => moduleRefs.current['schedule'] = el} id="schedule">
          <ModuleHeader icon="📅" title="Day-by-Day Schedule" />
          <Schedule schedule={playbook.schedule} />
        </div>

        {/* Module 7: Conversation Starters */}
        <div ref={el => moduleRefs.current['conversationStarters'] = el} id="conversationStarters">
          <ModuleHeader icon="💬" title="Conversation Starters" subtitle="Pre-built openers for 5 scenarios" />
          <ConversationStarters starters={playbook.conversationStarters} />
        </div>

        {/* Module 8: LinkedIn */}
        <div ref={el => moduleRefs.current['linkedInDraft'] = el} id="linkedInDraft">
          <ModuleHeader icon="🔗" title="Pre-Conference LinkedIn Post" />
          <LinkedInDraft draft={playbook.linkedInDraft} />
        </div>

        {/* Actions */}
        <div className="border-t border-gray-800 pt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={onSwitchPhase}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            On-Floor Tools →
          </button>
          <button
            onClick={onStartOver}
            className="text-gray-500 hover:text-gray-300 py-3 px-8 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  )
}

function ModuleHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-white">{icon} {title}</h2>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function SessionList({ sessions }) {
  if (!sessions?.length) return <EmptyState />
  const day1 = sessions.filter(s => s.date === '2026-05-20')
  const day2 = sessions.filter(s => s.date === '2026-05-21')
  return (
    <div className="space-y-8">
      {day1.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Day 1 — May 20</h3>
          <div className="space-y-4">{day1.map((s, i) => <SessionCard key={i} session={s} />)}</div>
        </div>
      )}
      {day2.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Day 2 — May 21</h3>
          <div className="space-y-4">{day2.map((s, i) => <SessionCard key={i} session={s} />)}</div>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white">{session.title}</h4>
          {(session.time || session.room) && (
            <p className="text-xs text-gray-500 mt-1">
              {[session.time, session.room].filter(Boolean).join(' · ')}
            </p>
          )}
          {session.why && (
            <div className="mt-3">
              <p className="text-sm text-gray-300 font-medium text-xs uppercase tracking-wide text-blue-400">Why it's on your list</p>
              <p className="text-sm text-gray-300 mt-1">{session.why}</p>
            </div>
          )}
          {session.prepQuestion && (
            <div className="mt-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500">Your prep question: </span>
              <span className="text-sm text-gray-200 italic">{session.prepQuestion}</span>
            </div>
          )}
          {session.skipIf && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-gray-600">Skip if: </span>{session.skipIf}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SkipList({ items }) {
  if (!items?.length) return <EmptyState />
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-3">
          <span className="text-red-400 text-lg">✗</span>
          <div>
            <p className="font-medium text-white text-sm">{item.title || item}</p>
            {item.reason && <p className="text-gray-400 text-sm mt-1">{item.reason}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

function BoothStrategy({ strategy }) {
  if (!strategy) return <EmptyState />
  return (
    <div className="space-y-6">
      {strategy.tier1?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
            Tier 1 — Must Visit
          </h3>
          <div className="space-y-3">
            {strategy.tier1.map((booth, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-white">{booth.company}</h4>
                  {booth.boothNumber && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">Booth {booth.boothNumber}</span>
                  )}
                </div>
                {booth.relevance && <p className="text-sm text-gray-300 mt-2">{booth.relevance}</p>}
                {booth.question && (
                  <div className="mt-2 bg-gray-800 rounded px-3 py-2">
                    <span className="text-xs text-gray-500">Open with: </span>
                    <span className="text-sm text-gray-200 italic">{booth.question}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {strategy.tier2?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            Tier 2 — If Time
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {strategy.tier2.map((booth, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="font-medium text-white text-sm">{booth.company || booth}</p>
                {booth.relevance && <p className="text-xs text-gray-400 mt-1">{booth.relevance}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {strategy.tier3 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tier 3 — Skip</h3>
          <p className="text-sm text-gray-400 bg-gray-900 rounded-lg p-4 border border-gray-800">{strategy.tier3}</p>
        </div>
      )}
    </div>
  )
}

function NetworkingTargets({ targets }) {
  if (!targets) return <EmptyState />
  return (
    <div className="space-y-6">
      {targets.speakers?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Priority Speakers to Find</h3>
          <div className="space-y-3">
            {targets.speakers.map((spk, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="font-semibold text-white">{spk.name}</p>
                {spk.company && <p className="text-xs text-gray-500">{spk.role} · {spk.company}</p>}
                {spk.relevance && <p className="text-sm text-gray-300 mt-2">{spk.relevance}</p>}
                {spk.opener && (
                  <div className="mt-2 bg-gray-800 rounded px-3 py-2">
                    <span className="text-xs text-gray-500">Opener: </span>
                    <span className="text-sm text-gray-200 italic">{spk.opener}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {targets.companyTypes?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Company Types to Prioritize</h3>
          <div className="space-y-2">
            {targets.companyTypes.map((ct, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-sm text-gray-200">{ct.type || ct}</p>
                {ct.why && <p className="text-xs text-gray-400 mt-1">{ct.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {targets.valueProp && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">Your Value Prop at HDW</p>
          <p className="text-white font-medium">{targets.valueProp}</p>
        </div>
      )}
    </div>
  )
}

function Schedule({ schedule }) {
  if (!schedule) return <EmptyState />
  return (
    <div className="space-y-8">
      {schedule.day1?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Day 1 — Wednesday, May 20</h3>
          <ScheduleDay items={schedule.day1} />
        </div>
      )}
      {schedule.day2?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Day 2 — Thursday, May 21</h3>
          <ScheduleDay items={schedule.day2} />
        </div>
      )}
    </div>
  )
}

function ScheduleDay({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 bg-gray-900 rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-500 whitespace-nowrap w-16 pt-0.5">{item.time}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{item.activity}</p>
            {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
          </div>
          {item.type && (
            <span className={`text-xs px-2 py-0.5 rounded-full self-start ${
              item.type === 'session' ? 'bg-blue-900/40 text-blue-300' :
              item.type === 'booth' ? 'bg-green-900/40 text-green-300' :
              item.type === 'networking' ? 'bg-purple-900/40 text-purple-300' :
              'bg-gray-800 text-gray-400'
            }`}>
              {item.type}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function ConversationStarters({ starters }) {
  if (!starters?.length) return <EmptyState />
  return (
    <div className="space-y-4">
      {starters.map((s, i) => (
        <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">{s.scenario}</p>
          <p className="text-white">{s.opener}</p>
        </div>
      ))}
    </div>
  )
}

function LinkedInDraft({ draft }) {
  if (!draft) return <EmptyState />
  function copyToClipboard() {
    navigator.clipboard.writeText(draft)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => {})
  }
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <p className="text-sm text-gray-400">Ready to post</p>
        <button
          onClick={copyToClipboard}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          Copy
        </button>
      </div>
      <div className="p-5">
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{draft}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-gray-500 text-sm">No data available.</div>
}
