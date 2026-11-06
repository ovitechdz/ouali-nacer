import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { changeLanguage } from '@/i18n';

import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('marks the current language and switches to French', async () => {
    await changeLanguage('ar');
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Français' }));

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('fr');
      expect(document.documentElement.dir).toBe('ltr');
    });

    await changeLanguage('ar');
  });
});
