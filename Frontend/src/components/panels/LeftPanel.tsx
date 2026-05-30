import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Co2Icon from '@mui/icons-material/Co2';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import StraightenIcon from '@mui/icons-material/Straighten';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, Chip, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { RouteIntelligence } from '../../types/domain';
import { MidpointWeatherData, SunriseSunsetData } from '../../types/external';
import { Units } from '../../utils/units';
import { AltitudeProfile } from '../charts/AltitudeProfile';
import { AirspaceCard } from './AirspaceCard';
import { DaylightStrip } from './DaylightStrip';
import { NightOpsBanner } from './NightOpsBanner';
import { WindCard } from './WindCard';

export function LeftPanel({
  intelligence,
  midpointWeather,
  sunriseSunset,
  pilotDecision,
  isNightOperation,
  selectedWaypointIndex,
  onSelectWaypointIndex,
}: {
  intelligence: RouteIntelligence;
  midpointWeather: MidpointWeatherData | null;
  sunriseSunset: SunriseSunsetData | null;
  pilotDecision: 'GO' | 'CAUTION' | 'NO-GO';
  isNightOperation: boolean;
  selectedWaypointIndex: number | null;
  onSelectWaypointIndex: (index: number) => void;
}) {
  const distanceNm = Units.kmToNm(intelligence.flight.distance);
  const est = Units.hoursToHHMM(distanceNm / 480);
  const worst = intelligence.weather.length
    ? intelligence.weather.reduce((current, point) => (point.riskWeight > current.riskWeight ? point : current), intelligence.weather[0])
    : undefined;
  const weatherAvg = intelligence.weather.length
    ? intelligence.weather.reduce((sum, point) => sum + point.riskWeight, 0) / intelligence.weather.length
    : 0;

  function exportBrief() {
    const payload = {
      intelligence,
      midpointWeather,
      sunriseSunset,
      pilotDecision,
      exportedAtUtc: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flightbrief_${intelligence.flight.fromICAO}_${intelligence.flight.toICAO}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack spacing={1.2} className="left-panel" sx={{ animation: 'slide-from-left var(--anim-slow) forwards' }}>
      <NightOpsBanner isNightOperation={isNightOperation} sunsetUtc={sunriseSunset?.sunsetUtc ?? null} />
      <Paper sx={{ p: 1.2 }}>
        <Typography variant="h2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>{intelligence.flight.fromICAO} {'→'} {intelligence.flight.toICAO}</Typography>
        <Typography variant="body2" color="text.secondary">{intelligence.flight.fromName} to {intelligence.flight.toName}</Typography>
        <Typography variant="caption" color="text.secondary">Searched {new Date(intelligence.generatedAt).toUTCString()}</Typography>
      </Paper>

      <Stack direction="row" spacing={0.8} alignItems="center">
        <Chip
          icon={<WarningAmberIcon />}
          label={`${pilotDecision} · Route Risk`}
          sx={{
            flex: 1,
            height: 48,
            bgcolor: pilotDecision === 'GO' ? 'success.main' : pilotDecision === 'CAUTION' ? 'warning.main' : 'error.main',
            color: '#fff',
            animation: pilotDecision === 'GO' ? 'pulse-glow-green 2.5s infinite' : pilotDecision === 'NO-GO' ? 'pulse-glow-red 1.2s infinite' : undefined,
          }}
        />
        <Tooltip
          arrow
          title={
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Why this risk?</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Route score: {intelligence.routeWeight.toFixed(1)} / 10</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Weather average: {weatherAvg.toFixed(1)} / 10</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Worst node: {worst?.ident ?? '-'} ({worst?.description ?? 'N/A'})</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Visibility: {worst ? (worst.visibilityMeters / 1000).toFixed(1) : '-'} km</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Wind: {worst ? Units.msToKnots(worst.windSpeedMps) : '-'} kt</Typography>
            </Box>
          }
        >
          <InfoOutlinedIcon color="action" sx={{ cursor: 'help' }} />
        </Tooltip>
      </Stack>

      <Grid container spacing={1} className="metrics-grid">
        <Grid size={6}><MetricCard icon={<StraightenIcon />} title="Distance" value={`${distanceNm} nm`} sub={`${intelligence.flight.distance} km`} /></Grid>
        <Grid size={6}><MetricCard icon={<AccessTimeIcon />} title="Est. Time" value={`${est}Z`} sub="at 480 kt cruise" /></Grid>
        <Grid size={6}><MetricCard icon={<LocalGasStationIcon />} title="Fuel" value={`${Math.round(intelligence.fuel.fuelKg).toLocaleString()} kg`} sub="+- 5% estimate" /></Grid>
        <Grid size={6}><MetricCard icon={<Co2Icon />} title="CO2" value={`${Math.round(intelligence.fuel.co2Kg).toLocaleString()} kg`} sub="CORSIA scope" /></Grid>
      </Grid>

      <Paper sx={{ p: 1.2 }}>
        <AltitudeProfile
          nodes={intelligence.flight.route.nodes}
          selectedIndex={selectedWaypointIndex}
          onSelectIndex={onSelectWaypointIndex}
        />
      </Paper>
      <WindCard weather={midpointWeather} />
      <AirspaceCard fromICAO={intelligence.flight.fromICAO} toICAO={intelligence.flight.toICAO} />
      <DaylightStrip data={sunriseSunset} />
      <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={exportBrief}>Export Flight Brief (JSON)</Button>
    </Stack>
  );
}

function MetricCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) {
  return (
    <Paper sx={{ p: 1.2, bgcolor: 'background.surface' }}>
      <Stack spacing={0.4}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{icon}<Typography variant="caption">{title}</Typography></Box>
        <Typography variant="numeric" sx={{ fontSize: 22 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      </Stack>
    </Paper>
  );
}
