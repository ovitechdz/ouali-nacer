import type { IdGenerator } from '@/ports/ids';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(timestamp: number): string {
  let value = timestamp;
  let out = '';
  for (let index = 0; index < 10; index += 1) {
    out = CROCKFORD[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(): string {
  const bytes = new Uint8Array(10);
  globalThis.crypto.getRandomValues(bytes);

  let buffer = 0;
  let bits = 0;
  let out = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

/** ULID: 48-bit timestamp + 80-bit randomness, 26 Crockford base32 characters. */
export class UlidGenerator implements IdGenerator {
  next(): string {
    return encodeTime(Date.now()) + encodeRandom();
  }
}
