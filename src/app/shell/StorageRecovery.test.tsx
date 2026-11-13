import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFarmStore } from '@/store/farm-store';
import { renderApp } from '@/test/render-app';

describe('StorageRecovery', () => {
  beforeEach(() => {
    useFarmStore.setState({ storageIssue: null });
  });

  it('surfaces the quota recovery panel and links to the backup page', async () => {
    useFarmStore.setState({ storageIssue: 'quota' });
    await renderApp('/');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('مساحة التخزين ممتلئة')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'فتح النسخ الاحتياطي' });
    expect(link).toHaveAttribute('href', '/sync');

    fireEvent.click(screen.getByRole('button', { name: 'متابعة مؤقتة' }));
    expect(useFarmStore.getState().storageIssue).toBeNull();
  });

  it('stays hidden without a quota issue', async () => {
    await renderApp('/');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
