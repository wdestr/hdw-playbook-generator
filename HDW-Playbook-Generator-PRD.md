# PRD: HDW Playbook Generator
**Product Type:** AI-Powered Conference Intelligence Tool  
**Event:** Home Delivery World USA 2026 — May 20–21, Nashville  
**Owner:** Wiley Strahan  
**Status:** Pre-Build | Target Launch: May 13, 2026  
**Version:** 1.0

---

## One-Liner

An AI tool that turns a 3-minute intake into a fully personalized Home Delivery World playbook — sessions, booths, targets, schedule, talking points, and follow-up templates — so operators actually get ROI from the conference instead of just showing up.

---

## The Real Problem

Conference session recommenders already exist. They're useless.

The actual problem at a conference like HDW is not *"which sessions should I attend."* It's:

- 3,000 people. 100+ sessions. 300+ exhibitors. Two days. No map.
- Most attendees walk in with vague goals and walk out with a stack of business cards they'll never follow up on.
- $3,000–$6,000 in travel and time cost per attendee. ROI is almost never measured.
- Operators are there to solve specific problems — but they spend most of their time in sessions that don't apply to them because they didn't do the work to filter upfront.
- The best conversations happen by accident. They shouldn't.

What people actually need is a **pre-built game plan** — not a list of sessions to consider.

The HDW Playbook Generator solves for conference ROI end-to-end: before, during, and after the event.

---

## Target Users

| Persona | Description | Primary Goal at HDW |
|---|---|---|
| **Retailer / Shipper** | VP/Director of Supply Chain, Logistics, or Last Mile at a retailer (Target, Wayfair, Home Depot tier) | Find technology or carrier solutions to solve a specific operational problem |
| **3PL / Carrier** | Ops or commercial leader at a last-mile, big & bulky, or regional carrier | Meet retail prospects; size up competitors; find tech partnerships |
| **Tech Vendor** | Sales, BD, or Product leader at a logistics SaaS, routing, TMS, or visibility platform | Pipeline development; competitive intelligence; customer meetings |
| **Startup / Investor** | Founder or investor in last-mile logistics | Validate problem space; find design partners; raise profile |
| **Operator-Advisor** | Senior practitioner who's also building, advising, or investing in the space | All of the above + thought leadership positioning |

The tool must adapt its outputs meaningfully by persona. A retailer's playbook looks nothing like a vendor's.

---

## Goals & Success Metrics

### Primary Goal
Give every user a playbook they couldn't have built themselves in less than an hour — delivered in under 4 minutes.

### Wiley's Personal Goals
- Build credibility as a practitioner who *ships* — not just talks about AI in logistics
- Drive inbound conversations at HDW from people who tried the tool
- Generate LinkedIn impressions pre-conference from the launch post
- Demonstrate AI agency capabilities to potential SMB or enterprise clients watching

### Success Metrics

| Metric | Target |
|---|---|
| LinkedIn post impressions (launch) | 10,000+ |
| Tool completions (full playbooks generated) | 200+ pre-conference |
| Inbound messages / DMs referencing the tool | 20+ |
| Conference conversations opened with "did you try the tool?" | 10+ |
| Avg. time to complete intake | < 4 minutes |
| Playbook quality rating (self-assessed on review) | ≥ 4/5 per persona |

---

## Product Phases

The tool has three modes. All three live in the same URL. Users select their mode on landing.

```
Phase 1: PRE-CONFERENCE PLAYBOOK     → Full personalized game plan
Phase 2: ON-THE-FLOOR ASSISTANT      → Real-time session and conversation support
Phase 3: POST-CONFERENCE DEBRIEF     → Follow-up engine and LinkedIn content
```

---

## Phase 1: Pre-Conference Playbook

### User Flow

**Step 1 — Intake (3–4 minutes)**

Smart form. Not a questionnaire — a conversation. Collects:

- Name, company, role title
- Persona type (auto-suggested, user confirms): Retailer / Carrier / 3PL / Tech Vendor / Startup / Investor / Other
- **The One Problem**: "What's the single biggest operational or commercial problem you're hoping to make progress on at HDW?" [open text, 2–4 sentences]
- **Goals at this conference** (multi-select, pick up to 3):
  - Find a technology solution
  - Meet potential carrier/hauler partners
  - Meet potential retail/shipper prospects
  - Competitive intelligence
  - Build my personal brand / visibility
  - Validate a problem or hypothesis
  - Hire or be hired
  - Investor meetings
- **Current operational context** (optional, increases personalization):
  - Delivery volume range
  - Primary delivery segment (parcel, big & bulky, grocery, furniture, appliances, other)
  - Biggest pain points right now (multi-select: cost, FADR, carrier capacity, damage, customer experience, technology, compliance, other)
- **Who you're trying to avoid** (optional, honest signal): "Any types of vendors or conversations you're actively trying to skip?" [open text]
- **LinkedIn handle** (optional — used for LinkedIn content generation in Phase 3)

**Step 2 — Playbook Generation (AI, ~20 seconds)**

AI processes intake against the full HDW 2026 agenda, speaker list, exhibitor directory, and session descriptions. Outputs a structured, named playbook.

---

### Playbook Output Modules

#### 📋 Module 1: Your Conference Brief
A 3-sentence personalized summary of what this conference should accomplish for *you specifically*. Sets the frame. Reads like it was written by a sharp advisor who knows your business.

#### 🗓️ Module 2: Priority Sessions (Top 8–10)
Not a dump of every relevant session. Curated. Ruthlessly prioritized.

For each session:
- Session name, date/time, location
- **Why it's on your list** — specific to *your intake*, not generic ("This session directly addresses your FADR problem — the speaker runs last-mile ops for a furniture retailer at your scale")
- **Your prep question** — one sharp question to ask or angle to listen for
- **Skip if:** condition under which this session isn't worth your time

Organized by day with time blocks. Conflict-resolved — no double-booking.

#### 🚫 Module 3: Honest Skip List
Sessions/session types that sound relevant to your persona but historically underdeliver — or that are clearly vendor pitches dressed as content. Named and explained. This is the most valuable module most people don't realize they need.

#### 🏢 Module 4: Booth Strategy
HDW has 300+ exhibitors. Most people wander. This fixes that.

- **Tier 1 Booths (Must Visit):** 5–8 exhibitors directly relevant to your stated problem. For each: what they do, why they're relevant to you, one specific question to open with.
- **Tier 2 Booths (If Time):** 5–10 worth a 5-minute conversation based on your segment.
- **Tier 3 (Skip):** Category-level guidance on which exhibitor types aren't worth your time given your intake.

#### 🤝 Module 5: Networking Targets
Built from public speaker list + known attendee companies.

- **Priority Speakers to Find:** 5–8 speakers whose roles/companies directly match your goals. For each: who they are, why they're relevant, suggested conversation opener (not a pitch — a peer conversation).
- **Company Types to Prioritize on the Floor:** 3–5 company profiles to actively seek in networking sessions.
- **Your Value Prop in One Sentence:** How to introduce yourself at this conference, tuned to your persona and goals. Not your job title. The *interesting version* of why you're there.

#### 📅 Module 6: Day-by-Day Schedule
A clean, time-blocked 2-day itinerary. Integrates:
- Priority sessions (with buffer for travel between rooms)
- Suggested booth visit windows
- Networking/happy hour strategy
- Meal strategy (yes — HDW lunches are where deals happen)
- A "flex block" each afternoon for unplanned conversations

Exported as a simple, printable/shareable schedule.

#### 💬 Module 7: Conversation Starters
Pre-built openers for 5–6 specific conversation types:
- Opening a cold conversation with a retailer
- Opening with a vendor you're evaluating
- Reconnecting with someone you know
- Breaking into a group conversation
- Cold approach to a speaker after their session

Not scripts. Signals. One or two sentences that sound like a real person.

#### 🔗 Module 8: Pre-Conference LinkedIn Post Draft
Optional. 150–200 word LinkedIn post announcing attendance and what you're focused on — written in the user's voice/persona. Designed to drive inbound from other attendees before the event.

---

## Phase 2: On-The-Floor Assistant

Activated by a "I'm at HDW now" toggle. Lightweight, fast, mobile-optimized.

### Features

**Session Debrief → Talking Points**
User drops in a session name they just attended. Tool outputs:
- 3 key takeaways from that session (pre-loaded from session descriptions + AI synthesis)
- 2–3 conversation starters to use with other attendees based on the session
- One LinkedIn-ready insight ("Here's what [session topic] actually means for operators")

**Real-Time People Lookup**
User types a name or company they just met or want to find. Tool outputs:
- Who they are, why they're at HDW, what their company does
- Suggested conversation angle based on the user's intake profile

**Quick Booth Scan**
User enters a booth number or company name. Tool outputs:
- What this company does (plain English, no marketing speak)
- Whether they fit your Tier 1/2/3 criteria based on your intake
- One question to ask before you leave their booth

**Session Conflict Resolver**
Two sessions are at the same time. User inputs both. Tool recommends which to attend based on their intake profile and explains why.

---

## Phase 3: Post-Conference Debrief

Activated after May 21. Generates follow-up content based on what the user actually did.

### Features

**Follow-Up Email Generator**
User inputs:
- Name of person they met
- Company + role (if known)
- What they talked about (1–2 sentences)
- Desired next step (demo, call, intro, coffee, no ask yet)

Output: A clean, un-cringe follow-up email. Short. Real. Not a template.

**LinkedIn Recap Post Generator**
User inputs:
- 3–5 things they saw, learned, or heard at the conference
- Their honest take on the event

Output: A 200–250 word LinkedIn post written in their voice. Conference hot takes format — not a recap listicle.

**Connections Tracker**
Simple structured list. For each person met: name, company, what was discussed, follow-up status. Exportable to CSV or copy-paste.

---

## Technical Architecture

### Stack
- **Frontend:** React (single-page app) — deployed on Netlify
- **AI Engine:** Claude Sonnet via Anthropic API (claude-sonnet-4-20250514)
- **Intake:** Multi-step form with conditional logic (React state, no backend required for intake)
- **Prompt Architecture:** Modular system prompt per persona type + dynamic user context injection
- **Session/Exhibitor Data:** Manually curated JSON from public HDW agenda + exhibitor directory (one-time build, ~4–6 hours)
- **Output Rendering:** Structured markdown parsed to rich UI components
- **PDF Export:** Client-side PDF generation for playbook download (jsPDF or html2canvas)
- **Storage:** LocalStorage only — no auth, no database, no email gate

### Why No Auth / Email Gate
The tool spreads *because* there's no friction. No login, no email wall. It's the mechanism for building Wiley's inbound, not a lead gen form. If someone wants to go deeper, they find Wiley on LinkedIn.

### Data Files Required (Pre-Build)
```
/data/sessions.json         — All HDW 2026 sessions with: title, date, time, room, speakers, description, track
/data/speakers.json         — All speakers with: name, company, role, session(s), LinkedIn (if public)
/data/exhibitors.json       — All exhibitors with: company, booth number, category tags, brief description
/data/agenda-meta.json      — Conference logistics: venue map, happy hour times, keynote slots
```

### Prompt Architecture Overview

Each playbook module is generated by a targeted sub-prompt. The master system prompt:
1. Receives user intake as structured JSON
2. Detects persona type and goal cluster
3. Injects relevant session/exhibitor subsets (not the full dataset) to stay within context window
4. Calls sub-prompts sequentially per module
5. Returns structured JSON per module → rendered as UI components

Sub-prompt modules are independently tunable without breaking others.

---

## Content & Data Build Requirements

| Asset | Source | Est. Build Time |
|---|---|---|
| Sessions JSON (100+ sessions) | HDW website agenda scrape + manual cleanup | 3–4 hours |
| Speakers JSON (250+ speakers) | HDW speaker page + manual cleanup | 2–3 hours |
| Exhibitors JSON (300+ exhibitors) | HDW exhibitor list | 3–4 hours |
| Skip List (curated, opinionated) | Manual — Wiley's POV on which session types are filler | 1 hour |
| Persona prompt variants (5 persona types) | Prompt engineering | 2–3 hours |
| UI build (React) | Dev | 6–8 hours |
| QA across 5 personas | Testing | 2–3 hours |
| **Total** | | **~20–25 hours** |

---

## Positioning & Launch Strategy

### What This Is (For Wiley's Brand)
Not a conference app. Not a chatbot. A practitioner-built tool from someone who has been on both sides of this conference — as an operator at the buying table *and* as a builder. That context is the product's credibility.

### Launch Sequence

**T-8 days (May 12): LinkedIn soft launch**
Short post. No hype. Something like:
> *I'm at HDW next week. Spent a few evenings building a tool that does what the conference app should do but doesn't — full personalized playbook, booth strategy, talking points, follow-up templates.*
>
> *Three minutes to complete. No email. Free.*
>
> *[link]*
>
> *Curious what you all are focused on this year.*

**T-5 days (May 15): Follow-up engagement post**
Share a real playbook output (anonymized) — show people what they get. Something from the Retailer persona or Carrier persona.

**Day-of (May 20): On-floor post**
"Tool's live in floor mode. Drop in the session you just left — it'll give you three things to say about it." Link again.

**Post-conference (May 22): Debrief post**
"Here's what I actually saw at HDW and what it means for operators." Generated with the tool's own Phase 3 feature.

---

## What This Is NOT

- A conference app replacement (no push notifications, no live updates)
- A lead capture tool (no email gate, no CRM integration)
- A generic "AI assistant" (every output is tuned to HDW 2026 specifically — it expires after the conference, which is part of the urgency)
- A speaker/sponsor paid placement (opinionated curation is the value, not a directory)

---

## Out of Scope (V1)

- Real-time attendee matching (would require HDW data access)
- Calendar sync / calendar export
- Mobile app
- Post-conference analytics dashboard
- Multi-conference support
- Social login or persistent profiles

These are V2 considerations if the tool gets traction and Wiley wants to expand it beyond HDW.

---

## Open Questions

1. **Data access:** Can we scrape the full HDW agenda, speaker, and exhibitor lists cleanly from the public site? Or will we need to manually build the JSON? (Likely manual — 8–10 hours total but worth it for quality.)
2. **Phase 2 mobile UX:** On-floor mode needs to work on a phone one-handed. Does the intake flow need to be condensed for mobile users who start on their phone at the conference?
3. **Persona auto-detection vs. user selection:** Should we try to infer persona from job title, or always ask explicitly? Explicit is safer — fewer wrong outputs.
4. **Wiley's byline and branding:** Does this live as a standalone microsite (hdwplaybook.com or similar) or on an existing domain (smbautomation.ai, or personal site)? Recommend a clean microsite — makes it easier to share and brand clearly.
5. **Skip List editorial risk:** The "honest skip list" is the most differentiated feature and also the most politically sensitive (naming session types as filler). Does Wiley want to pull punches here or be fully honest? Recommend honest — it's the thing people will share.

---

## Build Priority (Given 10-Day Window)

If time is constrained, build in this order:

| Priority | Module | Why |
|---|---|---|
| P0 | Phase 1 full intake + playbook generation | Core product — must work perfectly |
| P0 | Sessions, exhibitors, speakers JSON | Can't personalize without this data |
| P1 | PDF / print export for playbook | Attendees will want to carry this |
| P1 | Pre-conference LinkedIn post generator | Directly serves Wiley's launch play |
| P2 | Phase 2 on-floor assistant | Nice to have at the conference |
| P3 | Phase 3 post-conference debrief | Can be added after the event |

---

*Built by a practitioner, for practitioners. If you're going to HDW and want to actually get something out of it — this is the tool.*
