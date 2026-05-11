# HDW Playbook Generator — Design Spec
**Date:** 2026-05-10  
**Owner:** Wiley Strahan  
**Target Launch:** 2026-05-11  
**Conference:** Home Delivery World USA 2026 — May 20–21, Nashville

---

## Product Summary

An AI tool that turns a 3-minute intake into a fully personalized Home Delivery World conference playbook — sessions, booths, networking targets, schedule, talking points, and follow-up templates. Built for conference ROI, not conference discovery.

Three phases in a single URL:
- **Phase 1 (Pre-Conference):** Full personalized playbook, available now
- **Phase 2 (On-The-Floor):** Real-time lookup tools, unlocks May 20
- **Phase 3 (Post-Conference):** Follow-up and content engine, unlocks May 22

---

## Architecture

### Overview

```
Browser (React SPA)
    ↓ intake JSON
Netlify Function (/api/generate)
    ↓ prompt + filtered context
Gemini 1.5 Flash API
    ↓ structured JSON response
Browser → renders playbook modules
```

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build tool | Vite + React | Fast dev server, small production bundle |
| Styling | Tailwind CSS | No design system overhead, ships fast |
| AI | Gemini 1.5 Flash | Free tier (1,500 req/day), 1M token context window |
| AI SDK | `@google/generative-ai` | Official Google SDK, server-side only |
| Serverless | Netlify Functions | One function handles all phases; free tier covers 200+ completions/day |
| PDF export | `html2canvas` + `jsPDF` | Client-side, no server needed |
| Storage | `localStorage` | Intake persists across phases; no auth, no DB |
| Deployment | Netlify | Auto-deploy from GitHub; `*.netlify.app` URL for launch |

### Key Constraints
- No auth, no email gate, no database — friction-free by design
- API key (`GEMINI_API_KEY`) lives only in Netlify environment variables, never in client code
- All HDW data bundled as static JSON at build time — no live data fetching

---

## Data Layer

### Four Static JSON Files

Scraped from the public HDW 2026 website during the build phase and committed to `/public/data/`.

```json
// sessions.json — shape per entry
{
  "id": "string",
  "title": "string",
  "date": "2026-05-20 | 2026-05-21",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "room": "string",
  "track": "string",
  "speakers": ["speaker_id"],
  "description": "string",
  "tags": ["last-mile", "technology", "retail", ...]
}

// speakers.json — shape per entry
{
  "id": "string",
  "name": "string",
  "company": "string",
  "role": "string",
  "sessions": ["session_id"],
  "linkedin": "string | null"
}

// exhibitors.json — shape per entry
{
  "id": "string",
  "company": "string",
  "boothNumber": "string",
  "categories": ["carrier", "technology", "big-bulky", ...],
  "description": "string"
}

// agenda-meta.json
{
  "venue": "string",
  "happyHours": [{ "date": "string", "time": "string", "location": "string" }],
  "keynoteTimes": [{ "date": "string", "startTime": "string", "endTime": "string" }],
  "mealTimes": [{ "date": "string", "meal": "string", "time": "string", "location": "string" }]
}
```

### Tagging Strategy

Sessions and exhibitors are tagged during cleanup with persona-relevant categories. Tags are the primary filtering mechanism used by the Netlify Function to inject only relevant subsets into prompts:

- `last-mile`, `big-bulky`, `grocery`, `furniture`, `appliances`
- `technology`, `routing`, `tms`, `visibility`, `returns`
- `retail`, `carrier`, `3pl`, `startup`
- `keynote`, `panel`, `workshop`, `vendor-pitch` (for skip list logic)

---

## Frontend Structure

### Routes / State

Single-page app. Phase state stored in React state + localStorage. No URL routing needed for V1.

```
Landing
  └── Phase selector (3 cards)
      ├── Phase 1: Pre-Conference Playbook [always active]
      ├── Phase 2: On The Floor [locked until 2026-05-20]
      └── Phase 3: Post-Conference [locked until 2026-05-22]

Phase 1 — Pre-Conference Playbook
  ├── Intake Wizard (4 steps)
  │   ├── Step 1: Name, company, role, persona (auto-suggested, user confirms)
  │   ├── Step 2: The One Problem [open text] + Goals [multi-select, max 3]
  │   ├── Step 3: Operational context (volume, segment, pain points) [optional]
  │   └── Step 4: Who to avoid [optional] + LinkedIn handle [optional]
  ├── Generating... (loading state, ~20s, progress copy)
  └── Playbook Output (8 modules, scrollable with sticky nav)
      ├── Module 1: Conference Brief
      ├── Module 2: Priority Sessions (8–10 sessions, day-organized)
      ├── Module 3: Honest Skip List
      ├── Module 4: Booth Strategy (Tier 1 / Tier 2 / Tier 3)
      ├── Module 5: Networking Targets
      ├── Module 6: Day-by-Day Schedule
      ├── Module 7: Conversation Starters
      └── Module 8: LinkedIn Post Draft
          └── Actions: [Download PDF] [Start Over]

Phase 2 — On The Floor (mobile-first)
  ├── Session Debrief → Talking Points
  ├── People Lookup
  ├── Quick Booth Scan
  └── Session Conflict Resolver

Phase 3 — Post-Conference Debrief
  ├── Follow-Up Email Generator
  ├── LinkedIn Recap Post Generator
  └── Connections Tracker (localStorage, CSV export)
```

### Mobile Considerations
- Phase 2 is mobile-first: large tap targets, single-column, minimal typing
- Phase 1 designed for desktop, responsive for mobile
- Phase 3 is desktop-primary

---

## AI & Prompt Architecture

### Netlify Function: `netlify/functions/generate.js`

Single function, routes on `phase` parameter.

**Request shape:**
```json
{
  "phase": "1 | 2 | 3",
  "tool": "playbook | sessionDebrief | peopleLookup | boothScan | conflictResolver | followUpEmail | linkedInRecap",
  "intake": { ...userIntakeJSON },
  "query": "string (Phase 2 & 3 only)"
}
```

**Response shape (Phase 1):**
```json
{
  "brief": "string",
  "sessions": [...],
  "skipList": [...],
  "boothStrategy": { "tier1": [...], "tier2": [...], "tier3": "string" },
  "networkingTargets": { "speakers": [...], "companyTypes": [...], "valueProp": "string" },
  "schedule": { "day1": [...], "day2": [...] },
  "conversationStarters": [...],
  "linkedInDraft": "string"
}
```

### Data Injection Strategy

The function does NOT inject all 100+ sessions into every prompt. It filters first:

1. Detect persona type from intake
2. Select relevant tag subsets for that persona
3. Filter `sessions.json` and `exhibitors.json` to matching tags
4. Inject filtered subset (~20–30 sessions, ~50 exhibitors) into prompt

This keeps the prompt focused, improves output quality, and avoids context window issues even with large data files.

### Persona System Prompts

Five base system prompts, selected by detected persona:
- `retailer-shipper`
- `carrier-3pl`
- `tech-vendor`
- `startup-investor`
- `operator-advisor`

Each base prompt establishes the lens through which HDW should be evaluated. User's "One Problem," goals, and operational context are injected on top. This is what makes a retailer's output structurally different from a vendor's — not just different content, but different framing, different module emphasis, different call-to-action tone.

### Phase 1 Generation

Single Gemini API call returning all 8 modules as structured JSON. Keeping it as one call (rather than per-module) reduces latency and keeps the context coherent across modules (e.g., sessions recommended in Module 2 are reflected in the schedule in Module 6).

### Phase 2 & 3 Generation

Lightweight per-tool calls. Original intake pulled from localStorage and injected as context so outputs remain personalized to the user's original goals ("Based on your FADR focus...").

### Error Handling

- Gemini returns malformed JSON → function retries once with explicit JSON formatting instruction
- Second failure → function returns `{ "error": "generation_failed" }` → frontend shows friendly error with "Try again" button
- No silent failures

---

## Deployment

### Setup Sequence

1. Create Google AI Studio account at `aistudio.google.com` → generate free Gemini API key
2. Init git repo, push to GitHub
3. Create Netlify account → connect GitHub repo
4. Set `GEMINI_API_KEY` environment variable in Netlify dashboard
5. Push → auto-deploys to `*.netlify.app`

### Environment Variables

| Variable | Location | Value |
|---|---|---|
| `GEMINI_API_KEY` | Netlify env vars | Google AI Studio API key |

### Build Command

```
npm run build → Vite builds to /dist → Netlify serves /dist
netlify/functions/ → auto-deployed as serverless functions
```

---

## Build Sequence (Given Launch Tomorrow)

| Order | Task | Why first |
|---|---|---|
| 1 | Scrape HDW data → build 4 JSON files | Everything else depends on this |
| 2 | Scaffold Vite + React + Tailwind + Netlify Functions | Foundation |
| 3 | Intake wizard (Phase 1) | Core user flow |
| 4 | Netlify Function + Gemini integration | AI backbone |
| 5 | Playbook output rendering (8 modules) | Core product output |
| 6 | PDF export | P1 must-have |
| 7 | Phase 2 on-floor tools | Nice to have at conference |
| 8 | Phase 3 post-conference tools | Can finalize before May 22 |
| 9 | Polish, mobile QA, deploy | Ship |

---

## Out of Scope (V1)

- Auth, email gate, CRM integration
- Calendar sync / .ics export
- Real-time attendee matching
- Push notifications
- Multi-conference support
- Social login or persistent profiles

---

## Open Questions Resolved

| Question | Decision |
|---|---|
| AI provider | Gemini 1.5 Flash (free tier) — replaces Claude Sonnet |
| API key handling | Netlify Function proxy — key never in client code |
| Domain | `*.netlify.app` for launch; custom domain is V2 |
| Phase scope | All three phases in one build |
| Data source | Scrape HDW public website |
| Skip list honesty | Fully honest — it's the most shareable feature |
