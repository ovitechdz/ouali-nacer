import { describe, expect, it } from 'vitest';

import { NOW, engineAnimals, engineFeed, makeDocument } from '@/test/factories';

import { referenceCases, runAllCases, runEngineCase } from './engine-cases';

describe('engine verification cases', () => {
  const document = makeDocument({ animals: engineAnimals(), feedLots: engineFeed() });

  it('runs TC-01…TC-08 against the fixture and all pass', () => {
    const results = runAllCases(document, NOW);
    expect(results).toHaveLength(8);
    for (const result of results) {
      expect(result.failures, result.id).toEqual([]);
      expect(result.ok, result.id).toBe(true);
    }
  });

  it('covers every documented behaviour', () => {
    const cases = referenceCases();
    expect(cases.map((entry) => entry.id)).toEqual([
      'TC-01',
      'TC-02',
      'TC-03',
      'TC-04',
      'TC-05',
      'TC-06',
      'TC-07',
      'TC-08',
    ]);
    expect(cases.filter((entry) => !entry.expect.emits)).toHaveLength(3);
  });

  it('reports a missing animal instead of inventing a case', () => {
    const result = runEngineCase(referenceCases()[0]!, [], NOW);
    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(['missing-animal']);
    expect(result.rec).toBeNull();
  });

  it('reports a failed expectation', () => {
    const failing = {
      ...referenceCases()[0]!,
      expect: { emits: false },
    };
    const result = runEngineCase(failing, engineAnimals(), NOW);
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('unexpected-ration');
  });
});
