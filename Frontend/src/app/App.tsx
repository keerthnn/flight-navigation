import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppLayout } from '../components/layout/AppLayout';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { LoadingState } from '../components/feedback/LoadingState';
import { FlightDetailProvider } from '../context/FlightDetailContext';

const RouteSearchPage = lazy(() => import('../features/route-search/RouteSearchPage'));
const FlightDetailPage = lazy(() => import('../features/flight-detail/FlightDetailPage'));

function FlightDetailRoute() {
  const { id } = useParams();
  if (!id) return <Navigate to="/" replace />;
  return (
    <FlightDetailProvider routeId={id}>
      <FlightDetailPage />
    </FlightDetailProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <HashRouter>
          <AppLayout>
            <Suspense fallback={<LoadingState label="Preparing aviation workspace" />}>
              <Routes>
                <Route path="/" element={<RouteSearchPage />} />
                <Route path="/flight/:id" element={<FlightDetailRoute />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </HashRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
