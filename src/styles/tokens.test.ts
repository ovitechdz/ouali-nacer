import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Colour-contrast guard.
 *
 * Parses the real token layer so any future token edit that breaks an
 * accessibility pair fails CI. Thresholds follow WCAG 2.x:
 * 4.5:1 for normal text, 3:1 for large text and UI components.
 */

const tokenCss = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6,8})\\s*;`).exec(tokenCss);
  const value = match?.[1];
  if (!value) throw new Error(`Missing colour token: --color-${name}`);
  return value.toLowerCase();
}

function parseHex(hex: string): Rgb {
  const raw = hex.replace('#', '');
  if (raw.length !== 6 && raw.length !== 8) {
    throw new Error(`Unsupported hex colour: ${hex}`);
  }
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
    a: raw.length === 8 ? Number.parseInt(raw.slice(6, 8), 16) / 255 : 1,
  };
}

function composite(fg: Rgb, bg: Rgb): Rgb {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function luminance({ r, g, b }: Rgb): number {
  const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(fgHex: string, bgHex: string): number {
  const surface = parseHex(token('surface'));
  const bg = parseHex(bgHex);
  const opaqueBg = bg.a < 1 ? composite(bg, surface) : bg;
  const fg = parseHex(fgHex);
  const opaqueFg = fg.a < 1 ? composite(fg, opaqueBg) : fg;

  const fgLuminance = luminance(opaqueFg);
  const bgLuminance = luminance(opaqueBg);
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

interface Pair {
  label: string;
  fg: string;
  bg: string;
  min: number;
}

const NORMAL_TEXT = 4.5;
const LARGE_TEXT_OR_UI = 3;

const pairs: Pair[] = [
  // Solid primary button: label on the resting fill and on the hover fill.
  {
    label: 'primary label on accent-strong',
    fg: 'accent-contrast',
    bg: 'accent-strong',
    min: NORMAL_TEXT,
  },
  { label: 'primary label on accent hover', fg: 'accent-contrast', bg: 'accent', min: NORMAL_TEXT },
  // Secondary and ghost button labels.
  { label: 'secondary label on surface-3', fg: 'fg', bg: 'surface-3', min: NORMAL_TEXT },
  { label: 'ghost label on surface-3', fg: 'fg-muted', bg: 'surface-3', min: NORMAL_TEXT },
  { label: 'ghost label on surface-2', fg: 'fg-muted', bg: 'surface-2', min: NORMAL_TEXT },
  // Accent text, dots and icons on every approved surface.
  { label: 'accent text on surface', fg: 'accent', bg: 'surface', min: NORMAL_TEXT },
  { label: 'accent text on surface-2', fg: 'accent', bg: 'surface-2', min: NORMAL_TEXT },
  { label: 'accent text on surface-3', fg: 'accent', bg: 'surface-3', min: NORMAL_TEXT },
  // Accent used as a UI component (fill, dot or focus ring) against surfaces.
  {
    label: 'accent-strong UI on surface',
    fg: 'accent-strong',
    bg: 'surface',
    min: LARGE_TEXT_OR_UI,
  },
  {
    label: 'accent-strong UI on surface-2',
    fg: 'accent-strong',
    bg: 'surface-2',
    min: LARGE_TEXT_OR_UI,
  },
  {
    label: 'accent-strong UI on surface-3',
    fg: 'accent-strong',
    bg: 'surface-3',
    min: LARGE_TEXT_OR_UI,
  },
  { label: 'accent UI on surface', fg: 'accent', bg: 'surface', min: LARGE_TEXT_OR_UI },
  { label: 'accent UI on surface-2', fg: 'accent', bg: 'surface-2', min: LARGE_TEXT_OR_UI },
];

describe('WCAG colour pairs', () => {
  it.each(pairs)('$label meets $min:1', ({ fg, bg, min }) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it('keeps the AA-safe solid primary tokens', () => {
    expect(token('accent-strong')).toBe('#009966');
    expect(token('accent-contrast')).toBe('#04120c');
    expect(token('accent')).toBe('#00d492');
  });

  it('defines an opaque header fallback and a translucent blur value', () => {
    expect(token('surface-header')).toMatch(/^#[0-9a-f]{6}[0-9a-f]{2}$/);
    expect(token('surface-header-solid')).toBe('#101827');
  });
});
