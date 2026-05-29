import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import RouteSearchPage from './RouteSearchPage';

describe('RouteSearchPage', () => {
  it('renders the route planning dashboard', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <RouteSearchPage />
        </MemoryRouter>
      </AppProviders>,
    );

    expect(screen.getByRole('heading', { name: /plan resilient routes/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Departure')).toBeInTheDocument();
    expect(screen.getByLabelText('Arrival')).toBeInTheDocument();
  });
});
