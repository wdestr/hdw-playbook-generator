import { describe, it, expect, beforeEach } from 'vitest';
import { saveIntake, loadIntake, clearIntake, hasIntake } from '../lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('round-trips saveIntake/loadIntake', () => {
    const intake = { name: 'Test', persona: 'retailer-shipper', goals: ['find-tech'] };
    saveIntake(intake);
    expect(loadIntake()).toEqual(intake);
  });

  it('loadIntake returns null when nothing saved', () => {
    expect(loadIntake()).toBeNull();
  });

  it('loadIntake returns null for malformed JSON', () => {
    localStorage.setItem('hdw2026_intake', '{bad json');
    expect(loadIntake()).toBeNull();
  });

  it('clearIntake removes intake', () => {
    saveIntake({ name: 'Test' });
    clearIntake();
    expect(loadIntake()).toBeNull();
  });

  it('hasIntake returns false when empty', () => {
    expect(hasIntake()).toBe(false);
  });

  it('hasIntake returns true after saveIntake', () => {
    saveIntake({ name: 'Test' });
    expect(hasIntake()).toBe(true);
  });

  it('hasIntake returns false after clearIntake', () => {
    saveIntake({ name: 'Test' });
    clearIntake();
    expect(hasIntake()).toBe(false);
  });
});
