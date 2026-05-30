import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, CircularProgress, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useAsync } from '../../hooks/useAsync';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { Airport, FlightPlanSummary } from '../../types/domain';
import { formatNumber } from '../../utils/format';
import { AirportAutocomplete } from './AirportAutocomplete';

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
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Airport Search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plan routes and evaluate operational intelligence from backend providers.
            </Typography>
            <AirportAutocomplete label="Departure" placeholder="Search departure airport" value={from} onSelect={setFrom} />
            <AirportAutocomplete label="Arrival" placeholder="Search arrival airport" value={to} onSelect={setTo} />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => { setFrom(to); setTo(from); }}>
                Swap
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => void searchRoutes()}
                disabled={!from || !to || loading}
              >
                Search Routes
              </Button>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">Loading candidate routes...</Typography>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Candidate Flight Plans
              </Typography>
              <Typography variant="body2" color="text.secondary">{flights.length} routes</Typography>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Distance</TableCell>
                    <TableCell>Waypoints</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flights.map((flight) => (
                    <TableRow key={flight.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {flight.fromICAO} to {flight.toICAO}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {flight.fromName} to {flight.toName}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatNumber(flight.distance)} km</TableCell>
                      <TableCell>{flight.waypoints.split(',').length}</TableCell>
                      <TableCell>{flight.source}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            store.setActiveRoute(flight.id);
                            navigate(`/flight/${flight.id}`);
                          }}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {!loading && flights.length === 0 ? <Alert severity="info">Search departure and arrival to load flight plans.</Alert> : null}
          </Stack>
        </Paper>
      </Grid>

      {store.recentSearches.length ? (
        <Grid size={12}>
          <Paper sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                Recent
              </Typography>
              {store.recentSearches.map((search) => (
                <Chip
                  key={`${search.fromICAO}-${search.toICAO}`}
                  size="small"
                  label={`${search.fromICAO} to ${search.toICAO}`}
                  onClick={() => void run(() => flightApi.searchFlightPlans(search.fromICAO, search.toICAO))}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      ) : null}
    </Grid>
  );
}
