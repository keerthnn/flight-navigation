import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import { useAsync } from '../../hooks/useAsync';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { Airport, FlightPlanSummary } from '../../types/domain';
import { AirportAutocomplete } from './AirportAutocomplete';
import { RouteCard } from './RouteCard';

function WorldBackdrop() {
  const lines = Array.from({ length: 14 }).map((_, index) => (
    <path key={index} d={`M -20 ${70 + index * 50} C 300 ${120 + index * 30}, 1000 ${40 + index * 20}, 1480 ${150 + index * 40}`} stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="8 6" style={{ animation: `shimmer ${18 + index}s linear infinite` }} />
  ));
  return <svg viewBox="0 0 1440 900" width="100%" height="100%" style={{ position: 'fixed', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>{lines}</svg>;
}

export default function RouteSearchPage() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [from, setFrom] = useState<Airport | undefined>(store.selectedFrom);
  const [to, setTo] = useState<Airport | undefined>(store.selectedTo);
  const { data: flights = [], error, loading, run } = useAsync<FlightPlanSummary[]>();

  async function searchRoutes() {
    if (!from || !to) return;
    store.selectFrom(from);
    store.selectTo(to);
    store.recordSearch(from.icao, to.icao);
    await run(() => flightApi.searchFlightPlans(from.icao, to.icao));
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 100px)', display: 'grid', placeItems: 'center', position: 'relative' }}>
      <WorldBackdrop />
      <Stack spacing={2} sx={{ width: 'min(100%, 860px)', position: 'relative', zIndex: 1 }}>
        <Paper sx={{ p: { xs: 2, md: '32px 40px' }, borderRadius: 2 }}>
          <Stack spacing={1.5}>
            <FlightTakeoffIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h1">Plan your route</Typography>
            <Typography variant="body2" color="text.secondary">Search airports, view live traffic and risk analysis</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems="center">
              <Box sx={{ flex: 1, width: '100%' }}><AirportAutocomplete label="Departure" placeholder="Search departure airport" value={from} onSelect={setFrom} /></Box>
              <Button aria-label="Swap departure and arrival" onClick={() => { setFrom(to); setTo(from); }} sx={{ minWidth: 40, minHeight: 40, borderRadius: '50%', animation: 'var(--anim-spring)' }}><SwapHorizIcon /></Button>
              <Box sx={{ flex: 1, width: '100%' }}><AirportAutocomplete label="Arrival" placeholder="Search arrival airport" value={to} onSelect={setTo} /></Box>
            </Stack>
            <Button variant="contained" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />} disabled={!from || !to || loading} onClick={() => void searchRoutes()} sx={{ height: 48, backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)', backgroundSize: '200%' }}>
              {loading ? 'Searching...' : 'Search Routes'}
            </Button>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={1.2}>
          {flights.length ? flights.map((flight, index) => (
            <RouteCard key={flight.id} flight={flight} index={index} onOpen={() => {
              store.setActiveRoute(flight.id);
              navigate(`/flight/${flight.id}`);
            }} />
          )) : !loading ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">No routes found for this pair. Try swapping airports.</Typography>
            </Paper>
          ) : null}
        </Stack>
      </Stack>
      <FlightLandIcon sx={{ position: 'fixed', right: 16, bottom: 16, opacity: 0.12 }} />
    </Box>
  );
}
