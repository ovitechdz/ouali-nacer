import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';

describe('ui primitives', () => {
  it('renders a button with an explicit non-submitting type', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).toContain('bg-accent-strong');
    expect(button.className).toContain('text-accent-contrast');
  });

  it('supports secondary and ghost variants', () => {
    const { rerender } = render(<Button variant="secondary">One</Button>);
    expect(screen.getByRole('button', { name: 'One' }).className).toContain('bg-surface-3');
    rerender(<Button variant="ghost">One</Button>);
    expect(screen.getByRole('button', { name: 'One' }).className).toContain('text-fg-muted');
  });

  it('renders badges and cards', () => {
    render(
      <Card data-testid="card">
        <Badge tone="accent">Phase</Badge>
      </Card>,
    );
    expect(screen.getByTestId('card').className).toContain('rounded-2xl');
    expect(screen.getByText('Phase').className).toContain('text-success');
  });
});
