import { describe, expect, it } from 'vitest';

import ar from '@/i18n/locales/ar.json';
import { CAPABILITIES, capabilityCounts } from './capabilities';

describe('capability registry', () => {
  it('has unique ids and a known class/status pair', () => {
    const ids = CAPABILITIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of CAPABILITIES) {
      expect(['A', 'B', 'C']).toContain(entry.class);
      expect(['available', 'planned', 'simulated']).toContain(entry.status);
      if (entry.class === 'C') expect(entry.status).toBe('simulated');
      if (entry.status === 'available') expect(entry.class).toBe('A');
    }
  });

  it('counts every class', () => {
    expect(capabilityCounts()).toEqual({ A: 10, B: 1, C: 5 });
  });

  it('only references catalogue keys that exist', () => {
    for (const entry of CAPABILITIES) {
      expect(Object.keys(ar)).toContain(entry.labelKey);
      expect(Object.keys(ar)).toContain(entry.bodyKey);
    }
  });
});
