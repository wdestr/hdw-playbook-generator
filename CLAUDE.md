# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

**HDW Playbook Generator** — an AI-powered conference intelligence tool for
**Home Delivery World USA 2026** (May 20–21, Nashville). It turns a ~3-minute
intake into a fully personalized conference "playbook" (priority sessions, an
honest skip list, tiered booth strategy, networking targets, a two-day
schedule, conversation starters, and a LinkedIn draft) and then supports the
attendee during and after the event.

The app is organized around **three phases**:

- **Phase 1 — Pre-Conference Playbook**: intake wizard → AI-generated playbook.
- **Phase 2 — On-Floor Assistant**: live tools (session debrief, people lookup,
  booth scan, conflict resolver).
- **Phase 3 — Post-Conference**: follow-up email + LinkedIn recap generators.

See `HDW-Playbook-Generator-PRD.md` for the full product spec, and
`docs/superpowers/` for the original design spec and build plan.

## Tech stack

- **Frontend**: React 18 + Vite 5, Tailwind CSS v4 (via `@tailwindcss/vite`).
- **PWA**: `vite-plugin-pwa` (Workbox), service worker registered in
  `src/main.jsx` with `registerType: 'prompt'` (never force-reloads).
- **Backend**: Netlify Functions (`netlify/functions/`), invoked from the
  client under the `/api/*` path (see redirect in `netlify.toml`).
- **AI**: Google Gemini (`@google/generative-ai`, model `gemini-1.5-flash`)
  inside `netlify/functions/generate.js`. Requires `GEMINI_API_KEY` env var.
- **Persistence**: Netlify Blobs (`@netlify/blobs`) for shareable saved
  playbooks. Browser `localStorage` for the user's own intake.
- **PDF export**: `jspdf` + `html2canvas` (lazy-imported in
  `src/lib/pdfExport.js`).
- **Tests**: Vitest + Testing Library (`happy-dom` environment).
- **Hosting**: Netlify (`netlify.toml`).

> Note: `@supabase/supabase-js` is listed in `package.json` for historical
> reasons but is **not** used by the live code path — playbook persistence goes
> through the Netlify Functions (`/api/save-playbook`, `/api/get-playbook`) in
> `src/lib/playbookApi.js`.

## Commands

```bash
npm install            # install deps
npm run dev            # Vite dev server (port 5173)
npm run build          # production build to dist/
npm run preview        # preview the production build
npm run lint           # ESLint over the repo
npm test               # run vitest once (CI mode)
npm run test:watch     # vitest in watch mode
```

For full-stack local dev (so `/api/*` functions work), run via the Netlify CLI
(`netlify dev`) rather than `npm run dev` alone — `vite` does not serve the
functions. Set `GEMINI_API_KEY` in your environment / `.env` (gitignored).

## Project structure

```
index.html                 # Vite entry
vite.config.js             # Vite + Tailwind + PWA + Vitest config (test block lives here)
netlify.toml               # build settings + /api/* → functions redirect + SPA fallback
eslint.config.js           # flat ESLint config (React, hooks, refresh)

public/data/               # Static conference data (loaded at build/runtime)
  sessions.json            #   93 sessions  (id, title, date, startTime, room, track, tags)
  exhibitors.json          #   50 exhibitors (id, company, boothNumber, categories, description)
  speakers.json            #  102 speakers  (id, name, company, role)
  agenda-meta.json         #   venue, dates, keynote slots, happy hours, meal times
  personas.json            #   shared persona labels + tags (frontend + backend)

netlify/functions/         # Serverless backend (CommonJS)
  generate.js              #   the AI brain: builds prompts per phase/tool, calls Gemini
  save-playbook.js         #   POST → store playbook in Netlify Blobs, returns {id}
  get-playbook.js          #   GET ?id= → fetch playbook from Blobs (404 if missing)
  package.json             #   function-only deps (separate from root)

src/
  main.jsx                 # React root + PWA SW registration
  App.jsx                  # top-level view state machine (see below)
  hooks/usePhase.js        # active phase state (all phases currently unlocked)
  lib/
    storage.js             #   localStorage intake (key: 'hdw2026_intake')
    playbookApi.js         #   playbook save/load via /api (Netlify Functions + Blobs)
    personas.js            #   5 personas: IDs + role detection (labels/tags from personas.json)
    conference.js          #   shared conference dates (DAY1/DAY2 from agenda-meta.json)
    dataFilter.js          #   client-side session/exhibitor filtering by persona tags
    notifications.js       #   browser notifications: 15-min session reminders
    pdfExport.js           #   multi-page PDF export of playbook modules
  components/
    Landing.jsx, PhaseSelector.jsx
    phase1/IntakeWizard.jsx, GeneratingState.jsx, Playbook.jsx
    phase2/OnFloorAssistant.jsx
    phase3/PostConference.jsx
  __tests__/               # Vitest specs (dataFilter, personas, storage) + setup.js
```

## How it works

### View state machine (`src/App.jsx`)

`App` holds a single `view` string and switches between screens:
`loading → landing → phase-selector → intake → returning → generating →
playbook → phase2 → phase3`. On mount it checks for a `?id=` share URL and, if
present, loads that playbook from the backend and jumps straight to the
`playbook` view (then cleans the URL).

### Intake → playbook flow

1. `IntakeWizard` collects the intake object and persists it via
   `saveIntake` (`localStorage`). Intake shape:
   `{ name, company, role, persona, oneProblem, goals[], volumeRange, segment,
   painPoints[], avoidTypes }`. `persona` is auto-detected from `role` via
   `detectPersona` but is user-overridable.
2. `GeneratingState` POSTs `{ phase: '1', tool: 'playbook', intake }` to
   `/api/generate` and renders rotating status messages while waiting.
3. `generate.js` filters sessions/exhibitors to the persona's tags, builds a
   large structured prompt with a persona-specific system prompt, calls Gemini
   (JSON response mode), and returns the playbook JSON.
4. `Playbook` renders the modules and offers PDF export and share (which calls
   `savePlaybook` → Netlify Blobs → returns a shareable `?id=` link).

### The five personas (`src/lib/personas.js`)

`retailer-shipper`, `carrier-3pl`, `tech-vendor`, `startup-investor`,
`operator-advisor`. Each has a display label, a tag subset used for filtering,
and keyword detection patterns. **Labels and tags live in a single shared file,
`public/data/personas.json`**, consumed by both `src/lib/personas.js` (frontend)
and `netlify/functions/generate.js` (backend) — edit them there. Frontend-only
concerns (role-detection patterns) stay in `personas.js`; backend-only concerns
(`PERSONA_SYSTEM_PROMPTS`) stay in `generate.js`.

### The AI layer (`netlify/functions/generate.js`)

A single function handles all AI calls, dispatched by `phase` + `tool`:

- **Phase 1**: `tool: 'playbook'` → full playbook (strict JSON schema described
  inline in the prompt).
- **Phase 2**: `tool` ∈ `sessionDebrief | peopleLookup | boothScan |
  conflictResolver`, plus a `query` string.
- **Phase 3**: `tool` ∈ `followUpEmail | linkedInRecap`, plus a `query` string.

Conventions in this function:
- Always responds with HTTP 200 and a JSON body; failures are surfaced as
  `{ error: '...' }` (e.g. `rate_limited`, `generation_failed`) so the client
  can handle them gracefully. Real 4xx/5xx are only for malformed requests /
  missing config.
- Retries the Gemini call once on failure; strips markdown code fences if the
  model wraps its JSON.
- Reads conference data directly from `public/data/*.json` via `require`.

## Conventions

- **Module system**: frontend is ESM (`"type": "module"`); Netlify Functions
  are **CommonJS** (`require`/`exports.handler`). Don't mix them.
- **Styling**: Tailwind utility classes inline in JSX. Dark theme throughout
  (`bg-gray-950`, `#0a0a0f` accents). No CSS modules / styled-components.
- **State**: local React state + hooks only. No Redux/Zustand/Context-heavy
  patterns. Persistence is `localStorage` (own data) + Netlify Blobs (shared).
- **API access from client**: always go through the `/api/*` paths, never call
  Netlify function URLs directly.
- **Data files** in `public/data/` are the source of truth for conference
  content; the AI is only given filtered subsets of them.
- **Imports**: `pdfExport.js` lazy-imports heavy deps (`jspdf`, `html2canvas`)
  — keep that pattern to avoid bloating the main bundle.
- **Shared constants**: persona labels/tags come from `public/data/personas.json`
  and conference dates from `src/lib/conference.js` (`DAY1`/`DAY2`). Don't
  re-hardcode persona tags or `2026-05-2x` date strings — import them.
- ESLint flat config with React + hooks rules; run `npm run lint` before
  committing.

## Testing

Tests live in `src/__tests__/` and run on Vitest with `happy-dom`. The Vitest
config is embedded in `vite.config.js` (the `test` block), with global APIs
enabled and `src/__tests__/setup.js` loading `@testing-library/jest-dom`.

Current coverage focuses on pure logic: `dataFilter` (persona filtering),
`personas` (detection/labels/tags), and `storage` (localStorage intake). When
adding pure helpers in `src/lib/`, add matching specs. Run `npm test` before
pushing.

## Deployment & environment

- Deployed on **Netlify**: `npm run build` → publish `dist/`, functions from
  `netlify/functions`.
- `netlify.toml` redirects `/api/*` to `/.netlify/functions/:splat` and falls
  back to `index.html` for SPA routing.
- Required env var: **`GEMINI_API_KEY`** (set in Netlify dashboard / local env).
- Netlify Blobs requires no extra config on Netlify; the `playbooks` store is
  created on first write.

## Gotchas

- **Phase gating**: all three phases are currently unlocked via the
  `PHASE_UNLOCK` map in `src/hooks/usePhase.js`. That map is the single place to
  reintroduce gating (e.g. unlock Phase 2/3 only after a playbook exists).
- **CommonJS functions + ESLint**: the ESLint config only declares browser
  globals, so the CommonJS Netlify functions report `no-undef` for
  `require`/`exports`/`process`. These are expected/pre-existing, not
  regressions — `npm run lint` is not currently clean for the functions (and the
  React components emit pre-existing `react/prop-types` warnings).
- **Date format in prompts**: `generate.js` still contains literal date strings
  inside the prompt text it sends to Gemini (e.g. the expected `"date"` format).
  Those are instructions to the model, not app logic; the actual conference
  dates flow in via `agenda-meta.json`. Update prompt text if dates change.
```
