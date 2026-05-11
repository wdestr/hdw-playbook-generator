# HDW Playbook Generator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a 3-phase AI conference playbook tool for Home Delivery World 2026, live by end of day.

**Architecture:** React SPA (Vite + Tailwind) → Netlify Function proxy → Gemini 1.5 Flash. All HDW conference data stored as static JSON bundled at build time. No auth, no database.

**Tech Stack:** React 18, Vite, Tailwind CSS, Vitest, `@google/generative-ai`, `html2canvas`, `jspdf`, Netlify Functions

---

## File Map

```
public/data/
  sessions.json          — scraped HDW sessions (100+)
  speakers.json          — scraped HDW speakers (250+)
  exhibitors.json        — scraped HDW exhibitors (300+)
  agenda-meta.json       — venue, happy hours, meals, keynotes

src/
  main.jsx               — Vite entry, renders App
  App.jsx                — root state machine (phase, view, intake, playbook)
  index.css              — Tailwind base + custom styles
  lib/
    storage.js           — localStorage helpers (key: hdw2026_intake)
    personas.js          — 5 persona definitions, keyword detection, system prompts
    dataFilter.js        — filter sessions/exhibitors by persona tags
    pdfExport.js         — html2canvas + jsPDF module capture logic
  hooks/
    usePhase.js          — date-based phase unlock (Phase 2: May 20, Phase 3: May 22)
  components/
    Landing.jsx          — hero + phase selector cards
    PhaseSelector.jsx    — 3 cards with lock states
    phase1/
      IntakeWizard.jsx   — 4-step wizard orchestrator + form state
      IntakeStep1.jsx    — name, company, role, persona picker
      IntakeStep2.jsx    — one problem + goals multi-select
      IntakeStep3.jsx    — operational context (optional)
      IntakeStep4.jsx    — who to avoid + LinkedIn handle (optional)
      GeneratingState.jsx — loading state with progress copy
      Playbook.jsx       — 8-module shell with sticky nav + PDF/reset actions
      modules/
        ConferenceBrief.jsx
        PrioritySessions.jsx
        SkipList.jsx
        BoothStrategy.jsx
        NetworkingTargets.jsx
        DayByDaySchedule.jsx
        ConversationStarters.jsx
        LinkedInDraft.jsx
    phase2/
      OnFloorAssistant.jsx  — tool selector shell
      SessionDebrief.jsx
      PeopleLookup.jsx
      BoothScan.jsx
      ConflictResolver.jsx
    phase3/
      PostConference.jsx    — tool selector shell
      FollowUpEmail.jsx
      LinkedInRecap.jsx
      ConnectionsTracker.jsx  — local state + CSV export

netlify/
  functions/
    generate.js          — Gemini proxy, routes on phase+tool params

src/__tests__/
  lib/storage.test.js
  lib/personas.test.js
  lib/dataFilter.test.js

netlify.toml             — build config + functions path
vite.config.js           — vitest config included
tailwind.config.js
package.json
```

---

## Chunk 1: Project Scaffold + HDW Data

### Task 1: Initialize project

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `netlify.toml`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd "/Users/wileystrahan/Ventures/Home Delivery World"
npm create vite@latest . -- --template react
npm install
```

Expected: `node_modules/` created, dev server works with `npm run dev`

- [ ] **Step 2: Install all dependencies**

```bash
npm install tailwindcss @tailwindcss/vite @google/generative-ai html2canvas jspdf
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Tailwind in `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
})
```

- [ ] **Step 4: Set up `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 5: Create `src/__tests__/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In `package.json` scripts, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"
  port = 5173
  targetPort = 5173

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 8: Create `netlify/functions/` directory**

```bash
mkdir -p netlify/functions
```

- [ ] **Step 9: Create `public/data/` directory with placeholder files**

```bash
mkdir -p public/data
```

Create `public/data/sessions.json` with placeholder:
```json
[]
```
Same for `speakers.json`, `exhibitors.json`, `agenda-meta.json` (empty object `{}`).

- [ ] **Step 10: Create GitHub repo and push**

```bash
gh repo create hdw-playbook-generator --public --source=. --remote=origin --push
```
If `gh` CLI not available: create repo at github.com manually, then `git remote add origin <url> && git push -u origin main`.

- [ ] **Step 11: Verify dev server runs**

```bash
npm run dev
```
Expected: Vite dev server starts on http://localhost:5173

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite+React+Tailwind+Netlify project"
```

---

### Task 2: Scrape HDW sessions data

**Files:**
- Create/populate: `public/data/sessions.json`

- [ ] **Step 1: Navigate to HDW agenda page using Chrome MCP**

Use `mcp__Claude_in_Chrome__navigate` to go to `https://www.homedeliveryworld.com/agenda/` (or equivalent agenda URL found on the site).

- [ ] **Step 2: Extract session data**

Use `mcp__Claude_in_Chrome__get_page_text` and/or `mcp__Claude_in_Chrome__read_page` to extract all session titles, times, dates, rooms, speaker names, descriptions, and tracks.

- [ ] **Step 3a: Normalize raw session data into JSON shape**

For each scraped session, produce an object with this shape:
```json
{
  "id": "session-001",
  "title": "string",
  "date": "2026-05-20",
  "startTime": "09:00",
  "endTime": "09:45",
  "room": "string",
  "track": "string",
  "speakers": ["speaker_id"],
  "description": "string",
  "tags": []
}
```
Leave `tags` empty for now. Write the raw array to `public/data/sessions.json`.

- [ ] **Step 3b: Add persona tags to each session**

Go through each session and add relevant tags from: `last-mile`, `big-bulky`, `grocery`, `furniture`, `appliances`, `technology`, `routing`, `tms`, `visibility`, `returns`, `retail`, `carrier`, `3pl`, `startup`, `keynote`, `panel`, `workshop`, `vendor-pitch`

Rules: keynotes → `keynote`; sessions explicitly about vendor product demos → `vendor-pitch`; sessions about delivery performance → `last-mile`; etc. Use description + track to infer. Update `sessions.json`.

- [ ] **Step 4: Commit sessions data**

```bash
git add public/data/sessions.json
git commit -m "data: add HDW 2026 sessions"
```

---

### Task 3: Scrape HDW speakers + exhibitors

**Files:**
- Create/populate: `public/data/speakers.json`, `public/data/exhibitors.json`, `public/data/agenda-meta.json`

- [ ] **Step 1: Navigate to speakers page and extract data**

Use Chrome MCP to scrape `https://www.homedeliveryworld.com/speakers/` (or equivalent). Extract name, company, role, session(s), LinkedIn URL if visible.

Write to `public/data/speakers.json`:
```json
[{
  "id": "speaker-001",
  "name": "string",
  "company": "string",
  "role": "string",
  "sessions": ["session-001"],
  "linkedin": "https://linkedin.com/in/..."
}]
```

- [ ] **Step 2: Navigate to exhibitors page and extract data**

Use Chrome MCP to scrape `https://www.homedeliveryworld.com/exhibitors/` (or equivalent). Extract company name, booth number, description.

Write to `public/data/exhibitors.json`:
```json
[{
  "id": "exhibitor-001",
  "company": "string",
  "boothNumber": "string",
  "categories": ["technology", "last-mile"],
  "description": "string"
}]
```

- [ ] **Step 3: Write agenda-meta.json**

Fill in from HDW website (venue info, happy hour times, meal times, keynote slots):
```json
{
  "venue": "Music City Center, Nashville, TN",
  "happyHours": [
    { "date": "2026-05-20", "time": "17:30", "location": "Exhibit Hall" }
  ],
  "keynoteTimes": [
    { "date": "2026-05-20", "startTime": "09:00", "endTime": "09:45" }
  ],
  "mealTimes": [
    { "date": "2026-05-20", "meal": "Lunch", "time": "12:00", "location": "Exhibit Hall" }
  ]
}
```

- [ ] **Step 4: Commit all data files**

```bash
git add public/data/
git commit -m "data: add HDW 2026 speakers, exhibitors, agenda-meta"
```

---

## Chunk 2: Core Library

### Task 4: storage.js

**Files:**
- Create: `src/lib/storage.js`
- Create: `src/__tests__/lib/storage.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/storage.test.js`:
```js
import { saveIntake, loadIntake, clearIntake } from '../../lib/storage'

const mockIntake = { name: 'Test User', persona: 'retailer-shipper' }

beforeEach(() => localStorage.clear())

test('saveIntake stores under hdw2026_intake key', () => {
  saveIntake(mockIntake)
  expect(localStorage.getItem('hdw2026_intake')).toBe(JSON.stringify(mockIntake))
})

test('loadIntake returns parsed object', () => {
  localStorage.setItem('hdw2026_intake', JSON.stringify(mockIntake))
  expect(loadIntake()).toEqual(mockIntake)
})

test('loadIntake returns null when nothing saved', () => {
  expect(loadIntake()).toBeNull()
})

test('clearIntake removes the key', () => {
  saveIntake(mockIntake)
  clearIntake()
  expect(localStorage.getItem('hdw2026_intake')).toBeNull()
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test
```
Expected: 4 failing tests (module not found)

- [ ] **Step 3: Implement `src/lib/storage.js`**

```js
const KEY = 'hdw2026_intake'

export const saveIntake = (intake) =>
  localStorage.setItem(KEY, JSON.stringify(intake))

export const loadIntake = () => {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}

export const clearIntake = () => localStorage.removeItem(KEY)
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test
```
Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.js src/__tests__/lib/storage.test.js
git commit -m "feat: storage helpers for hdw2026_intake"
```

---

### Task 5: personas.js

**Files:**
- Create: `src/lib/personas.js`
- Create: `src/__tests__/lib/personas.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/personas.test.js`:
```js
import { detectPersona, getPersonaLabel, PERSONAS, getSystemPrompt } from '../../lib/personas'

test('detects retailer from VP Supply Chain role', () => {
  expect(detectPersona('VP Supply Chain', '')).toBe('retailer-shipper')
})

test('detects tech-vendor from Account Executive role', () => {
  expect(detectPersona('Account Executive', '')).toBe('tech-vendor')
})

test('detects carrier-3pl from Director of Operations at a carrier', () => {
  expect(detectPersona('Director of Operations', 'Last Mile Logistics')).toBe('carrier-3pl')
})

test('returns null for unrecognized role', () => {
  expect(detectPersona('Barista', 'Coffee Shop')).toBeNull()
})

test('getPersonaLabel returns display string', () => {
  expect(getPersonaLabel('retailer-shipper')).toBe('Retailer / Shipper')
})

test('getSystemPrompt returns non-empty string for each persona', () => {
  PERSONAS.forEach(p => {
    expect(getSystemPrompt(p.id).length).toBeGreaterThan(100)
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test
```

- [ ] **Step 3: Implement `src/lib/personas.js`**

```js
export const PERSONAS = [
  { id: 'retailer-shipper', label: 'Retailer / Shipper' },
  { id: 'carrier-3pl', label: 'Carrier / 3PL' },
  { id: 'tech-vendor', label: 'Tech Vendor' },
  { id: 'startup-investor', label: 'Startup / Investor' },
  { id: 'operator-advisor', label: 'Operator-Advisor' },
]

const PERSONA_KEYWORDS = {
  'retailer-shipper': ['supply chain', 'logistics director', 'vp logistics', 'director of logistics', 'shipper', 'retailer', 'procurement', 'transportation manager', 'head of delivery'],
  'carrier-3pl': ['carrier', '3pl', 'fleet', 'dispatch', 'driver', 'last mile operator', 'delivery operations', 'director of operations'],
  'tech-vendor': ['account executive', 'sales', 'business development', 'bd', 'product manager', 'software', 'saas', 'cto', 'founder', 'vp sales', 'vp marketing'],
  'startup-investor': ['founder', 'ceo', 'investor', 'venture', 'partner', 'general partner', 'angel', 'co-founder'],
  'operator-advisor': ['advisor', 'consultant', 'independent', 'fractional', 'board member', 'operating partner'],
}

export const detectPersona = (role, company) => {
  const text = `${role} ${company}`.toLowerCase()
  for (const [personaId, keywords] of Object.entries(PERSONA_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return personaId
  }
  return null
}

export const getPersonaLabel = (id) =>
  PERSONAS.find(p => p.id === id)?.label ?? id

export const PERSONA_TAGS = {
  'retailer-shipper': ['retail', 'last-mile', 'technology', 'routing', 'tms', 'visibility', 'returns', 'big-bulky', 'keynote'],
  'carrier-3pl': ['carrier', '3pl', 'last-mile', 'routing', 'big-bulky', 'technology', 'keynote'],
  'tech-vendor': ['technology', 'routing', 'tms', 'visibility', 'retail', 'carrier', 'keynote'],
  'startup-investor': ['startup', 'technology', 'last-mile', 'keynote', 'panel'],
  'operator-advisor': ['last-mile', 'technology', 'retail', 'carrier', 'startup', 'keynote', 'panel'],
}

const SYSTEM_PROMPTS = {
  'retailer-shipper': `You are a strategic conference advisor for a retail/shipper executive at Home Delivery World 2026 in Nashville (May 20-21). This person sits on the buying side — they manage or buy last-mile delivery. They are surrounded by vendors at this conference. Their job is to solve operational problems, not sell. Their time is scarce and valuable.

Retailer/Shipper playbooks must: prioritize sessions with operational substance over vendor panels; identify technology providers that solve their stated problem with specificity; focus networking on peers at similar companies who have solved similar problems; and be brutally honest about which exhibitors are relevant vs. noise.

Every recommendation must connect explicitly to the user's stated problem and goals. Do not give generic advice. If a session doesn't apply to their stated problem, don't recommend it.`,

  'carrier-3pl': `You are a strategic conference advisor for a carrier or 3PL leader at Home Delivery World 2026 in Nashville (May 20-21). This person operates delivery networks — they are who retailers hire. At HDW, they are simultaneously prospecting for retail clients, evaluating technology to improve operations, and sizing up competitors.

Carrier/3PL playbooks must: balance time between retailer prospect conversations and technology evaluation; identify retailers attending who match their service profile; flag technology sessions that address their operational pain points; and position them as a credible operator, not just a vendor.

Be explicit about which conversations to prioritize and why. The best ROI for this persona comes from 1:1 conversations, not sessions.`,

  'tech-vendor': `You are a strategic conference advisor for a technology vendor at Home Delivery World 2026 in Nashville (May 20-21). This person is selling or building software/platforms for the logistics industry. At HDW they are primarily there to generate pipeline and competitive intelligence.

Tech vendor playbooks must: be explicit that their time is best spent on the floor and in 1:1 conversations, not in sessions; identify the highest-value retail/carrier prospects to target by company type; suggest conversation openers that start with the buyer's problem, not the vendor's product; and flag competitor presence to monitor.

Do not recommend attending sessions that are clearly for operators. Their playbook should be heavily weighted toward booth strategy and networking.`,

  'startup-investor': `You are a strategic conference advisor for a startup founder or investor at Home Delivery World 2026 in Nashville (May 20-21). This person is either building something new in last-mile logistics or looking for what to invest in. They need to validate problem hypotheses, find design partners or customers, and raise their profile.

Startup/Investor playbooks must: prioritize conversations with operators who experience the problem they care about; identify sessions that give signal on which problems are unsolved vs. being commoditized; suggest positioning that emphasizes the problem they care about, not their product or thesis; and identify which operators and investors are worth targeting.

Help them think about what narrative they want to be known for after this conference.`,

  'operator-advisor': `You are a strategic conference advisor for a senior operator-advisor at Home Delivery World 2026 in Nashville (May 20-21). This person has deep operating experience in logistics and is now advising, building, or investing. They are the most versatile persona at the conference — they can have peer conversations with operators AND credible conversations with vendors AND strategic conversations with startups.

Operator-Advisor playbooks must: maximize their positioning as a trusted voice in the industry; identify thought leadership opportunities; prioritize conversations that could lead to advisory relationships, investments, or business development; and help them define what they want to be known for after the conference.

Their biggest risk is spreading too thin. Help them be selective and intentional.`,
}

export const getSystemPrompt = (personaId) => SYSTEM_PROMPTS[personaId] ?? SYSTEM_PROMPTS['operator-advisor']
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/personas.js src/__tests__/lib/personas.test.js
git commit -m "feat: persona definitions, detection, and system prompts"
```

---

### Task 6: dataFilter.js

**Files:**
- Create: `src/lib/dataFilter.js`
- Create: `src/__tests__/lib/dataFilter.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lib/dataFilter.test.js`:
```js
import { filterSessionsForPersona, filterExhibitorsForPersona } from '../../lib/dataFilter'

const sessions = [
  { id: 's1', tags: ['technology', 'last-mile'], title: 'Tech Session' },
  { id: 's2', tags: ['grocery', 'retail'], title: 'Grocery Session' },
  { id: 's3', tags: ['keynote'], title: 'Keynote' },
]

const exhibitors = [
  { id: 'e1', categories: ['technology', 'routing'] },
  { id: 'e2', categories: ['carrier'] },
  { id: 'e3', categories: ['big-bulky'] },
]

test('filters sessions by persona tags', () => {
  const result = filterSessionsForPersona(sessions, 'tech-vendor')
  expect(result.map(s => s.id)).toContain('s1')
  expect(result.map(s => s.id)).not.toContain('s2')
})

test('always includes keynote sessions even when list is large', () => {
  const manyNonKeynotes = Array.from({ length: 35 }, (_, i) => ({ id: `s-extra-${i}`, tags: ['technology'] }))
  const withKeynote = [...manyNonKeynotes, { id: 'keynote-1', tags: ['keynote'], title: 'Keynote' }]
  const result = filterSessionsForPersona(withKeynote, 'tech-vendor')
  expect(result.map(s => s.id)).toContain('keynote-1')
})

test('filters exhibitors by persona tags', () => {
  const result = filterExhibitorsForPersona(exhibitors, 'carrier-3pl')
  expect(result.map(e => e.id)).toContain('e2')
  expect(result.map(e => e.id)).not.toContain('e3')
})

test('returns up to 30 sessions', () => {
  const many = Array.from({ length: 50 }, (_, i) => ({ id: `s${i}`, tags: ['technology'] }))
  expect(filterSessionsForPersona(many, 'tech-vendor').length).toBeLessThanOrEqual(30)
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test
```

- [ ] **Step 3: Implement `src/lib/dataFilter.js`**

```js
import { PERSONA_TAGS } from './personas'

export const filterSessionsForPersona = (sessions, personaId) => {
  const tags = PERSONA_TAGS[personaId] ?? []
  const keynotes = sessions.filter(s => s.tags?.includes('keynote'))
  const rest = sessions.filter(s =>
    !s.tags?.includes('keynote') && s.tags?.some(t => tags.includes(t))
  )
  return [...keynotes, ...rest].slice(0, 30)
}

export const filterExhibitorsForPersona = (exhibitors, personaId) => {
  const tags = PERSONA_TAGS[personaId] ?? []
  const filtered = exhibitors.filter(e =>
    e.categories?.some(c => tags.includes(c))
  )
  return filtered.slice(0, 50)
}
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/dataFilter.js src/__tests__/lib/dataFilter.test.js
git commit -m "feat: data filter — sessions and exhibitors by persona tags"
```

---

### Task 7: usePhase hook

**Files:**
- Create: `src/hooks/usePhase.js`

- [ ] **Step 1: Implement `src/hooks/usePhase.js`**

```js
// Phase 2 unlocks May 20, Phase 3 unlocks May 22
const PHASE_UNLOCK = {
  2: new Date('2026-05-20T00:00:00'),
  3: new Date('2026-05-22T00:00:00'),
}

export const usePhase = () => {
  const now = new Date()
  return {
    isPhaseUnlocked: (phase) => {
      if (phase === 1) return true
      return now >= PHASE_UNLOCK[phase]
    },
    unlockDate: (phase) => PHASE_UNLOCK[phase],
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePhase.js
git commit -m "feat: usePhase hook with date-based unlock logic"
```

---

## Chunk 3: Phase 1 — Intake Wizard

### Task 8: App shell + Landing

**Files:**
- Create: `src/App.jsx`, `src/components/Landing.jsx`, `src/components/PhaseSelector.jsx`

- [ ] **Step 1: Implement `src/App.jsx`**

```jsx
import { useState } from 'react'
import Landing from './components/Landing'
import IntakeWizard from './components/phase1/IntakeWizard'
import Playbook from './components/phase1/Playbook'
import OnFloorAssistant from './components/phase2/OnFloorAssistant'
import PostConference from './components/phase3/PostConference'
import { loadIntake, clearIntake } from './lib/storage'

export default function App() {
  const [view, setView] = useState('landing') // landing | intake | generating | playbook | phase2 | phase3
  const [playbook, setPlaybook] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const savedIntake = loadIntake()

  const handlePhase1 = () => {
    if (savedIntake) {
      // Returning user: offer to view existing playbook or start fresh
      setView('returning')
    } else {
      setView('intake')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {view === 'landing' && (
        <Landing
          onSelectPhase={(phase) => {
            if (phase === 1) handlePhase1()
            if (phase === 2) setView('phase2')
            if (phase === 3) setView('phase3')
          }}
          hasSavedIntake={!!savedIntake}
        />
      )}

      {/* Returning user prompt */}
      {view === 'returning' && (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">You have a saved playbook</h2>
          <p className="text-gray-400 mb-8">Would you like to generate a new one, or go back to the landing page?</p>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <button
              onClick={() => setView('generating')}
              className="py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors"
            >
              Regenerate my playbook
            </button>
            <button
              onClick={() => {
                clearIntake()
                setView('intake')
              }}
              className="py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Start fresh (new intake)
            </button>
            <button onClick={() => setView('landing')} className="text-gray-500 hover:text-white text-sm">
              ← Back
            </button>
          </div>
        </div>
      )}

      {view === 'intake' && (
        <>
          {errorMsg && (
            <div className="max-w-2xl mx-auto px-6 pt-8">
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 mb-4">
                {errorMsg === 'rate_limited'
                  ? "We're getting a lot of requests right now — please try again in a few minutes."
                  : "Something went wrong generating your playbook. Please try again."}
                <button onClick={() => setErrorMsg(null)} className="ml-3 underline">Dismiss</button>
              </div>
            </div>
          )}
          <IntakeWizard
            onGenerate={() => { setErrorMsg(null); setView('generating') }}
            onBack={() => setView('landing')}
          />
        </>
      )}
      {view === 'generating' && (
        <GeneratingState
          onComplete={(data) => { setPlaybook(data); setView('playbook') }}
          onError={(msg) => { setErrorMsg(msg); setView('intake') }}
        />
      )}
      {view === 'playbook' && playbook && (
        <Playbook
          data={playbook}
          onReset={() => { setPlaybook(null); clearIntake(); setView('landing') }}
        />
      )}
      {view === 'phase2' && <OnFloorAssistant onBack={() => setView('landing')} />}
      {view === 'phase3' && <PostConference onBack={() => setView('landing')} />}
    </div>
  )
}
```

Note: `GeneratingWrapper` is added in Task 11. For now, stub it as a placeholder component returning `<div>Generating...</div>`.

- [ ] **Step 2: Implement `src/components/Landing.jsx`**

```jsx
import PhaseSelector from './PhaseSelector'

export default function Landing({ onSelectPhase, hasSavedIntake }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-3">
          Home Delivery World 2026 · Nashville · May 20–21
        </p>
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          Your HDW Playbook
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          3 minutes of intake. A fully personalized game plan — sessions, booths, networking targets, talking points, and follow-up templates. Built by a practitioner, for practitioners.
        </p>
        {hasSavedIntake && (
          <p className="mt-4 text-sm text-green-400">
            You have a saved playbook. Select Pre-Conference to view or regenerate it.
          </p>
        )}
      </div>
      <PhaseSelector onSelectPhase={onSelectPhase} />
      <p className="mt-10 text-xs text-gray-600 text-center">
        No login. No email. Free. Built by <a href="https://linkedin.com/in/wileystrahan" className="underline">Wiley Strahan</a>.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Implement `src/components/PhaseSelector.jsx`**

```jsx
import { usePhase } from '../hooks/usePhase'

const PHASES = [
  {
    id: 1,
    emoji: '📋',
    title: 'Pre-Conference Playbook',
    description: 'Full personalized game plan — sessions, booths, networking, schedule, talking points.',
    cta: 'Build My Playbook →',
  },
  {
    id: 2,
    emoji: '🏃',
    title: 'On The Floor',
    description: 'Real-time session debrief, booth scan, people lookup, conflict resolver.',
    cta: 'Open Floor Mode →',
    lockDate: 'Unlocks May 20',
  },
  {
    id: 3,
    emoji: '📬',
    title: 'Post-Conference',
    description: 'Follow-up emails, LinkedIn recap, connections tracker.',
    cta: 'Start Debrief →',
    lockDate: 'Unlocks May 22',
  },
]

export default function PhaseSelector({ onSelectPhase }) {
  const { isPhaseUnlocked } = usePhase()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PHASES.map((phase) => {
        const unlocked = isPhaseUnlocked(phase.id)
        return (
          <button
            key={phase.id}
            onClick={() => unlocked && onSelectPhase(phase.id)}
            disabled={!unlocked}
            className={`text-left p-6 rounded-xl border transition-all ${
              unlocked
                ? 'border-gray-700 bg-gray-900 hover:border-orange-500 hover:bg-gray-800 cursor-pointer'
                : 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="text-3xl mb-3">{phase.emoji}</div>
            <h3 className="font-semibold text-lg mb-2">{phase.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{phase.description}</p>
            <span className={`text-sm font-medium ${unlocked ? 'text-orange-400' : 'text-gray-600'}`}>
              {unlocked ? phase.cta : phase.lockDate}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run dev server and verify landing renders**

```bash
npm run dev
```
Open http://localhost:5173 — should see dark landing page with 3 phase cards.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: App shell, Landing, PhaseSelector with phase unlock"
```

---

### Task 9: Intake Wizard

**Files:**
- Create: `src/components/phase1/IntakeWizard.jsx`, `IntakeStep1.jsx`, `IntakeStep2.jsx`, `IntakeStep3.jsx`, `IntakeStep4.jsx`

- [ ] **Step 1: Implement `src/components/phase1/IntakeWizard.jsx`**

```jsx
import { useState } from 'react'
import IntakeStep1 from './IntakeStep1'
import IntakeStep2 from './IntakeStep2'
import IntakeStep3 from './IntakeStep3'
import IntakeStep4 from './IntakeStep4'
import { saveIntake, loadIntake } from '../../lib/storage'

const EMPTY_INTAKE = {
  name: '', company: '', role: '', persona: '',
  oneProblem: '', goals: [],
  volume: '', segment: '', painPoints: [],
  whoToAvoid: '', linkedin: '',
}

export default function IntakeWizard({ onGenerate, onBack }) {
  const [step, setStep] = useState(1)
  const [intake, setIntake] = useState(EMPTY_INTAKE)

  const update = (fields) => setIntake(prev => ({ ...prev, ...fields }))

  const next = () => setStep(s => s + 1)
  const back = () => step === 1 ? onBack() : setStep(s => s - 1)

  const submit = () => {
    saveIntake(intake)
    onGenerate()
  }

  const stepProps = { intake, update, onNext: next, onBack: back }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= step ? 'bg-orange-500' : 'bg-gray-800'}`} />
        ))}
      </div>

      {step === 1 && <IntakeStep1 {...stepProps} />}
      {step === 2 && <IntakeStep2 {...stepProps} />}
      {step === 3 && <IntakeStep3 {...stepProps} onNext={next} />}
      {step === 4 && <IntakeStep4 {...stepProps} onNext={submit} />}
    </div>
  )
}
```

- [ ] **Step 2: Implement `src/components/phase1/IntakeStep1.jsx`**

```jsx
import { useEffect } from 'react'
import { PERSONAS, detectPersona } from '../../lib/personas'

export default function IntakeStep1({ intake, update, onNext, onBack }) {
  useEffect(() => {
    if (intake.role && intake.company) {
      const suggested = detectPersona(intake.role, intake.company)
      if (suggested && !intake.persona) update({ persona: suggested })
    }
  }, [intake.role, intake.company])

  const valid = intake.name && intake.company && intake.role && intake.persona

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Tell us about yourself</h2>
      <p className="text-gray-400 mb-8">1 of 4 — takes about 30 seconds</p>

      <div className="space-y-4">
        {[
          { label: 'Your name', key: 'name', placeholder: 'First Last' },
          { label: 'Company', key: 'company', placeholder: 'Acme Corp' },
          { label: 'Role / title', key: 'role', placeholder: 'VP of Supply Chain' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
              value={intake[key]}
              onChange={e => update({ [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            I'm attending as a...
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => update({ persona: p.id })}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  intake.persona === p.id
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                {p.label}
                {detectPersona(intake.role, intake.company) === p.id && (
                  <span className="ml-2 text-xs text-orange-400">(suggested)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white">← Back</button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement `src/components/phase1/IntakeStep2.jsx`**

```jsx
const GOALS = [
  { id: 'find-tech', label: 'Find a technology solution' },
  { id: 'carrier-partners', label: 'Meet potential carrier / hauler partners' },
  { id: 'retail-prospects', label: 'Meet potential retail / shipper prospects' },
  { id: 'competitive-intel', label: 'Competitive intelligence' },
  { id: 'personal-brand', label: 'Build my personal brand / visibility' },
  { id: 'validate-hypothesis', label: 'Validate a problem or hypothesis' },
  { id: 'hiring', label: 'Hire or be hired' },
  { id: 'investor-meetings', label: 'Investor meetings' },
]

export default function IntakeStep2({ intake, update, onNext, onBack }) {
  const toggleGoal = (id) => {
    const current = intake.goals
    const next = current.includes(id)
      ? current.filter(g => g !== id)
      : current.length < 3 ? [...current, id] : current
    update({ goals: next })
  }

  const valid = intake.oneProblem.trim().length > 20 && intake.goals.length > 0

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">What are you here to solve?</h2>
      <p className="text-gray-400 mb-8">2 of 4 — this is the most important question</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            The single biggest problem you're hoping to make progress on at HDW
          </label>
          <textarea
            value={intake.oneProblem}
            onChange={e => update({ oneProblem: e.target.value })}
            rows={4}
            placeholder="e.g. We're running 18% FADR on furniture delivery and haven't found a carrier that can consistently hit below 10% at our volume. Looking for either a technology solution or a carrier partner who's proven it."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Goals at this conference <span className="text-gray-500">(pick up to 3)</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  intake.goals.includes(g.id)
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                } ${!intake.goals.includes(g.id) && intake.goals.length >= 3 ? 'opacity-40' : ''}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white">← Back</button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/phase1/IntakeStep3.jsx`**

```jsx
const VOLUMES = ['< 1,000 deliveries/month', '1K–10K/month', '10K–100K/month', '100K+/month', 'Not applicable']
const SEGMENTS = ['Parcel', 'Big & Bulky', 'Grocery / Food', 'Furniture', 'Appliances', 'Other']
const PAIN_POINTS = ['Cost / rate', 'FADR / damage', 'Carrier capacity', 'Customer experience', 'Technology gaps', 'Compliance', 'Other']

export default function IntakeStep3({ intake, update, onNext, onBack }) {
  const toggle = (key, value) => {
    const arr = intake[key]
    update({ [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] })
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Operational context</h2>
      <p className="text-gray-400 mb-2">3 of 4 — optional, but increases personalization</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Delivery volume</label>
          <div className="flex flex-wrap gap-2">
            {VOLUMES.map(v => (
              <button key={v} onClick={() => update({ volume: v })}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${intake.volume === v ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Primary delivery segment</label>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map(s => (
              <button key={s} onClick={() => update({ segment: s })}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${intake.segment === s ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Biggest pain points right now</label>
          <div className="flex flex-wrap gap-2">
            {PAIN_POINTS.map(p => (
              <button key={p} onClick={() => toggle('painPoints', p)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${intake.painPoints.includes(p) ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white">← Back</button>
        <button onClick={onNext} className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
          Continue →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement `src/components/phase1/IntakeStep4.jsx`**

```jsx
export default function IntakeStep4({ intake, update, onNext, onBack }) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Last two things</h2>
      <p className="text-gray-400 mb-8">4 of 4 — both optional</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Any vendors or conversations you're actively trying to skip?
          </label>
          <p className="text-xs text-gray-500 mb-2">Honest signal. Your playbook will avoid recommending these.</p>
          <textarea
            value={intake.whoToAvoid}
            onChange={e => update({ whoToAvoid: e.target.value })}
            rows={3}
            placeholder="e.g. We already have a TMS contract through 2027. Not interested in routing software pitches."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            LinkedIn handle <span className="text-gray-500">(for pre-conference post draft)</span>
          </label>
          <input
            value={intake.linkedin}
            onChange={e => update({ linkedin: e.target.value })}
            placeholder="linkedin.com/in/yourhandle"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="px-6 py-3 text-gray-400 hover:text-white">← Back</button>
        <button onClick={onNext} className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
          Build My Playbook →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run dev server and test full intake flow end to end**

```bash
npm run dev
```
Click through all 4 steps. Confirm form state persists across steps, "suggested" persona appears on Step 1, goals limit to 3 on Step 2, Step 4 submits.

- [ ] **Step 7: Commit**

```bash
git add src/components/phase1/
git commit -m "feat: Phase 1 intake wizard, all 4 steps"
```

---

## Chunk 4: Netlify Function + Playbook Output

### Task 10: Netlify Function (Gemini proxy)

**Files:**
- Create: `netlify/functions/generate.js`

- [ ] **Step 1: Create `netlify/functions/generate.js`**

```js
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'invalid_json' }) }
  }

  const { phase, tool, intake, query } = body

  try {
    const result = await generateContent(phase, tool, intake, query)
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) }
  } catch (err) {
    if (err.status === 429) {
      return { statusCode: 429, headers: CORS_HEADERS, body: JSON.stringify({ error: 'rate_limited' }) }
    }
    console.error('Generation error:', err)
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'generation_failed' }) }
  }
}

async function generateContent(phase, tool, intake, query) {
  const { getSystemPrompt } = require('./personas-node')
  const { filterSessionsForPersona, filterExhibitorsForPersona } = require('./dataFilter-node')

  const sessions = require('../../public/data/sessions.json')
  const speakers = require('../../public/data/speakers.json')
  const exhibitors = require('../../public/data/exhibitors.json')
  const agendaMeta = require('../../public/data/agenda-meta.json')

  const filteredSessions = filterSessionsForPersona(sessions, intake.persona)
  const filteredExhibitors = filterExhibitorsForPersona(exhibitors, intake.persona)

  const systemPrompt = getSystemPrompt(intake.persona)
  const userPrompt = buildPrompt(phase, tool, intake, query, {
    sessions: filteredSessions, speakers, exhibitors: filteredExhibitors, agendaMeta
  })

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  let result
  try {
    result = await model.generateContent(userPrompt)
  } catch (err) {
    if (err.status === 429) throw err
    // Retry once with explicit JSON reminder
    result = await model.generateContent(userPrompt + '\n\nIMPORTANT: Your response must be valid JSON only. No markdown, no code blocks.')
  }

  return JSON.parse(result.response.text())
}

function buildPrompt(phase, tool, intake, query, data) {
  const intakeStr = JSON.stringify(intake, null, 2)
  const dataStr = JSON.stringify(data, null, 2)

  if (phase === '1' || phase === 1) {
    return `
USER PROFILE:
${intakeStr}

CONFERENCE DATA (filtered for your persona):
${dataStr}

Generate a complete personalized HDW 2026 playbook for this user. Return a JSON object with exactly these keys:

- "brief": string (3 sentences — what this conference should accomplish for this specific person)
- "sessions": array of 8-10 objects, each: { title, date, startTime, endTime, room, whyForYou, prepQuestion, skipIf }
- "skipList": array of 4-6 objects, each: { sessionType, reason }
- "boothStrategy": { "tier1": array of 5-8 { company, boothNumber, whatTheyDo, whyRelevant, questionToAsk }, "tier2": array of 5-10 { company, boothNumber, whatTheyDo }, "tier3": string (category-level guidance) }
- "networkingTargets": { "speakers": array of 5-8 { name, company, role, whyRelevant, conversationOpener }, "companyTypes": array of 3-5 strings, "valueProp": string (1 sentence intro tuned to their persona and goals) }
- "schedule": { "day1": array of { time, activity, type, notes }, "day2": array of { time, activity, type, notes } }
- "conversationStarters": array of 5-6 { scenario, opener } where scenario is one of: cold-retailer, evaluating-vendor, reconnecting, breaking-into-group, post-session-speaker
- "linkedInDraft": string (150-200 word LinkedIn post announcing attendance, written in their voice)

Be specific. Connect every recommendation to their stated problem and goals. Do not give generic advice.`
  }

  const toolPrompts = {
    sessionDebrief: `User just attended: "${query.sessionTitle}". Based on their profile (${intake.oneProblem}), return JSON: { "takeaways": [3 strings], "conversationStarters": [3 strings], "linkedInInsight": string }`,
    peopleLookup: `User is looking up: "${query.nameOrCompany}". Cross-reference conference data. Return JSON: { "who": string, "whyAtHDW": string, "whatTheyDo": string, "conversationAngle": string }`,
    boothScan: `User is at booth: "${query.boothNumberOrCompany}". Cross-reference exhibitor data. Return JSON: { "whatTheyDo": string, "tier": "1"|"2"|"3", "tierReason": string, "questionToAsk": string }`,
    conflictResolver: `User has a conflict between: "${query.sessionA}" and "${query.sessionB}". Return JSON: { "recommendation": "A"|"B", "reason": string, "alternativeIfMissed": string }`,
    followUpEmail: `Generate a follow-up email for: ${JSON.stringify(query)}. Return JSON: { "subject": string, "body": string }`,
    linkedInRecap: `Generate a LinkedIn recap post. Observations: ${JSON.stringify(query.observations)}. Honest take: "${query.honestTake}". Return JSON: { "post": string }`,
  }

  return `USER PROFILE:\n${intakeStr}\n\nCONFERENCE DATA:\n${dataStr}\n\n${toolPrompts[tool] || 'Return { "error": "unknown_tool" }'}`
}
```

- [ ] **Step 2: Create `netlify/functions/personas-node.js`** (CJS copy of lib logic for function context)

```js
const SYSTEM_PROMPTS = {
  'retailer-shipper': `You are a strategic conference advisor for a retail/shipper executive at Home Delivery World 2026 in Nashville (May 20-21). This person sits on the buying side — they manage or buy last-mile delivery. They are surrounded by vendors at this conference. Their job is to solve operational problems, not sell. Their time is scarce and valuable.

Retailer/Shipper playbooks must: prioritize sessions with operational substance over vendor panels; identify technology providers that solve their stated problem with specificity; focus networking on peers at similar companies who have solved similar problems; and be brutally honest about which exhibitors are relevant vs. noise.

Every recommendation must connect explicitly to the user's stated problem and goals. Do not give generic advice. If a session doesn't apply to their stated problem, don't recommend it.`,

  'carrier-3pl': `You are a strategic conference advisor for a carrier or 3PL leader at Home Delivery World 2026 in Nashville (May 20-21). This person operates delivery networks — they are who retailers hire. At HDW, they are simultaneously prospecting for retail clients, evaluating technology to improve operations, and sizing up competitors.

Carrier/3PL playbooks must: balance time between retailer prospect conversations and technology evaluation; identify retailers attending who match their service profile; flag technology sessions that address their operational pain points; and position them as a credible operator, not just a vendor.`,

  'tech-vendor': `You are a strategic conference advisor for a technology vendor at Home Delivery World 2026 in Nashville (May 20-21). This person is selling or building software/platforms for the logistics industry. At HDW they are primarily there to generate pipeline and competitive intelligence.

Tech vendor playbooks must: be explicit that their time is best spent on the floor and in 1:1 conversations, not in sessions; identify the highest-value retail/carrier prospects to target by company type; suggest conversation openers that start with the buyer's problem, not the vendor's product; and flag competitor presence to monitor.`,

  'startup-investor': `You are a strategic conference advisor for a startup founder or investor at Home Delivery World 2026 in Nashville (May 20-21). This person is either building in last-mile logistics or looking for what to invest in.

Startup/Investor playbooks must: prioritize conversations with operators who experience the problem they care about; identify sessions that give signal on which problems are unsolved vs. commoditized; suggest positioning that emphasizes the problem they care about, not their product; and identify which operators and investors are worth targeting.`,

  'operator-advisor': `You are a strategic conference advisor for a senior operator-advisor at Home Delivery World 2026 in Nashville (May 20-21). This person has deep operating experience and is now advising, building, or investing.

Operator-Advisor playbooks must: maximize their positioning as a trusted voice; identify thought leadership opportunities; prioritize conversations that could lead to advisory relationships, investments, or business development; and help them define what they want to be known for after the conference.`,
}

const PERSONA_TAGS = {
  'retailer-shipper': ['retail', 'last-mile', 'technology', 'routing', 'tms', 'visibility', 'returns', 'big-bulky', 'keynote'],
  'carrier-3pl': ['carrier', '3pl', 'last-mile', 'routing', 'big-bulky', 'technology', 'keynote'],
  'tech-vendor': ['technology', 'routing', 'tms', 'visibility', 'retail', 'carrier', 'keynote'],
  'startup-investor': ['startup', 'technology', 'last-mile', 'keynote', 'panel'],
  'operator-advisor': ['last-mile', 'technology', 'retail', 'carrier', 'startup', 'keynote', 'panel'],
}

module.exports.getSystemPrompt = (id) => SYSTEM_PROMPTS[id] ?? SYSTEM_PROMPTS['operator-advisor']
module.exports.PERSONA_TAGS = PERSONA_TAGS
```

- [ ] **Step 3: Create `netlify/functions/dataFilter-node.js`**

```js
const { PERSONA_TAGS } = require('./personas-node')

module.exports.filterSessionsForPersona = (sessions, personaId) => {
  const tags = PERSONA_TAGS[personaId] ?? []
  const keynotes = sessions.filter(s => s.tags?.includes('keynote'))
  const rest = sessions.filter(s => !s.tags?.includes('keynote') && s.tags?.some(t => tags.includes(t)))
  return [...keynotes, ...rest].slice(0, 30)
}

module.exports.filterExhibitorsForPersona = (exhibitors, personaId) => {
  const tags = PERSONA_TAGS[personaId] ?? []
  return exhibitors.filter(e => e.categories?.some(c => tags.includes(c))).slice(0, 50)
}
```

- [ ] **Step 4: Add `@google/generative-ai` to function deps**

In `package.json`, confirm `@google/generative-ai` is in `dependencies` (not devDependencies). Netlify bundles function dependencies automatically.

**Note on JSON data paths:** The `require('../../public/data/sessions.json')` paths in `generate.js` resolve correctly because Netlify's esbuild bundler resolves from the repo root. `netlify/functions/generate.js` going `../../public/data/` reaches `public/data/` at repo root. This is confirmed by Netlify's bundling behavior. No copy step needed, but if you see "Cannot find module" errors in production, add a `prebuild` npm script to copy the data files: `"prebuild": "cp -r public/data netlify/functions/data"` and update require paths to `./data/sessions.json`.

- [ ] **Step 5: Set up local `.env` file for development**

Create `.env` at project root (do NOT commit):
```
GEMINI_API_KEY=your_key_here
```

Add `.env` to `.gitignore`.

- [ ] **Step 6: Test function locally with `netlify dev`**

```bash
npm install -g netlify-cli   # if not already installed
netlify dev
```

In a separate terminal, test the function:
```bash
curl -X POST http://localhost:8888/api/generate \
  -H "Content-Type: application/json" \
  -d '{"phase":1,"tool":"playbook","intake":{"name":"Test","company":"Acme","role":"VP Supply Chain","persona":"retailer-shipper","oneProblem":"Testing FADR","goals":["find-tech"]}}'
```
Expected: JSON response with `brief`, `sessions`, etc. keys (or a Gemini API key error if key not yet set — that's fine, function routing works).

- [ ] **Step 7: Commit**

```bash
git add netlify/ .gitignore
git commit -m "feat: Netlify Function — Gemini proxy for all phases"
```

---

### Task 11: GeneratingState + API call

**Files:**
- Create: `src/components/phase1/GeneratingState.jsx`
- Create: `src/lib/api.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/lib/api.js`**

```js
export async function generatePlaybook(intake) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase: 1, tool: 'playbook', intake }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'generation_failed')
  }
  return res.json()
}

export async function callTool(tool, intake, query) {
  const phase = ['sessionDebrief', 'peopleLookup', 'boothScan', 'conflictResolver'].includes(tool) ? 2 : 3
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, tool, intake, query }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'generation_failed')
  }
  return res.json()
}
```

- [ ] **Step 2: Create `src/components/phase1/GeneratingState.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { loadIntake } from '../../lib/storage'
import { generatePlaybook } from '../../lib/api'

const MESSAGES = [
  'Analyzing your goals...',
  'Scanning 100+ sessions...',
  'Mapping the exhibit hall...',
  'Identifying your targets...',
  'Building your schedule...',
  'Writing your playbook...',
]

export default function GeneratingState({ onComplete, onError }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 3000)

    const intake = loadIntake()
    generatePlaybook(intake)
      .then(data => { clearInterval(interval); onComplete(data) })
      .catch(err => { clearInterval(interval); onError(err.message) })

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
        <p className="text-xl font-medium text-white mb-2">{MESSAGES[msgIndex]}</p>
        <p className="text-gray-500 text-sm">Usually takes 15–25 seconds</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire GeneratingState into App.jsx**

Replace the stub GeneratingWrapper in `src/App.jsx` with:
```jsx
import GeneratingState from './components/phase1/GeneratingState'
// ...
{view === 'generating' && (
  <GeneratingState
    onComplete={(data) => { setPlaybook(data); setView('playbook') }}
    onError={(errMsg) => {
      setErrorMsg(errMsg)
      setView('intake')
    }}
  />
)}
```

Add `const [errorMsg, setErrorMsg] = useState(null)` to App state, and show an error banner in the intake view when `errorMsg` is set.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.js src/components/phase1/GeneratingState.jsx src/App.jsx
git commit -m "feat: playbook generation — API client and loading state"
```

---

### Task 12: Playbook output — shell + 8 modules

**Files:**
- Create: `src/components/phase1/Playbook.jsx`
- Create: all 8 files in `src/components/phase1/modules/`

- [ ] **Step 1: Create `src/components/phase1/Playbook.jsx`**

```jsx
import { useRef } from 'react'
import ConferenceBrief from './modules/ConferenceBrief'
import PrioritySessions from './modules/PrioritySessions'
import SkipList from './modules/SkipList'
import BoothStrategy from './modules/BoothStrategy'
import NetworkingTargets from './modules/NetworkingTargets'
import DayByDaySchedule from './modules/DayByDaySchedule'
import ConversationStarters from './modules/ConversationStarters'
import LinkedInDraft from './modules/LinkedInDraft'
import { exportToPDF } from '../../lib/pdfExport'

const NAV = [
  { id: 'brief', label: '📋 Brief' },
  { id: 'sessions', label: '🗓️ Sessions' },
  { id: 'skip', label: '🚫 Skip' },
  { id: 'booths', label: '🏢 Booths' },
  { id: 'networking', label: '🤝 Networking' },
  { id: 'schedule', label: '📅 Schedule' },
  { id: 'starters', label: '💬 Starters' },
  { id: 'linkedin', label: '🔗 LinkedIn' },
]

export default function Playbook({ data, onReset }) {
  const moduleRefs = useRef({})

  const scrollTo = (id) => moduleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleExport = () => exportToPDF(moduleRefs.current)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur pb-4 mb-8 -mx-6 px-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Your HDW Playbook</h1>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              ↓ PDF
            </button>
            <button onClick={onReset} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              ↺ Reset
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {NAV.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)}
              className="whitespace-nowrap px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-12">
        <div ref={el => moduleRefs.current.brief = el}><ConferenceBrief brief={data.brief} /></div>
        <div ref={el => moduleRefs.current.sessions = el}><PrioritySessions sessions={data.sessions} /></div>
        <div ref={el => moduleRefs.current.skip = el}><SkipList skipList={data.skipList} /></div>
        <div ref={el => moduleRefs.current.booths = el}><BoothStrategy boothStrategy={data.boothStrategy} /></div>
        <div ref={el => moduleRefs.current.networking = el}><NetworkingTargets networkingTargets={data.networkingTargets} /></div>
        <div ref={el => moduleRefs.current.schedule = el}><DayByDaySchedule schedule={data.schedule} /></div>
        <div ref={el => moduleRefs.current.starters = el}><ConversationStarters conversationStarters={data.conversationStarters} /></div>
        <div ref={el => moduleRefs.current.linkedin = el}><LinkedInDraft linkedInDraft={data.linkedInDraft} /></div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2a: Create modules 1–4** (ConferenceBrief, PrioritySessions, SkipList, BoothStrategy — code below)

Create `src/components/phase1/modules/ConferenceBrief.jsx`:
```jsx
export default function ConferenceBrief({ brief }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">📋 Your Conference Brief</h2>
      <p className="text-lg text-gray-300 leading-relaxed bg-gray-900 rounded-xl p-6 border border-gray-800">{brief}</p>
    </section>
  )
}
```

Create `src/components/phase1/modules/PrioritySessions.jsx`:
```jsx
export default function PrioritySessions({ sessions }) {
  const byDay = sessions.reduce((acc, s) => {
    const d = s.date || 'Day 1'
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {})

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">🗓️ Priority Sessions</h2>
      {Object.entries(byDay).map(([day, daySessions]) => (
        <div key={day} className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-orange-400 font-semibold mb-4">{day}</h3>
          <div className="space-y-4">
            {daySessions.map((s, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-semibold text-white">{s.title}</h4>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{s.startTime} · {s.room}</span>
                </div>
                <p className="text-sm text-green-400 mb-2">↳ {s.whyForYou}</p>
                <p className="text-sm text-gray-400 mb-2"><span className="text-gray-500">Ask:</span> {s.prepQuestion}</p>
                <p className="text-xs text-gray-600"><span className="text-gray-500">Skip if:</span> {s.skipIf}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
```

Create `src/components/phase1/modules/SkipList.jsx`:
```jsx
export default function SkipList({ skipList }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">🚫 Honest Skip List</h2>
      <p className="text-sm text-gray-400 mb-4">Sessions that sound relevant but historically underdeliver for your persona.</p>
      <div className="space-y-3">
        {skipList.map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h4 className="font-semibold text-white mb-1">{item.sessionType}</h4>
            <p className="text-sm text-gray-400">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Create `src/components/phase1/modules/BoothStrategy.jsx`:
```jsx
export default function BoothStrategy({ boothStrategy }) {
  const { tier1, tier2, tier3 } = boothStrategy
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">🏢 Booth Strategy</h2>

      <h3 className="text-sm uppercase tracking-widest text-orange-400 font-semibold mb-3">Tier 1 — Must Visit</h3>
      <div className="space-y-3 mb-8">
        {tier1.map((b, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{b.company}</h4>
              {b.boothNumber && <span className="text-xs text-gray-500">Booth {b.boothNumber}</span>}
            </div>
            <p className="text-sm text-gray-400 mb-2">{b.whatTheyDo}</p>
            <p className="text-sm text-green-400 mb-2">↳ {b.whyRelevant}</p>
            <p className="text-sm text-gray-300"><span className="text-gray-500">Ask:</span> {b.questionToAsk}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-3">Tier 2 — If Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {tier2.map((b, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h4 className="font-semibold text-sm mb-1">{b.company}</h4>
            {b.boothNumber && <p className="text-xs text-gray-500 mb-1">Booth {b.boothNumber}</p>}
            <p className="text-xs text-gray-400">{b.whatTheyDo}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-widest text-gray-600 font-semibold mb-2">Tier 3 — Skip</h3>
      <p className="text-sm text-gray-500 bg-gray-900 rounded-xl p-4 border border-gray-800">{tier3}</p>
    </section>
  )
}
```

Create `src/components/phase1/modules/NetworkingTargets.jsx`:
```jsx
export default function NetworkingTargets({ networkingTargets }) {
  const { speakers, companyTypes, valueProp } = networkingTargets
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">🤝 Networking Targets</h2>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
        <p className="text-xs text-orange-400 uppercase tracking-widest mb-1">Your value prop at this conference</p>
        <p className="text-white font-medium">{valueProp}</p>
      </div>

      <h3 className="text-sm uppercase tracking-widest text-orange-400 font-semibold mb-3">Priority Speakers to Find</h3>
      <div className="space-y-3 mb-6">
        {speakers.map((s, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="mb-2">
              <span className="font-semibold">{s.name}</span>
              <span className="text-gray-400 text-sm"> · {s.role}, {s.company}</span>
            </div>
            <p className="text-sm text-green-400 mb-2">↳ {s.whyRelevant}</p>
            <p className="text-sm text-gray-300"><span className="text-gray-500">Opener:</span> {s.conversationOpener}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-3">Company Types to Seek Out</h3>
      <ul className="space-y-2">
        {companyTypes.map((c, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-orange-500 mt-0.5">→</span> {c}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Create `src/components/phase1/modules/DayByDaySchedule.jsx`:
```jsx
const TYPE_COLORS = {
  session: 'border-l-blue-500',
  booth: 'border-l-orange-500',
  networking: 'border-l-green-500',
  meal: 'border-l-yellow-500',
  flex: 'border-l-gray-500',
}

export default function DayByDaySchedule({ schedule }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">📅 Day-by-Day Schedule</h2>
      {['day1', 'day2'].map((day, di) => (
        <div key={day} className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-orange-400 font-semibold mb-4">
            {di === 0 ? 'May 20 — Day 1' : 'May 21 — Day 2'}
          </h3>
          <div className="space-y-2">
            {(schedule[day] ?? []).map((item, i) => (
              <div key={i} className={`bg-gray-900 rounded-r-xl p-4 border-l-4 ${TYPE_COLORS[item.type] ?? 'border-l-gray-700'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-500 mr-2">{item.time}</span>
                    <span className="text-sm font-medium">{item.activity}</span>
                    {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
```

Create `src/components/phase1/modules/ConversationStarters.jsx`:
```jsx
const SCENARIO_LABELS = {
  'cold-retailer': 'Cold approach — retailer',
  'evaluating-vendor': 'Opening with a vendor you\'re evaluating',
  'reconnecting': 'Reconnecting with someone you know',
  'breaking-into-group': 'Breaking into a group conversation',
  'post-session-speaker': 'Cold approach to a speaker after their session',
}

export default function ConversationStarters({ conversationStarters }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">💬 Conversation Starters</h2>
      <div className="space-y-4">
        {conversationStarters.map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              {SCENARIO_LABELS[item.scenario] ?? item.scenario}
            </p>
            <p className="text-white">{item.opener}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2b: Run dev server and verify first 4 modules render with mock data**

```bash
npm run dev
```
Temporarily wire up mock playbook data (see Step 3 below) and verify these 4 modules render without errors before continuing.

- [ ] **Step 2c: Create modules 5–8** (NetworkingTargets, DayByDaySchedule, ConversationStarters, LinkedInDraft — code below)

Create `src/components/phase1/modules/LinkedInDraft.jsx`:
```jsx
import { useState } from 'react'

export default function LinkedInDraft({ linkedInDraft }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(linkedInDraft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">🔗 Pre-Conference LinkedIn Post</h2>
      <p className="text-sm text-gray-400 mb-4">Written in your voice. Edit before posting.</p>
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 relative">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{linkedInDraft}</pre>
        <button
          onClick={copy}
          className="mt-4 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy to clipboard'}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run dev server and verify playbook renders with mock data**

In `App.jsx`, temporarily set initial state to show playbook with mock data:
```jsx
const [view, setView] = useState('playbook')
const [playbook, setPlaybook] = useState({
  brief: "Test brief paragraph.",
  sessions: [{ title: "Test Session", date: "2026-05-20", startTime: "10:00", room: "Hall A", whyForYou: "Relevant", prepQuestion: "What's your FADR?", skipIf: "Not applicable" }],
  skipList: [{ sessionType: "Vendor panels", reason: "Usually pitch-heavy." }],
  boothStrategy: { tier1: [{ company: "Test Co", boothNumber: "100", whatTheyDo: "Routing", whyRelevant: "Matches your TMS need", questionToAsk: "What's your uptime SLA?" }], tier2: [], tier3: "Skip IoT companies." },
  networkingTargets: { speakers: [{ name: "Jane Doe", company: "Acme", role: "VP Ops", whyRelevant: "Solved FADR", conversationOpener: "Loved your talk on..." }], companyTypes: ["Mid-size 3PLs"], valueProp: "VP Supply Chain solving FADR at scale." },
  schedule: { day1: [{ time: "09:00", activity: "Keynote", type: "session", notes: "" }], day2: [] },
  conversationStarters: [{ scenario: "cold-retailer", opener: "Hey, are you focused on last-mile at your company?" }],
  linkedInDraft: "Heading to HDW next week...",
})
```

Verify all modules render without errors. Remove mock data after verification.

- [ ] **Step 4: Commit**

```bash
git add src/components/phase1/
git commit -m "feat: Playbook output — shell + all 8 modules"
```

---

## Chunk 5: PDF Export + Phase 2 Tools

### Task 13: PDF export

**Files:**
- Create: `src/lib/pdfExport.js`

- [ ] **Step 1: Implement `src/lib/pdfExport.js`**

```js
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportToPDF(moduleRefs) {
  const pdf = new jsPDF({ unit: 'px', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const moduleOrder = ['brief', 'sessions', 'skip', 'booths', 'networking', 'schedule', 'starters', 'linkedin']
  let firstPage = true

  for (const key of moduleOrder) {
    const el = moduleRefs[key]
    if (!el) continue

    const canvas = await html2canvas(el, {
      backgroundColor: '#030712',
      scale: 1.5,
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.85)
    const imgWidth = pageWidth - 40
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (!firstPage) pdf.addPage()
    firstPage = false

    // Paginate tall modules
    let yOffset = 0
    while (yOffset < imgHeight) {
      if (yOffset > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 20, 20 - yOffset, imgWidth, imgHeight)
      yOffset += pageHeight - 40
    }
  }

  pdf.save('HDW-2026-Playbook.pdf')
}
```

- [ ] **Step 2: Test PDF export manually**

Run dev server, generate a playbook (or use mock data), click "↓ PDF". Verify a multi-page PDF downloads with all 8 modules.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdfExport.js
git commit -m "feat: PDF export — all 8 modules as multi-page PDF"
```

---

### Task 14: Phase 2 — On-Floor tools

**Files:**
- Create: `src/components/phase2/OnFloorAssistant.jsx`, `SessionDebrief.jsx`, `PeopleLookup.jsx`, `BoothScan.jsx`, `ConflictResolver.jsx`

- [ ] **Step 1: Create `src/components/phase2/OnFloorAssistant.jsx`**

```jsx
import { useState } from 'react'
import SessionDebrief from './SessionDebrief'
import PeopleLookup from './PeopleLookup'
import BoothScan from './BoothScan'
import ConflictResolver from './ConflictResolver'
import { loadIntake } from '../../lib/storage'

const TOOLS = [
  { id: 'sessionDebrief', emoji: '🎤', label: 'Session Debrief', desc: 'Turn a session into talking points' },
  { id: 'peopleLookup', emoji: '🔍', label: 'People Lookup', desc: 'Find out who someone is and why they matter' },
  { id: 'boothScan', emoji: '🏢', label: 'Booth Scan', desc: 'Is this booth worth your time?' },
  { id: 'conflictResolver', emoji: '⚡', label: 'Conflict Resolver', desc: 'Two sessions at the same time — which one?' },
]

export default function OnFloorAssistant({ onBack }) {
  const [activeTool, setActiveTool] = useState(null)
  const intake = loadIntake()

  if (!intake) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-400 mb-4">Complete the pre-conference playbook first to use on-floor tools.</p>
        <button onClick={onBack} className="text-orange-400 underline">← Back</button>
      </div>
    )
  }

  const ToolComponents = { sessionDebrief: SessionDebrief, peopleLookup: PeopleLookup, boothScan: BoothScan, conflictResolver: ConflictResolver }
  const ActiveTool = activeTool ? ToolComponents[activeTool] : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={activeTool ? () => setActiveTool(null) : onBack} className="text-gray-400 hover:text-white">←</button>
        <h1 className="text-2xl font-bold">On The Floor</h1>
      </div>

      {!activeTool && (
        <div className="grid grid-cols-1 gap-3">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)}
              className="text-left p-5 rounded-xl border border-gray-700 bg-gray-900 hover:border-orange-500 transition-all">
              <span className="text-2xl mr-3">{t.emoji}</span>
              <span className="font-semibold">{t.label}</span>
              <p className="text-sm text-gray-400 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {ActiveTool && <ActiveTool intake={intake} onBack={() => setActiveTool(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Create the 4 tool components** — each follows this pattern: input form → call `callTool()` → display result.

Create `src/components/phase2/SessionDebrief.jsx`:
```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

export default function SessionDebrief({ intake, onBack }) {
  const [sessionTitle, setSessionTitle] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const data = await callTool('sessionDebrief', intake, { sessionTitle })
      setResult(data)
    } catch (e) {
      setError(e.message === 'rate_limited' ? "We're getting a lot of requests right now — try again in a few minutes." : "Something went wrong. Try again.")
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">🎤 Session Debrief</h2>
      {!result ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Session you just attended</label>
          <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)}
            placeholder="e.g. The Future of Last-Mile Delivery"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-4" />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={submit} disabled={!sessionTitle || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Generating...' : 'Get Talking Points →'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div><h3 className="text-sm uppercase tracking-widest text-orange-400 mb-3">Key Takeaways</h3>
            {result.takeaways.map((t, i) => <p key={i} className="text-sm text-gray-300 mb-2">→ {t}</p>)}</div>
          <div><h3 className="text-sm uppercase tracking-widest text-orange-400 mb-3">Conversation Starters</h3>
            {result.conversationStarters.map((t, i) => <p key={i} className="text-sm text-gray-300 bg-gray-900 rounded-lg p-3 mb-2">{t}</p>)}</div>
          <div><h3 className="text-sm uppercase tracking-widest text-orange-400 mb-3">LinkedIn Insight</h3>
            <p className="text-sm text-gray-300 bg-gray-900 rounded-lg p-3">{result.linkedInInsight}</p></div>
          <button onClick={() => setResult(null)} className="text-sm text-gray-400 underline">← Try another session</button>
        </div>
      )}
    </div>
  )
}
```

Create `src/components/phase2/PeopleLookup.jsx`:
```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

export default function PeopleLookup({ intake, onBack }) {
  const [nameOrCompany, setNameOrCompany] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try { setResult(await callTool('peopleLookup', intake, { nameOrCompany })) }
    catch (e) { setError(e.message === 'rate_limited' ? "Too many requests — try again in a few minutes." : "Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">🔍 People Lookup</h2>
      {!result ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name or company</label>
          <input value={nameOrCompany} onChange={e => setNameOrCompany(e.target.value)}
            placeholder="e.g. Jane Smith or Acme Logistics"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-4" />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={submit} disabled={!nameOrCompany || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Looking up...' : 'Look Up →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Who they are</p>
            <p className="text-white font-medium mb-3">{result.who}</p>
            <p className="text-xs text-gray-500 mb-1">Why at HDW</p>
            <p className="text-sm text-gray-300 mb-3">{result.whyAtHDW}</p>
            <p className="text-xs text-gray-500 mb-1">What they do</p>
            <p className="text-sm text-gray-300 mb-3">{result.whatTheyDo}</p>
            <p className="text-xs text-orange-400 mb-1">Conversation angle for you</p>
            <p className="text-sm text-white">{result.conversationAngle}</p>
          </div>
          <button onClick={() => setResult(null)} className="text-sm text-gray-400 underline">← Look up someone else</button>
        </div>
      )}
    </div>
  )
}
```

Create `src/components/phase2/BoothScan.jsx`:
```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

const TIER_STYLES = { '1': 'bg-orange-500/20 text-orange-400 border-orange-500/40', '2': 'bg-blue-500/20 text-blue-400 border-blue-500/40', '3': 'bg-gray-700 text-gray-400 border-gray-600' }
const TIER_LABELS = { '1': 'Tier 1 — Must Visit', '2': 'Tier 2 — If Time', '3': 'Tier 3 — Skip' }

export default function BoothScan({ intake, onBack }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try { setResult(await callTool('boothScan', intake, { boothNumberOrCompany: query })) }
    catch (e) { setError("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">🏢 Booth Scan</h2>
      {!result ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Booth number or company name</label>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="e.g. 342 or Acme Routing"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-4" />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={submit} disabled={!query || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Scanning...' : 'Scan Booth →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mb-4 ${TIER_STYLES[result.tier]}`}>
              {TIER_LABELS[result.tier]}
            </span>
            <p className="text-xs text-gray-500 mb-1">What they do</p>
            <p className="text-sm text-gray-300 mb-3">{result.whatTheyDo}</p>
            <p className="text-xs text-gray-500 mb-1">Why this tier for you</p>
            <p className="text-sm text-gray-300 mb-3">{result.tierReason}</p>
            <p className="text-xs text-orange-400 mb-1">Question to ask before you leave</p>
            <p className="text-sm text-white">{result.questionToAsk}</p>
          </div>
          <button onClick={() => setResult(null)} className="text-sm text-gray-400 underline">← Scan another booth</button>
        </div>
      )}
    </div>
  )
}
```

Create `src/components/phase2/ConflictResolver.jsx`:
```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

export default function ConflictResolver({ intake, onBack }) {
  const [sessionA, setSessionA] = useState('')
  const [sessionB, setSessionB] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try { setResult(await callTool('conflictResolver', intake, { sessionA, sessionB })) }
    catch (e) { setError("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  const valid = sessionA.trim() && sessionB.trim()

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">⚡ Conflict Resolver</h2>
      {!result ? (
        <div className="space-y-4">
          {[['Session A', sessionA, setSessionA], ['Session B', sessionB, setSessionB]].map(([label, val, set]) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <input value={val} onChange={e => set(e.target.value)}
                placeholder="Session title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={!valid || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Deciding...' : 'Resolve Conflict →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="text-2xl font-bold text-orange-400 mb-2">
              Go to: {result.recommendation === 'A' ? sessionA : sessionB}
            </div>
            <p className="text-sm text-gray-300 mb-4">{result.reason}</p>
            <p className="text-xs text-gray-500 mb-1">If you miss it</p>
            <p className="text-sm text-gray-400">{result.alternativeIfMissed}</p>
          </div>
          <button onClick={() => { setResult(null); setSessionA(''); setSessionB('') }} className="text-sm text-gray-400 underline">← Resolve another conflict</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run dev server, test Phase 2 tool flow**

Verify the tool selector renders, each tool shows input form, and result renders (test with Netlify dev or mock response).

- [ ] **Step 4: Commit**

```bash
git add src/components/phase2/
git commit -m "feat: Phase 2 on-floor tools — all 4 tools"
```

---

## Chunk 6: Phase 3 + Deployment

### Task 15: Phase 3 — Post-conference tools

**Files:**
- Create: `src/components/phase3/PostConference.jsx`, `FollowUpEmail.jsx`, `LinkedInRecap.jsx`, `ConnectionsTracker.jsx`

- [ ] **Step 1: Create `src/components/phase3/PostConference.jsx`**

```jsx
import { useState } from 'react'
import FollowUpEmail from './FollowUpEmail'
import LinkedInRecap from './LinkedInRecap'
import ConnectionsTracker from './ConnectionsTracker'
import { loadIntake } from '../../lib/storage'

const TOOLS = [
  { id: 'followUpEmail', emoji: '📧', label: 'Follow-Up Email', desc: 'Write a clean, un-cringe follow-up for anyone you met' },
  { id: 'linkedInRecap', emoji: '✍️', label: 'LinkedIn Recap', desc: 'Conference hot-takes post written in your voice' },
  { id: 'connections', emoji: '📇', label: 'Connections Tracker', desc: 'Log who you met and track follow-up status' },
]

export default function PostConference({ onBack }) {
  const [activeTool, setActiveTool] = useState(null)
  const intake = loadIntake()

  const ToolComponents = { followUpEmail: FollowUpEmail, linkedInRecap: LinkedInRecap, connections: ConnectionsTracker }
  const ActiveTool = activeTool ? ToolComponents[activeTool] : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={activeTool ? () => setActiveTool(null) : onBack} className="text-gray-400 hover:text-white">←</button>
        <h1 className="text-2xl font-bold">Post-Conference</h1>
      </div>

      {!activeTool && (
        <div className="grid grid-cols-1 gap-3">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)}
              className="text-left p-5 rounded-xl border border-gray-700 bg-gray-900 hover:border-orange-500 transition-all">
              <span className="text-2xl mr-3">{t.emoji}</span>
              <span className="font-semibold">{t.label}</span>
              <p className="text-sm text-gray-400 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {ActiveTool && (
        <ActiveTool
          intake={intake}
          onBack={() => setActiveTool(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/phase3/FollowUpEmail.jsx`**

Inputs: name, company, role, what you discussed (textarea), desired next step (dropdown: demo, call, intro, coffee, no ask yet). Calls `callTool('followUpEmail', intake, query)`. Displays subject + body with copy buttons.

```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

const NEXT_STEPS = ['Schedule a demo', 'Get on a call', 'Make an intro', 'Grab coffee', 'No ask yet — just staying warm']

export default function FollowUpEmail({ intake, onBack }) {
  const [form, setForm] = useState({ name: '', company: '', role: '', whatDiscussed: '', desiredNextStep: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name && form.whatDiscussed && form.desiredNextStep

  const submit = async () => {
    setLoading(true); setError(null)
    try { setResult(await callTool('followUpEmail', intake, form)) }
    catch (e) { setError('Something went wrong. Try again.') }
    finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">📧 Follow-Up Email</h2>
      {!result ? (
        <div className="space-y-4">
          {[['name', 'Their name', 'Jane Smith'], ['company', 'Company', 'Acme Logistics'], ['role', 'Role (if known)', 'VP Operations']].map(([k, label, ph]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
              <input value={form[k]} onChange={e => update(k, e.target.value)} placeholder={ph}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">What you talked about</label>
            <textarea value={form.whatDiscussed} onChange={e => update('whatDiscussed', e.target.value)} rows={3}
              placeholder="We discussed their FADR challenges on furniture delivery and I mentioned our carrier network..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Desired next step</label>
            <select value={form.desiredNextStep} onChange={e => update('desiredNextStep', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
              <option value="">Select...</option>
              {NEXT_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={!valid || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Writing...' : 'Write Email →'}
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-4">
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="font-medium mb-4">{result.subject}</p>
            <p className="text-xs text-gray-500 mb-1">Body</p>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{result.body}</pre>
          </div>
          <button onClick={copy} className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium mb-3 transition-colors">
            {copied ? '✓ Copied!' : 'Copy Email'}
          </button>
          <button onClick={() => setResult(null)} className="text-sm text-gray-400 underline">← Write another</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/phase3/LinkedInRecap.jsx`**

```jsx
import { useState } from 'react'
import { callTool } from '../../lib/api'

export default function LinkedInRecap({ intake, onBack }) {
  const [observations, setObservations] = useState(['', '', ''])
  const [honestTake, setHonestTake] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const updateObs = (i, val) => {
    const updated = [...observations]
    updated[i] = val
    setObservations(updated)
  }
  const addObs = () => observations.length < 5 && setObservations([...observations, ''])
  const valid = observations.filter(o => o.trim()).length >= 3 && honestTake.trim()

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      setResult(await callTool('linkedInRecap', intake, {
        observations: observations.filter(o => o.trim()),
        honestTake,
      }))
    } catch (e) { setError("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(result.post)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">✍️ LinkedIn Recap</h2>
      {!result ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              3–5 things you saw, learned, or heard <span className="text-gray-500">(min 3)</span>
            </label>
            {observations.map((obs, i) => (
              <input key={i} value={obs} onChange={e => updateObs(i, e.target.value)}
                placeholder={`Observation ${i + 1}`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-2" />
            ))}
            {observations.length < 5 && (
              <button onClick={addObs} className="text-sm text-orange-400 underline">+ Add observation</button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your honest take on the event</label>
            <textarea value={honestTake} onChange={e => setHonestTake(e.target.value)} rows={3}
              placeholder="What was the real story? What surprised you? What disappointed you?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={!valid || loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-orange-400 transition-colors">
            {loading ? 'Writing...' : 'Write Recap Post →'}
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-4">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{result.post}</pre>
          </div>
          <button onClick={copy} className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium mb-3 transition-colors">
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
          <button onClick={() => setResult(null)} className="text-sm text-gray-400 underline">← Write a different version</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/phase3/ConnectionsTracker.jsx`**

Local state only — no API call. Stores connections in a separate localStorage key `hdw2026_connections`.

```jsx
import { useState, useEffect } from 'react'

const CONNECTIONS_KEY = 'hdw2026_connections'

const loadConnections = () => {
  try { return JSON.parse(localStorage.getItem(CONNECTIONS_KEY)) ?? [] } catch { return [] }
}
const saveConnections = (c) => localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(c))

export default function ConnectionsTracker({ onBack }) {
  const [connections, setConnections] = useState(loadConnections)
  const [form, setForm] = useState({ name: '', company: '', discussed: '', followUpStatus: 'pending' })
  const [adding, setAdding] = useState(false)

  const add = () => {
    const updated = [...connections, { ...form, id: Date.now() }]
    setConnections(updated); saveConnections(updated)
    setForm({ name: '', company: '', discussed: '', followUpStatus: 'pending' })
    setAdding(false)
  }

  const remove = (id) => {
    const updated = connections.filter(c => c.id !== id)
    setConnections(updated); saveConnections(updated)
  }

  const exportCSV = () => {
    const header = 'Name,Company,What Discussed,Follow-up Status'
    const rows = connections.map(c => `"${c.name}","${c.company}","${c.discussed}","${c.followUpStatus}"`)
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'hdw-connections.csv'; a.click()
  }

  const STATUS_COLORS = { pending: 'text-yellow-400', done: 'text-green-400', skip: 'text-gray-500' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">📇 Connections</h2>
        <div className="flex gap-2">
          {connections.length > 0 && (
            <button onClick={exportCSV} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg">↓ CSV</button>
          )}
          <button onClick={() => setAdding(true)} className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-400 rounded-lg">+ Add</button>
        </div>
      </div>

      {adding && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 mb-4 space-y-3">
          {[['name', 'Name'], ['company', 'Company']].map(([k, l]) => (
            <input key={k} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={l}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
          ))}
          <textarea value={form.discussed} onChange={e => setForm(f => ({ ...f, discussed: e.target.value }))}
            placeholder="What you discussed..." rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          <select value={form.followUpStatus} onChange={e => setForm(f => ({ ...f, followUpStatus: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="pending">Follow-up pending</option>
            <option value="done">Followed up</option>
            <option value="skip">No follow-up needed</option>
          </select>
          <div className="flex gap-2">
            <button onClick={add} disabled={!form.name} className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg text-sm font-medium disabled:opacity-40">Save</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {connections.length === 0 && !adding && (
        <p className="text-gray-500 text-sm text-center py-8">No connections logged yet. Add people as you meet them.</p>
      )}

      <div className="space-y-2">
        {connections.map(c => (
          <div key={c.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start justify-between gap-4">
            <div>
              <div className="font-medium text-sm">{c.name} <span className="text-gray-400">· {c.company}</span></div>
              {c.discussed && <p className="text-xs text-gray-500 mt-1">{c.discussed}</p>}
              <span className={`text-xs mt-1 block ${STATUS_COLORS[c.followUpStatus]}`}>{c.followUpStatus}</span>
            </div>
            <button onClick={() => remove(c.id)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/phase3/
git commit -m "feat: Phase 3 post-conference tools — email, LinkedIn recap, connections tracker"
```

---

### Task 17: Deploy to Netlify

- [ ] **Step 1: Push repo to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/hdw-playbook-generator.git
git push -u origin main
```

- [ ] **Step 2: Get Gemini API key**

Go to `https://aistudio.google.com` → Sign in with Google account → "Get API key" → Create API key → Copy it.

- [ ] **Step 3: Create Netlify site**

Go to `https://app.netlify.com` → "Add new site" → "Import an existing project" → Connect GitHub → Select the `hdw-playbook-generator` repo → Deploy settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Click "Deploy site".

- [ ] **Step 4: Set environment variable**

In Netlify site dashboard → Site configuration → Environment variables → Add variable:
- Key: `GEMINI_API_KEY`
- Value: (paste key from Step 2)

Trigger a redeploy after adding the variable.

- [ ] **Step 5: Verify production deployment**

Open the `*.netlify.app` URL. Complete the full intake flow end to end. Confirm playbook generates successfully. Test PDF download. Verify Phase 2 and 3 are locked until their unlock dates.

**If generation fails in production:** Check Netlify Function logs in the Netlify dashboard (Functions tab → generate → view logs). Most common causes: `GEMINI_API_KEY` env var not set, or JSON data files not found (see Task 10 Step 4 note on data paths). If data path errors occur, add `"prebuild": "cp -r public/data netlify/functions/data"` to package.json scripts and update require paths in `generate.js` to `./data/sessions.json` etc., then redeploy.

- [ ] **Step 6: Final commit + tag**

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

*Plan complete. All three phases, full data layer, Gemini integration, PDF export, and Netlify deployment.*
