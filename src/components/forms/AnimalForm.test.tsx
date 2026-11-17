import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NewAnimalInput } from '@/domain';
import { i18n } from '@/i18n';
import { AnimalForm } from './AnimalForm';

const submitLabel = 'Enregistrer';

function control(container: HTMLElement, id: string): HTMLInputElement {
  const element = container.querySelector(`#${id}`);
  if (!element) throw new Error(`missing #${id}`);
  return element as HTMLInputElement;
}

describe('AnimalForm', () => {
  it('refuses an incomplete animal before it calls the command', () => {
    const onSubmit = vi.fn(async (_input: NewAnimalInput) => true);
    render(<AnimalForm pens={['A1']} submitLabel={submitLabel} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: submitLabel }));

    expect(screen.getByText(i18n.t('herd.required'))).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends trimmed values and accepts a typed pen when the farm has none yet', () => {
    const onSubmit = vi.fn(async (_input: NewAnimalInput) => true);
    const { container } = render(
      <AnimalForm pens={[]} submitLabel={submitLabel} onSubmit={onSubmit} />,
    );

    // No pens on the farm: the pen becomes a free-text control, not a select.
    expect(container.querySelector('select#animal-pen')).toBeNull();

    fireEvent.change(control(container, 'animal-code'), { target: { value: '  OV-9001 ' } });
    fireEvent.change(control(container, 'animal-rfid'), { target: { value: ' RFID-9001 ' } });
    fireEvent.change(control(container, 'animal-breed'), { target: { value: ' Ouled Djellal ' } });
    fireEvent.change(control(container, 'animal-pen'), { target: { value: ' B4 ' } });
    fireEvent.change(control(container, 'animal-weight'), { target: { value: '44.5' } });
    fireEvent.change(control(container, 'animal-bcs'), { target: { value: '3.5' } });
    fireEvent.change(control(container, 'animal-notes'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: submitLabel }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const input = onSubmit.mock.calls.at(0)?.at(0);
    expect(input).toMatchObject({
      code: 'OV-9001',
      rfid: 'RFID-9001',
      breed: 'Ouled Djellal',
      pen: 'B4',
      weight: 44.5,
      bcs: 3.5,
    });
    expect(input?.notes).toBeUndefined();
  });

  it('shows the domain error when the command rejects the input', async () => {
    const onSubmit = vi.fn(async (_input: NewAnimalInput) => false);
    render(
      <AnimalForm
        pens={['A1']}
        defaults={{ code: 'OV-1', rfid: 'R-1', breed: 'Ouled Djellal' }}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: submitLabel }));

    expect(await screen.findByText(i18n.t('domain.error.invalid'))).toBeInTheDocument();
  });
});
