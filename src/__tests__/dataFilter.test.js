import { describe, it, expect } from 'vitest';
import { filterSessionsForPersona, filterExhibitorsForPersona } from '../lib/dataFilter';

const SAMPLE_SESSIONS = [
  {
    id: 's1',
    title: 'Keynote: The Future of Delivery',
    tags: ['keynote']
  },
  {
    id: 's2',
    title: 'Retail Innovation Strategies',
    tags: ['retail', 'technology']
  },
  {
    id: 's3',
    title: 'Last-Mile Optimization',
    tags: ['last-mile', 'carrier']
  },
  {
    id: 's4',
    title: 'Parcel Routing Best Practices',
    tags: ['parcel', 'routing']
  },
  {
    id: 's5',
    title: 'Technology Trends in Logistics',
    tags: ['technology', 'routing']
  }
];

const SAMPLE_EXHIBITORS = [
  {
    id: 'e1',
    name: 'TechFlow Solutions',
    categories: ['technology', 'routing']
  },
  {
    id: 'e2',
    name: 'Carrier Pro',
    categories: ['carrier', '3pl']
  },
  {
    id: 'e3',
    name: 'StartupIO',
    categories: ['startup', 'technology']
  }
];

describe('filterSessionsForPersona', () => {
  it('should prioritize keynote sessions first', () => {
    const personaTags = ['keynote', 'technology'];
    const result = filterSessionsForPersona(SAMPLE_SESSIONS, personaTags);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('s1');
    expect(result[0].tags).toContain('keynote');
  });

  it('should include tag-matched sessions after keynotes', () => {
    const personaTags = ['technology'];
    const result = filterSessionsForPersona(SAMPLE_SESSIONS, personaTags);
    
    const sessionIds = result.map(s => s.id);
    expect(sessionIds).toContain('s2');
    expect(sessionIds).toContain('s5');
  });

  it('should respect the limit parameter', () => {
    const personaTags = ['technology', 'retail', 'routing', 'last-mile', 'parcel'];
    const result = filterSessionsForPersona(SAMPLE_SESSIONS, personaTags, 2);
    
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty arrays correctly', () => {
    expect(filterSessionsForPersona([], ['technology'])).toEqual([]);
    expect(filterSessionsForPersona(SAMPLE_SESSIONS, [])).toEqual([]);
    expect(filterSessionsForPersona([], [])).toEqual([]);
  });
});

describe('filterExhibitorsForPersona', () => {
  it('should filter exhibitors by category match', () => {
    const personaTags = ['technology'];
    const result = filterExhibitorsForPersona(SAMPLE_EXHIBITORS, personaTags);
    
    const exhibitorIds = result.map(e => e.id);
    expect(exhibitorIds).toContain('e1');
    expect(exhibitorIds).toContain('e3');
    expect(exhibitorIds).not.toContain('e2');
  });

  it('should respect the limit parameter', () => {
    const personaTags = ['technology', 'carrier', '3pl', 'startup'];
    const result = filterExhibitorsForPersona(SAMPLE_EXHIBITORS, personaTags, 1);
    
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('should handle invalid input gracefully', () => {
    expect(filterExhibitorsForPersona(null, ['technology'])).toEqual([]);
    expect(filterExhibitorsForPersona(undefined, ['technology'])).toEqual([]);
    expect(filterExhibitorsForPersona(SAMPLE_EXHIBITORS, null)).toEqual([]);
    expect(filterExhibitorsForPersona(SAMPLE_EXHIBITORS, undefined)).toEqual([]);
  });
});
