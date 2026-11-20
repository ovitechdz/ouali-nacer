import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TeamPage, mailtoHref, telHref, whatsappHref } from '@/pages/TeamPage';
import {
  expectDialogClosed,
  panel,
  registerFixture,
  renderPage,
  setValue,
} from '@/test/interactions-harness';

registerFixture();

/** A generated href must actually parse as the expected URI scheme. */
function validUri(value: string | null, protocol: string): string {
  expect(value).not.toBeNull();
  const href = value as string;
  expect(new URL(href).protocol).toBe(protocol);
  return href;
}

describe('team contact URIs (S-07)', () => {
  it('keeps a single leading + and only digits in tel: links', () => {
    expect(validUri(telHref('+213 550 50 76 94'), 'tel:')).toBe('tel:+213550507694');
    expect(validUri(telHref('(213) 550-50-76-94'), 'tel:')).toBe('tel:213550507694');
    expect(validUri(telHref('++213 55'), 'tel:')).toBe('tel:+21355');
    expect(telHref('extension')).toBeNull();
  });

  it('validates addresses and encodes only the local part of mailto: links', () => {
    expect(validUri(mailtoHref(' user+ovitech@example.dz '), 'mailto:')).toBe(
      'mailto:user%2Bovitech@example.dz',
    );
    expect(validUri(mailtoHref('nacer@example.dz'), 'mailto:')).toBe('mailto:nacer@example.dz');
    expect(mailtoHref('user@example.dz?subject=Hello')).toBeNull();
    expect(mailtoHref('not-an-email')).toBeNull();
  });

  it('leaves the archived WhatsApp deep links unchanged', () => {
    expect(whatsappHref('wa.me/213797631321?text=Bonjour')).toBe(
      'https://wa.me/213797631321?text=Bonjour',
    );
  });

  it('renders valid mailto:/tel: hrefs for a session member', async () => {
    await renderPage('/equipe', TeamPage);

    fireEvent.click(screen.getAllByRole('button', { name: 'Add a member' })[0]!);
    const form = panel();
    setValue(/Full name/, 'Test Member', form);
    setValue(/Role/, 'Observer', form);
    setValue(/Email/, 'test+ovitech@example.dz', form);
    setValue(/Phone/, '+213 600 00 00 00', form);
    fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
    await expectDialogClosed();

    fireEvent.click(await screen.findByRole('button', { name: /Test Member/ }));
    const detail = await screen.findByRole('dialog');
    const email = within(detail).getByRole('link', { name: 'test+ovitech@example.dz' });
    const phone = within(detail).getByRole('link', { name: '+213 600 00 00 00' });
    expect(email).toHaveAttribute(
      'href',
      validUri(mailtoHref('test+ovitech@example.dz'), 'mailto:'),
    );
    expect(phone).toHaveAttribute('href', validUri(telHref('+213 600 00 00 00'), 'tel:'));
  });
});
