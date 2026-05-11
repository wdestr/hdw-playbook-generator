import { describe, it, expect } from 'vitest';
import {
  PERSONAS,
  PERSONA_LABELS,
  PERSONA_TAGS,
  detectPersona,
  getPersonaLabel,
  getPersonaTags,
} from '../lib/personas';

describe('personas', () => {
  // Test 1: detectPersona for VP of Supply Chain (retailer-shipper)
  it('should detect retailer-shipper persona from "VP of Supply Chain"', () => {
    expect(detectPersona('VP of Supply Chain')).toBe(PERSONAS.RETAILER_SHIPPER);
  });

  // Test 2: detectPersona for Fleet Manager (carrier-3pl)
  it('should detect carrier-3pl persona from "Fleet Manager"', () => {
    expect(detectPersona('Fleet Manager')).toBe(PERSONAS.CARRIER_3PL);
  });

  // Test 3: detectPersona for Account Executive (tech-vendor)
  it('should detect tech-vendor persona from "Account Executive"', () => {
    expect(detectPersona('Account Executive')).toBe(PERSONAS.TECH_VENDOR);
  });

  // Test 4: detectPersona for Founder & CEO (startup-investor)
  it('should detect startup-investor persona from "Founder & CEO"', () => {
    expect(detectPersona('Founder & CEO')).toBe(PERSONAS.STARTUP_INVESTOR);
  });

  // Test 5: detectPersona for Senior Advisor (operator-advisor)
  it('should detect operator-advisor persona from "Senior Advisor"', () => {
    expect(detectPersona('Senior Advisor')).toBe(PERSONAS.OPERATOR_ADVISOR);
  });

  // Test 6: detectPersona returns null for unmatched title
  it('should return null for "random job title"', () => {
    expect(detectPersona('random job title')).toBeNull();
  });

  // Test 7: getPersonaLabel returns correct label
  it('should return "Retailer / Shipper" for retailer-shipper persona', () => {
    expect(getPersonaLabel(PERSONAS.RETAILER_SHIPPER)).toBe('Retailer / Shipper');
  });

  // Test 8: getPersonaLabel returns null for unknown persona
  it('should return null for unknown persona', () => {
    expect(getPersonaLabel('unknown')).toBeNull();
  });

  // Test 9: getPersonaTags includes expected tags
  it('should return tags containing "carrier" and "3pl" for carrier-3pl persona', () => {
    const tags = getPersonaTags(PERSONAS.CARRIER_3PL);
    expect(tags).toContain('carrier');
    expect(tags).toContain('3pl');
  });

  // Test 10: getPersonaTags returns empty array for unknown persona
  it('should return empty array for unknown persona', () => {
    expect(getPersonaTags('unknown')).toEqual([]);
  });
});
