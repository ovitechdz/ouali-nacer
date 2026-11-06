import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins class names and ignores falsy values', () => {
    expect(cn('a', undefined, null, 'c')).toBe('a c');
  });

  it('lets later Tailwind utilities win', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4');
  });
});
