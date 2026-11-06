import { describe, expect, it } from 'vitest';

import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('returns the current time', () => {
    const before = Date.now();
    const value = new SystemClock().now().getTime();
    const after = Date.now();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });
});
