import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { RouteMap } from '../../components/maps/RouteMap';
import { DEFAULT_AIRCRAFT } from '../../constants/aircraft';
import { useAsync } from '../../hooks/useAsync';
import { useLiveFlight } from '../../hooks/useLiveFlight';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { ActiveFlightsResult, FlightTrackResult, LiveFlight, RouteIntelligence } from '../../types/domain';
import { getFlightStableId } from '../../utils/flightIdentity';
import { formatNumber, riskLabel } from '../../utils/format';

export default function FlightDetailPage() {
  const { id } = useParams();
  const { data, error, loading, run } = useAsync<RouteIntelligence>();
  const activeFlights = useAsync<ActiveFlightsResult>();
  const selectedFlightDetail = useAsync<FlightTrackResult>();
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedFlightSnapshot, setSelectedFlightSnapshot] = useState<LiveFlight>();
  const [selectedMissingSince, setSelectedMissingSince] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const flights = activeFlights.data?.flights ?? [];
  const selectedFromList = selectedFlightId ? flights.find((flight) => getFlightStableId(flight) === selectedFlightId) : undefined;
  const selectedFlight = selectedFromList ?? selectedFlightSnapshot;
  const liveFlight = useLiveFlight(selectedFlight?.provider, selectedFlight?.id, id);
  const selectedFlightForUi = liveFlight.detail?.flight ?? selectedFlight;
  const selectedStableId = selectedFlightForUi ? getFlightStableId(selectedFlightForUi) : null;
  const store = useAppStore();

  const metrics = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Distance', value: `${formatNumber(data.flight.distance)} km` },
      { label: 'Route Risk', value: `${data.routeWeight.toFixed(1)} / 10` },
      { label: 'Fuel', value: `${formatNumber(data.fuel.fuelKg)} kg` },
      { label: 'CO2', value: `${formatNumber(data.fuel.co2Kg)} kg` },
    ];
  }, [data]);

  const selectFlight = (flight: LiveFlight) => {
    const stableId = getFlightStableId(flight);
    setSelectedFlightId(stableId);
    setSelectedFlightSnapshot(flight);
    setSelectedMissingSince(null);
  };

  useEffect(() => {
    if (id) {
      store.setActiveRoute(id);
      void run(() => flightApi.getRouteIntelligence(id, DEFAULT_AIRCRAFT));
      void activeFlights.run(() => flightApi.getActiveFlights(id));
    }
  }, [activeFlights.run, id, run, store.setActiveRoute]);

  useEffect(() => {
    if (!selectedFlightId) {
      setSelectedFlightSnapshot(undefined);
      setSelectedMissingSince(null);
      return;
    }

    if (selectedFromList) {
      setSelectedFlightSnapshot(selectedFromList);
      setSelectedMissingSince(null);
      return;
    }

    setSelectedMissingSince((value) => value ?? Date.now());
  }, [selectedFlightId, selectedFromList]);

  useEffect(() => {
    if (!selectedFlightId || selectedFromList || selectedMissingSince === null) return;
    const timeoutRemaining = Math.max(30_000 - (Date.now() - selectedMissingSince), 0);
    const timer = window.setTimeout(() => {
      setSelectedFlightId(null);
      setSelectedFlightSnapshot(undefined);
      setSelectedMissingSince(null);
    }, timeoutRemaining);
    return () => window.clearTimeout(timer);
  }, [selectedFlightId, selectedFromList, selectedMissingSince]);

  useEffect(() => {
    if (selectedFlightForUi) {
      void selectedFlightDetail.run(() => flightApi.getFlightTrack(selectedFlightForUi.provider, selectedFlightForUi.id));
    }
  }, [selectedFlightDetail.run, selectedFlightForUi]);

  useEffect(() => {
    flightApi.getProviders().then(store.setProviderStatus).catch(() => undefined);
  }, [store.setProviderStatus]);

  function exportSummary() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.flight.id}-route-intelligence.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={20} />
        <Typography>Loading route intelligence...</Typography>
      </Stack>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Alert severity="info">Route not found.</Alert>;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, xl: 3 }}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Stack spacing={2}>
            <Button component={Link} to="/" startIcon={<ArrowBackIcon />} variant="outlined">
              Back to Routes
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {data.flight.fromICAO} to {data.flight.toICAO}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.flight.fromName} to {data.flight.toName}
            </Typography>
            <Chip label={riskLabel(data.routeWeight)} color={data.routeWeight > 6 ? 'warning' : 'primary'} />
            <Grid container spacing={1}>
              {metrics.map((metric) => (
                <Grid size={6} key={metric.label}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metric.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportSummary}>
              Export JSON
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="h6" sx={{ px: 1, pb: 1, fontWeight: 700 }}>
            2D Route and Live Traffic
          </Typography>
          <Box className="map-shell">
            <RouteMap
              nodes={data.flight.route.nodes}
              activeFlights={activeFlights.data?.flights}
              selectedFlight={selectedFlightForUi}
              trackPoints={selectedFlightDetail.data?.points}
              onSelectFlight={selectFlight}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, xl: 3 }}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Active Flights
              </Typography>
              <Typography variant="caption" color="text.secondary">{liveFlight.status === 'live' ? 'Live' : 'Fallback'}</Typography>
            </Stack>
            {activeFlights.loading ? <CircularProgress size={18} /> : null}
            {activeFlights.error ? <Alert severity="warning">{activeFlights.error}</Alert> : null}

            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Callsign</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Alt (m)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flights.map((flight) => {
                    const stableId = getFlightStableId(flight);
                    const isSelected = selectedStableId === stableId;
                    return (
                      <TableRow
                        key={stableId}
                        hover
                        selected={isSelected}
                        onClick={() => selectFlight(flight)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{flight.callsign ?? flight.id}</Typography>
                            {flight.demo ? <Chip size="small" label="Demo" color="warning" /> : null}
                          </Stack>
                        </TableCell>
                        <TableCell>{flight.aircraftType ?? 'Unknown'}</TableCell>
                        <TableCell align="right">{formatNumber(flight.altitudeMeters ?? 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Tabs value={detailTab} onChange={(_, value) => setDetailTab(value)} variant="fullWidth">
              <Tab label="Telemetry" />
              <Tab label="Weather" />
            </Tabs>
            {detailTab === 0 ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">Provider: {selectedFlightForUi?.provider ?? '-'}</Typography>
                <Typography variant="body2">Callsign: {selectedFlightForUi?.callsign ?? selectedFlightForUi?.id ?? '-'}</Typography>
                <Typography variant="body2">Speed: {formatNumber(selectedFlightForUi?.speedKnots ?? 0)} kt</Typography>
                <Typography variant="body2">Heading: {formatNumber(selectedFlightForUi?.headingDegrees ?? 0)} deg</Typography>
                <Typography variant="body2">
                  Track: {selectedFlightDetail.data?.available ? `${selectedFlightDetail.data.points.length} points` : 'Unavailable'}
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1}>
                {data.weather.slice(0, 5).map((point) => (
                  <Paper key={point.ident} variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {point.ident}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {point.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
