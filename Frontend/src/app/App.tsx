import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppLayout } from '../components/layout/AppLayout';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { LoadingState } from '../components/feedback/LoadingState';

const RouteSearchPage = lazy(() => import('../features/route-search/RouteSearchPage'));
const FlightDetailPage = lazy(() => import('../features/flight-detail/FlightDetailPage'));

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<LoadingState label="Preparing aviation workspace" />}>
              <Routes>
                <Route path="/" element={<RouteSearchPage />} />
                <Route path="/flight/:id" element={<FlightDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
