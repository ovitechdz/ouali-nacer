import { describe, expect, it } from 'vitest';

import { makeAnimal } from '@/test/factories';

import { normalizeIdentity, resolveScan } from './identity';

describe('identity resolution', () => {
  const animals = [
    makeAnimal({ id: 'an-1', code: 'OV-2401', rfid: 'RFID-001' }),
    makeAnimal({ id: 'an-2', code: 'OV-2402', rfid: 'RFID-002' }),
    makeAnimal({ id: 'an-3', code: 'OV-9999', rfid: '' }),
  ];

  it('normalizes case, spaces and separators', () => {
    expect(normalizeIdentity(' ov-24 01 ')).toBe('OV2401');
  });

  it('resolves exact RFID and code matches', () => {
    expect(resolveScan('rfid-001', animals)).toEqual({ kind: 'ok', animal: animals[0] });
    expect(resolveScan('ov-2402', animals)).toEqual({ kind: 'ok', animal: animals[1] });
  });

  it('resolves a truncated suffix read', () => {
    expect(resolveScan('2401', animals)).toEqual({ kind: 'ok', animal: animals[0] });
  });

  it('returns unknown for an absent tag', () => {
    expect(resolveScan('OV-0000', animals)).toEqual({ kind: 'unknown', query: 'OV-0000' });
  });

  it('returns unreadable for empty, error or interrogative reads', () => {
    expect(resolveScan('', animals).kind).toBe('unreadable');
    expect(resolveScan('ERR', animals).kind).toBe('unreadable');
    expect(resolveScan('ERROR', animals).kind).toBe('unreadable');
    expect(resolveScan('RFID?', animals).kind).toBe('unreadable');
  });

  it('does not resolve an ambiguous suffix', () => {
    const ambiguous = [
      makeAnimal({ id: 'a', code: 'OV-1001', rfid: 'A-1001' }),
      makeAnimal({ id: 'b', code: 'OV-2001', rfid: 'B-1001' }),
    ];
    expect(resolveScan('1001', ambiguous).kind).toBe('unknown');
  });

  it('never matches an empty RFID against everything', () => {
    expect(resolveScan('XYZ', animals).kind).toBe('unknown');
  });
});
