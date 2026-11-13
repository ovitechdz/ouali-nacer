import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CAPABILITIES } from '@/app/capabilities';
import { StatusPage } from './StatusPage';
import { CamerasPage, GatesPage, IotPage, ScalePage } from './ecosystem/EcosystemPages';

const MODULES = [
  ['cameras', CamerasPage],
  ['portails', GatesPage],
  ['balance', ScalePage],
  ['iot', IotPage],
] as const;

describe('class-C simulation labels', () => {
  it.each(MODULES)('marks the %s module as a simulation', (_name, Page) => {
    render(<Page />);
    expect(screen.getAllByText('محاكاة').length).toBeGreaterThan(0);
    expect(screen.getAllByText('غير موصولة').length).toBeGreaterThan(0);
  });

  it('renders exactly the registry capabilities and labels every class-C row', () => {
    const { container } = render(<StatusPage />);
    const rows = container.querySelectorAll('[data-capability]');
    expect(rows.length).toBe(CAPABILITIES.length);
    for (const capability of CAPABILITIES) {
      const row = container.querySelector(`[data-capability="${capability.id}"]`);
      expect(row).not.toBeNull();
      if (capability.class === 'C') {
        expect(row?.textContent).toContain('محاكاة');
      }
    }
  });
});
