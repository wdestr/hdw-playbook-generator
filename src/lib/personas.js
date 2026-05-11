// The 5 persona IDs
export const PERSONAS = {
  RETAILER_SHIPPER: 'retailer-shipper',
  CARRIER_3PL: 'carrier-3pl',
  TECH_VENDOR: 'tech-vendor',
  STARTUP_INVESTOR: 'startup-investor',
  OPERATOR_ADVISOR: 'operator-advisor',
};

// Display labels for each persona
export const PERSONA_LABELS = {
  'retailer-shipper': 'Retailer / Shipper',
  'carrier-3pl': 'Carrier / 3PL',
  'tech-vendor': 'Tech Vendor',
  'startup-investor': 'Startup / Investor',
  'operator-advisor': 'Operator-Advisor',
};

// Tag subsets relevant to each persona (used by dataFilter.js)
export const PERSONA_TAGS = {
  'retailer-shipper': ['last-mile', 'retail', 'technology', 'big-bulky', 'grocery', 'returns', 'customer-experience'],
  'carrier-3pl': ['carrier', '3pl', 'last-mile', 'routing', 'tms', 'parcel'],
  'tech-vendor': ['technology', 'tms', 'routing', 'visibility', 'last-mile', 'startup'],
  'startup-investor': ['startup', 'technology', 'last-mile', 'ev'],
  'operator-advisor': ['last-mile', 'retail', 'carrier', 'technology', 'returns', 'startup'],
};

// Detection patterns - order matters, first match wins
const DETECTION_PATTERNS = [
  {
    persona: PERSONAS.RETAILER_SHIPPER,
    roleKeywords: ['vp', 'director', 'manager', 'head'],
    contextKeywords: ['supply chain', 'logistics', 'fulfillment', 'delivery', 'last mile', 'operations'],
  },
  {
    persona: PERSONAS.CARRIER_3PL,
    roleKeywords: ['carrier', 'driver', 'fleet', 'hauler', '3pl', 'transportation'],
    contextKeywords: [],
  },
  {
    persona: PERSONAS.TECH_VENDOR,
    roleKeywords: ['sales', 'account executive', 'bd', 'business development', 'product', 'engineer', 'saas', 'tech'],
    contextKeywords: [],
  },
  {
    persona: PERSONAS.STARTUP_INVESTOR,
    roleKeywords: ['founder', 'ceo', 'investor', 'vc', 'venture'],
    contextKeywords: [],
  },
  {
    persona: PERSONAS.OPERATOR_ADVISOR,
    roleKeywords: ['consultant', 'advisor', 'principal', 'analyst', 'researcher'],
    contextKeywords: [],
  },
];

/**
 * Returns the persona ID for a given role title string (simple keyword matching)
 * Returns null if no match
 */
export function detectPersona(roleTitle) {
  if (!roleTitle || typeof roleTitle !== 'string') {
    return null;
  }

  const lowerTitle = roleTitle.toLowerCase();

  // Check each pattern in order - first match wins
  for (const pattern of DETECTION_PATTERNS) {
    // Check role keywords
    const roleMatch = pattern.roleKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );

    if (!roleMatch) {
      continue;
    }

    // If there are context keywords, at least one must match
    if (pattern.contextKeywords.length > 0) {
      const contextMatch = pattern.contextKeywords.some((keyword) =>
        lowerTitle.includes(keyword)
      );
      if (contextMatch) {
        return pattern.persona;
      }
    } else {
      // No context keywords required, just role match
      return pattern.persona;
    }
  }

  return null;
}

/**
 * Returns display label for persona ID. Returns null for unknown.
 */
export function getPersonaLabel(personaId) {
  return PERSONA_LABELS[personaId] || null;
}

/**
 * Returns tag array for persona ID. Returns [] for unknown.
 */
export function getPersonaTags(personaId) {
  return PERSONA_TAGS[personaId] || [];
}
