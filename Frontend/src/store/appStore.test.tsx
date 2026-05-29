import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppStoreProvider, useAppStore } from './appStore';

function StoreHarness() {
  const store = useAppStore();
  return (
    <div>
      <button type="button" onClick={() => store.recordSearch('VIDP', 'VOBL')}>
        Record
      </button>
      <span>{store.recentSearches[0]?.fromICAO ?? 'empty'}</span>
    </div>
  );
}

describe('AppStoreProvider', () => {
  it('records recent searches in centralized state', async () => {
    render(
      <AppStoreProvider>
        <StoreHarness />
      </AppStoreProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Record' }));

    expect(screen.getByText('VIDP')).toBeInTheDocument();
  });
});
