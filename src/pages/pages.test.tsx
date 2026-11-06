import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';
import { OfflinePage } from './OfflinePage';
import { StatusPage } from './StatusPage';
import { TeamPage } from './TeamPage';

describe('phase-3 pages', () => {
  it('renders the home placeholder in Arabic', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'أساس المنصة' })).toBeInTheDocument();
    expect(screen.getByText('محلي أولاً')).toBeInTheDocument();
  });

  it('renders the team placeholder without inventing members', () => {
    render(<TeamPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'فريق العمل' })).toBeInTheDocument();
    expect(screen.getByText('الصفحة قيد النقل')).toBeInTheDocument();
    expect(screen.queryByText(/Ouali/)).not.toBeInTheDocument();
  });

  it('lists what actually works on the status page', () => {
    render(<StatusPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'حالة النظام' })).toBeInTheDocument();
    expect(screen.getByText('محول ذاكرة للاختبار فقط — لا قاعدة بيانات بعد')).toBeInTheDocument();
  });

  it('renders the offline placeholder', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'أنت غير متصل' })).toBeInTheDocument();
  });
});
