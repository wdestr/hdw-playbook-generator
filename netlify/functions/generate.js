const { GoogleGenerativeAI } = require('@google/generative-ai');
const sessions = require('../../public/data/sessions.json');
const speakers = require('../../public/data/speakers.json');
const exhibitors = require('../../public/data/exhibitors.json');
const agendaMeta = require('../../public/data/agenda-meta.json');

const PERSONA_TAGS = {
  'retailer-shipper': ['last-mile', 'retail', 'technology', 'big-bulky', 'grocery', 'returns', 'customer-experience'],
  'carrier-3pl': ['carrier', '3pl', 'last-mile', 'routing', 'tms', 'parcel'],
  'tech-vendor': ['technology', 'tms', 'routing', 'visibility', 'last-mile', 'startup'],
  'startup-investor': ['startup', 'technology', 'last-mile', 'ev'],
  'operator-advisor': ['last-mile', 'retail', 'carrier', 'technology', 'returns', 'startup'],
};

const PERSONA_SYSTEM_PROMPTS = {
  'retailer-shipper': `You are a sharp logistics advisor helping a retail or shipping executive get maximum ROI from Home Delivery World. Your lens: operational problems, technology solutions, and carrier relationships. You prioritize sessions where a retailer can learn from peers or evaluate solutions. You filter hard on relevance — this person doesn't have time for vendor pitches dressed as content.`,
  'carrier-3pl': `You are a logistics advisor helping a carrier or 3PL leader navigate HDW. Your lens: commercial opportunities with shippers, competitive intelligence on other carriers, and technology that improves operations. You help them find the right retailer conversations and avoid wasting time on sessions aimed at shippers rather than operators.`,
  'tech-vendor': `You are a strategic advisor helping a logistics technology vendor maximize their HDW ROI. Your lens: pipeline development, competitive intel, and customer conversation quality. You focus on sessions that bring them into the same room as their buyers, and help them prepare conversations that don't sound like sales pitches.`,
  'startup-investor': `You are an advisor helping a startup founder or investor navigate HDW with purpose. Your lens: problem validation, design partner conversations, and raising their profile. You focus on who's really influential at this conference and what conversations are worth having versus which panels are time sinks.`,
  'operator-advisor': `You are an advisor helping a senior practitioner who operates at the intersection of operator and advisor. They're building their perspective, looking for signal, and thinking about where the industry is going. Your lens: thought leadership positioning, staying ahead of trends, and making the right connections with both buyers and builders.`,
};

function filterSessionsForPersona(personaTags, limit = 30) {
  const keynotes = sessions.filter(s => s.tags && s.tags.includes('keynote'));
  const rest = sessions.filter(
    s => !s.tags?.includes('keynote') && s.tags?.some(t => personaTags.includes(t))
  );
  return [...keynotes, ...rest].slice(0, limit);
}

function filterExhibitorsForPersona(personaTags, limit = 50) {
  return exhibitors
    .filter(e => e.categories?.some(c => personaTags.includes(c)))
    .slice(0, limit);
}

function buildPhase1Prompt(intake) {
  const persona = intake.persona || 'operator-advisor';
  const personaTags = PERSONA_TAGS[persona] || PERSONA_TAGS['operator-advisor'];
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[persona] || PERSONA_SYSTEM_PROMPTS['operator-advisor'];
  const filteredSessions = filterSessionsForPersona(personaTags);
  const filteredExhibitors = filterExhibitorsForPersona(personaTags);

  const prompt = `${systemPrompt}

## About the Conference
${JSON.stringify(agendaMeta, null, 2)}

## User Profile
- Name: ${intake.name || 'Attendee'}
- Company: ${intake.company || 'Unknown'}
- Role: ${intake.role || 'Professional'}
- Persona: ${persona}
- Their One Problem: ${intake.oneProblem || '(not provided)'}
- Goals at HDW: ${(intake.goals || []).join(', ') || '(not provided)'}
- Delivery Volume: ${intake.volumeRange || '(not provided)'}
- Primary Segment: ${intake.segment || '(not provided)'}
- Pain Points: ${(intake.painPoints || []).join(', ') || '(not provided)'}
- Want to Avoid: ${intake.avoidTypes || '(nothing specified)'}

## Available Sessions (filtered to your persona — ${filteredSessions.length} sessions)
${JSON.stringify(filteredSessions.map(s => ({
  id: s.id,
  title: s.title,
  date: s.date,
  startTime: s.startTime,
  room: s.room,
  track: s.track,
  description: s.description?.substring(0, 300),
  tags: s.tags,
})), null, 2)}

## Available Exhibitors (filtered to your persona — ${filteredExhibitors.length} exhibitors)
${JSON.stringify(filteredExhibitors.map(e => ({
  id: e.id,
  company: e.company,
  boothNumber: e.boothNumber,
  categories: e.categories,
  description: e.description?.substring(0, 200),
})), null, 2)}

## Available Speakers
${JSON.stringify(speakers.slice(0, 30).map(s => ({
  id: s.id,
  name: s.name,
  company: s.company,
  role: s.role,
})), null, 2)}

---

Generate a complete personalized HDW playbook for this attendee. Return ONLY valid JSON matching this exact structure:

{
  "brief": "3-sentence personalized conference brief. Written like a sharp advisor who knows their business. Specific to their One Problem and goals.",

  "sessions": [
    {
      "title": "session title",
      "date": "2026-05-20 or 2026-05-21",
      "time": "HH:MM",
      "room": "room name",
      "track": "track name",
      "why": "1-2 sentences specific to THIS user's intake — not generic",
      "prepQuestion": "one sharp question to ask or angle to listen for",
      "skipIf": "condition where this session isn't worth their time"
    }
  ],

  "skipList": [
    {
      "title": "session or session type to skip",
      "reason": "honest explanation of why it's not worth their time"
    }
  ],

  "boothStrategy": {
    "tier1": [
      {
        "company": "company name",
        "boothNumber": "booth number if known",
        "relevance": "why specifically relevant to this user's problem",
        "question": "specific opening question to ask at this booth"
      }
    ],
    "tier2": [
      {
        "company": "company name",
        "relevance": "brief reason to visit if time allows"
      }
    ],
    "tier3": "category-level guidance on which exhibitor types to skip given this user's intake"
  },

  "networkingTargets": {
    "speakers": [
      {
        "name": "speaker name",
        "role": "their role",
        "company": "their company",
        "relevance": "why they're worth finding",
        "opener": "a peer conversation opener — not a pitch"
      }
    ],
    "companyTypes": [
      {
        "type": "type of company to seek out",
        "why": "why this type is valuable for their specific goals"
      }
    ],
    "valueProp": "how this person should introduce themselves at HDW — the interesting version, not their job title"
  },

  "schedule": {
    "day1": [
      {
        "time": "HH:MM",
        "activity": "what to do",
        "note": "optional context or tip",
        "type": "session | booth | networking | meal | flex"
      }
    ],
    "day2": [
      {
        "time": "HH:MM",
        "activity": "what to do",
        "note": "optional context or tip",
        "type": "session | booth | networking | meal | flex"
      }
    ]
  },

  "conversationStarters": [
    {
      "scenario": "scenario name (e.g. Cold approach to a retailer)",
      "opener": "1-2 sentences that sound like a real person, not a script"
    }
  ],

  "linkedInDraft": "150-200 word LinkedIn post announcing attendance at HDW. Written in first person in the user's voice. Mentions what they're focused on at the conference. Ends with a call to engage. No hashtag spam — 2-3 max."
}

Requirements:
- sessions array: 8-10 items, curated ruthlessly, organized by date (May 20 first, then May 21)
- skipList: 4-6 items, honest and specific — name real session types or actual sessions by name
- boothStrategy.tier1: 5-8 exhibitors
- boothStrategy.tier2: 5-10 exhibitors
- networkingTargets.speakers: 5-8 speakers from the speakers list provided
- conversationStarters: exactly 5 items covering: cold approach to a peer, engaging a vendor, reconnecting with someone you know, breaking into a group conversation, cold approach to a speaker post-session
- Every "why" and "relevance" field must reference something specific from the user's intake — never generic
- Skip list must be honest, not diplomatic — real advice not conference marketing
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

  return prompt;
}

function buildPhase2Prompt(tool, intake, query) {
  const persona = intake.persona || 'operator-advisor';
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[persona] || PERSONA_SYSTEM_PROMPTS['operator-advisor'];
  const intakeContext = `User: ${intake.name}, ${intake.role} at ${intake.company}. Problem: ${intake.oneProblem}. Goals: ${(intake.goals||[]).join(', ')}.`;

  if (tool === 'sessionDebrief') {
    return `${systemPrompt}\n\n${intakeContext}\n\nThe user just attended this session: "${query}"\n\nBased on what you know about this conference and the user's goals, return JSON:\n{"takeaways":["string x3"],"conversationStarters":["string x3 to use with other attendees based on this session"],"linkedInInsight":"one insight from this session framed for a LinkedIn post"}`;
  }
  if (tool === 'peopleLookup') {
    const allSpeakers = speakers.map(s => `${s.name} (${s.role}, ${s.company})`).join('\n');
    return `${systemPrompt}\n\n${intakeContext}\n\nSpeakers/people at HDW:\n${allSpeakers}\n\nThe user wants to know about: "${query}"\n\nReturn JSON:\n{"who":"who this person is","whyAtHDW":"why they're at HDW and what they're likely focused on","whatTheyDo":"what their company does in plain English","conversationAngle":"specific conversation angle for this user given their intake"}`;
  }
  if (tool === 'boothScan') {
    const allExhibitors = exhibitors.map(e => `${e.company} (${e.categories.join(', ')}): ${e.description}`).join('\n');
    return `${systemPrompt}\n\n${intakeContext}\n\nExhibitors:\n${allExhibitors}\n\nUser wants to know about booth/company: "${query}"\n\nReturn JSON:\n{"whatTheyDo":"plain English, no marketing speak","tier":"1 | 2 | 3","tierReason":"why this tier for this specific user","questionToAsk":"one specific question to ask before leaving"}`;
  }
  if (tool === 'conflictResolver') {
    const [sessionA, sessionB] = query.split('|').map(s => s.trim());
    return `${systemPrompt}\n\n${intakeContext}\n\nTwo sessions at the same time:\nA: "${sessionA}"\nB: "${sessionB}"\n\nReturn JSON:\n{"recommendation":"A | B","reason":"specific reason based on this user's intake","alternativeIfMissed":"what to do if they miss the recommended one"}`;
  }
  return '';
}

function buildPhase3Prompt(tool, intake, query) {
  const persona = intake.persona || 'operator-advisor';
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[persona] || PERSONA_SYSTEM_PROMPTS['operator-advisor'];
  const intakeContext = `User: ${intake.name}, ${intake.role} at ${intake.company}.`;

  if (tool === 'followUpEmail') {
    return `${systemPrompt}\n\n${intakeContext}\n\nWrite a follow-up email based on: ${query}\n\nReturn JSON:\n{"subject":"email subject line","body":"email body — short, real, not a template. Under 150 words. No cringe."}`;
  }
  if (tool === 'linkedInRecap') {
    return `${systemPrompt}\n\n${intakeContext}\n\nThe user attended HDW and provides these inputs: ${query}\n\nReturn JSON:\n{"post":"200-250 word LinkedIn post in their voice. Conference hot takes format. Opinionated. Not a recap listicle. 2-3 hashtags max."}`;
  }
  return '';
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const { phase, tool, intake, query } = body;

  if (!intake) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_intake' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'missing_api_key' }) };
  }

  let prompt = '';
  if (phase === '1' && tool === 'playbook') {
    prompt = buildPhase1Prompt(intake);
  } else if (phase === '2') {
    prompt = buildPhase2Prompt(tool, intake, query);
  } else if (phase === '3') {
    prompt = buildPhase3Prompt(tool, intake, query);
  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'unknown_phase_tool' }) };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  // Try once, retry once on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Strip markdown fences if present
        const stripped = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        parsed = JSON.parse(stripped);
      }
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    } catch (err) {
      if (err.status === 429) {
        return { statusCode: 200, headers, body: JSON.stringify({ error: 'rate_limited' }) };
      }
      if (attempt === 1) {
        console.error('Gemini error:', err);
        return { statusCode: 200, headers, body: JSON.stringify({ error: 'generation_failed' }) };
      }
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};
