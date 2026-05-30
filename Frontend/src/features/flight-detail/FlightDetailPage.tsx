import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Drawer,
  Fab,
  Paper,
  Stack,
  SwipeableDrawer,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import RadarIcon from '@mui/icons-material/Radar';
import TimelineIcon from '@mui/icons-material/Timeline';
import CloudIcon from '@mui/icons-material/Cloud';
import RuleIcon from '@mui/icons-material/Rule';
import { useFlightDetail } from '../../context/FlightDetailContext';
import { PanelErrorBoundary } from '../../components/errors/PanelErrorBoundary';
import { LeftPanelSkeleton, RightPanelSkeleton } from '../../components/skeletons';
import { LeftPanel } from '../../components/panels/LeftPanel';
import { RouteMap } from '../../components/maps/RouteMap';
import { Units } from '../../utils/units';
import { Compass } from '../../components/telemetry/Compass';
import { AltimeterStrip } from '../../components/telemetry/AltimeterStrip';
import { PilotDecisionCard } from '../../components/panels/PilotDecisionCard';
import { CBWarningBanner } from '../../components/panels/CBWarningBanner';
import { getFlightStableId } from '../../utils/flightIdentity';

function OperationsContent({ activeTab }: { activeTab: 1 | 2 | 3 }) {
  const detail = useFlightDetail();
  if (!detail.intelligence) return null;

  const selected = detail.liveFlight;
  const altitudeFt = selected?.altitudeMeters ? Units.metersToFeet(selected.altitudeMeters) : 0;

  if (activeTab === 1) {
    return (
      <Stack spacing={1.2} sx={{ mt: 1 }}>
        <Stack spacing={0.2}>
          <Typography variant="caption" color="text.secondary">Selected Aircraft</Typography>
          <Typography variant="numeric" sx={{ fontSize: 22 }}>{selected?.callsign ?? 'Select flight from traffic list'}</Typography>
          <Typography variant="caption" color="text.secondary">Provider: {selected?.provider ?? '-'} · Last {selected?.lastSeen ? Units.formatUtcTime(selected.lastSeen) : '-'}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="stretch">
          <Compass heading={selected?.headingDegrees ?? 0} />
          <Paper sx={{ p: 1, flex: 1, bgcolor: 'background.surface', display: 'grid', alignContent: 'center' }}>
            <Typography variant="caption">Ground Speed</Typography>
            <Typography variant="numeric" sx={{ fontSize: 28 }}>{Math.round(selected?.speedKnots ?? 0)} kt</Typography>
            <Typography variant="caption" color="text.secondary">Heading {Math.round(selected?.headingDegrees ?? 0)} deg</Typography>
          </Paper>
          <AltimeterStrip altitudeFt={altitudeFt} />
        </Stack>
      </Stack>
    );
  }

  if (activeTab === 2) {
    return (
      <Stack spacing={0.8} sx={{ mt: 1, maxHeight: 280, overflow: 'auto' }}>
        {detail.intelligence.weather.map((point) => (
          <Paper key={point.ident} sx={{ p: 1, borderLeft: '4px solid', borderColor: point.visibilityMeters / 1000 < 1.6 ? 'error.main' : point.visibilityMeters / 1000 < 3 ? 'warning.main' : point.visibilityMeters / 1000 < 5 ? 'info.main' : 'success.main' }}>
            <Typography variant="numeric">{point.ident}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>{point.description}</Typography>
            <Typography variant="caption" color="text.secondary">Wind {Units.msToKnots(point.windSpeedMps)} kt · Vis {(point.visibilityMeters / 1000).toFixed(1)} km</Typography>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <PilotDecisionCard
      decision={detail.pilotDecision}
      intelligence={detail.intelligence}
      sunriseSunset={detail.sunriseSunset}
      flightId={detail.intelligence.flight.id}
    />
  );
}

function RightPanel({ tabOverride }: { tabOverride?: 0 | 1 | 2 | 3 }) {
  const detail = useFlightDetail();
  const [tab, setTab] = useState(0);

  if (detail.intelligenceLoading) return <RightPanelSkeleton />;
  if (!detail.intelligence) return <Alert severity="info">Route not found.</Alert>;

  const activeTab = tabOverride ?? tab;

  return (
    <Stack spacing={1.2} sx={{ animation: 'slide-from-right var(--anim-slow) forwards' }}>
      {detail.hasCB ? <CBWarningBanner affectedNodes={detail.cbNodes} /> : null}
      {activeTab === 0 ? (
        <Paper sx={{ p: 1.2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3">Traffic Near Corridor</Typography>
            <Chip size="small" label={`${detail.activeFlights.length} aircraft`} />
          </Stack>
          <Typography variant="caption" color="text.secondary" role="status" aria-live="polite">Updated {detail.activeFlightsFreshnessMs !== null ? `${Math.round(detail.activeFlightsFreshnessMs / 1000)}s ago` : '-'}</Typography>

          <TableContainer sx={{ maxHeight: 260, mt: 0.8 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Callsign</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Alt</TableCell>
                  <TableCell>Speed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.activeFlights.map((flight) => {
                  const selectedRow = detail.selectedFlightId === getFlightStableId(flight);
                  const ft = flight.altitudeMeters ? Units.metersToFeet(flight.altitudeMeters) : 0;
                  return (
                    <TableRow
                      key={getFlightStableId(flight)}
                      hover
                      selected={selectedRow}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => detail.setSelectedFlightId(getFlightStableId(flight))}
                    >
                      <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>{flight.callsign ?? flight.id}</TableCell>
                      <TableCell>{flight.aircraftType ?? '-'}</TableCell>
                      <TableCell sx={{ color: ft < 10000 ? 'warning.main' : ft > 28000 ? 'success.main' : 'info.main', fontFamily: 'JetBrains Mono, monospace' }}>{ft}</TableCell>
                      <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(flight.speedKnots ?? 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      {activeTab !== 0 || tabOverride === undefined ? (
        <Paper sx={{ p: 1.2 }}>
          {tabOverride === undefined ? (
          <Tabs className="right-panel-tabs" value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
            <Tab icon={<TimelineIcon />} label="Telemetry" />
            <Tab icon={<CloudIcon />} label="Weather" />
            <Tab icon={<RuleIcon />} label="Decision" />
          </Tabs>
          ) : null}

          {activeTab !== 0 ? <OperationsContent activeTab={activeTab as 1 | 2 | 3} /> : null}
        </Paper>
      ) : null}
    </Stack>
  );
}

function DesktopRightPanel() {
  const [tab, setTab] = useState(1);
  return (
    <Stack spacing={1.2} sx={{ animation: 'slide-from-right var(--anim-slow) forwards' }}>
      <RightPanel tabOverride={0} />
      <Paper sx={{ p: 1.2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">Operations</Typography>
        </Stack>
        <Tabs className="right-panel-tabs" value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth" sx={{ mt: 1 }}>
          <Tab icon={<TimelineIcon />} label="Telemetry" />
          <Tab icon={<CloudIcon />} label="Weather" />
          <Tab icon={<RuleIcon />} label="Decision" />
        </Tabs>
        <OperationsContent activeTab={(tab + 1) as 1 | 2 | 3} />
      </Paper>
    </Stack>
  );
}

function LeftPanelSlot() {
  const detail = useFlightDetail();
  if (detail.intelligenceLoading) return <LeftPanelSkeleton />;
  if (detail.intelligenceError || !detail.intelligence) return <Alert severity="error">{detail.intelligenceError ?? 'Route not found'}</Alert>;

  return (
    <LeftPanel
      intelligence={detail.intelligence}
      midpointWeather={detail.midpointWeather}
      sunriseSunset={detail.sunriseSunset}
      pilotDecision={detail.pilotDecision}
      isNightOperation={detail.isNightOperation}
      selectedWaypointIndex={detail.selectedWaypointIndex}
      onSelectWaypointIndex={(index) => detail.setSelectedWaypointIndex(index)}
    />
  );
}

export default function FlightDetailPage() {
  const detail = useFlightDetail();
  const theme = useTheme();
  const lt1400 = useMediaQuery(theme.breakpoints.down(1400));
  const lt1100 = useMediaQuery(theme.breakpoints.down(1100));
  const lt900 = useMediaQuery(theme.breakpoints.down(900));
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);

  const mapPanel = useMemo(() => (
    <Paper sx={{ p: 1, height: '100%', animation: 'fade-in var(--anim-slow) forwards' }}>
      {detail.intelligence ? (
        <RouteMap
          nodes={detail.intelligence.flight.route.nodes}
          activeFlights={detail.activeFlights}
          selectedFlight={detail.liveFlight ?? undefined}
          onSelectFlight={(flight) => detail.setSelectedFlightId(getFlightStableId(flight))}
          selectedWaypointIndex={detail.selectedWaypointIndex}
          onSelectWaypoint={(index) => detail.setSelectedWaypointIndex(index)}
        />
      ) : null}
    </Paper>
  ), [detail]);

  if (lt900) {
    return (
      <Stack spacing={1.2}>
        <Box sx={{ height: '45vh' }}>{mapPanel}</Box>
        <Tabs value={mobileTab} onChange={(_, value) => setMobileTab(value)}>
          <Tab label="Intelligence" />
          <Tab label="Traffic" />
          <Tab label="Telemetry" />
          <Tab label="Decision" />
        </Tabs>
        {mobileTab === 0 ? <LeftPanelSlot /> : null}
        {mobileTab === 1 ? <RightPanel tabOverride={0} /> : null}
        {mobileTab === 2 ? <RightPanel tabOverride={1} /> : null}
        {mobileTab === 3 ? <RightPanel tabOverride={3} /> : null}
      </Stack>
    );
  }

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 88px)',
          overflow: 'hidden',
          display: 'grid',
          gap: 1.2,
          gridTemplateColumns: !lt1400 ? '300px 1fr 340px' : '1fr 340px',
        }}
      >
        {!lt1400 ? (
          <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <PanelErrorBoundary panelName="Route Intelligence"><LeftPanelSlot /></PanelErrorBoundary>
          </Box>
        ) : null}

        <Box sx={{ height: '100%', minWidth: 0 }}>
          <PanelErrorBoundary panelName="Map">{mapPanel}</PanelErrorBoundary>
        </Box>

        {!lt1100 ? (
          <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <PanelErrorBoundary panelName="Live Operations"><DesktopRightPanel /></PanelErrorBoundary>
          </Box>
        ) : null}
      </Box>

      {lt1400 ? (
        <>
          <Fab aria-label="Open route intelligence panel" color="primary" sx={{ position: 'fixed', left: 20, bottom: 20 }} onClick={() => setLeftOpen(true)}><FlightIcon /></Fab>
          <Drawer anchor="left" open={leftOpen} onClose={() => setLeftOpen(false)}>
            <Box sx={{ width: 300, p: 1.2 }}><LeftPanelSlot /></Box>
          </Drawer>
        </>
      ) : null}

      {lt1100 ? (
        <>
          <Fab aria-label="Open live operations panel" color="secondary" sx={{ position: 'fixed', right: 20, bottom: 20 }} onClick={() => setRightOpen(true)}><RadarIcon /></Fab>
          <SwipeableDrawer anchor="bottom" open={rightOpen} onClose={() => setRightOpen(false)} onOpen={() => setRightOpen(true)}>
            <Box sx={{ height: '60vh', p: 1 }}><RightPanel /></Box>
          </SwipeableDrawer>
        </>
      ) : null}
    </>
  );
}
