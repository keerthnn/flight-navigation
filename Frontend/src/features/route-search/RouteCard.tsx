import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { FlightPlanSummary } from '../../types/domain';
import { Units } from '../../utils/units';

export function RouteCard({ flight, onOpen, index }: { flight: FlightPlanSummary; onOpen: () => void; index: number }) {
  const distanceNm = Units.kmToNm(flight.distance);
  const eta = Units.hoursToHHMM(distanceNm / 480);
  return (
    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'slide-fade-up var(--anim-slow) forwards', animationDelay: `${index * 60}ms`, '&:hover': { bgcolor: 'background.surface', borderColor: 'primary.light' } }}>
      <Stack spacing={0.5}>
        <Typography variant="numeric" sx={{ fontSize: 18, color: 'primary.main' }}>{flight.fromICAO} {'→'} {flight.toICAO}</Typography>
        <Stack direction="row" spacing={0.8}>
          <Chip size="small" label={`${flight.waypoints.split(',').length} waypoints`} />
          <Chip size="small" label={flight.source === 'flightplandb' ? 'FlightPlanDB' : 'Generated'} color={flight.source === 'flightplandb' ? 'info' : 'warning'} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="numeric">{distanceNm} nm</Typography>
          <Typography variant="caption" color="text.secondary"><AccessTimeIcon sx={{ fontSize: 12, mr: 0.3 }} />{eta}Z</Typography>
        </Stack>
      </Stack>
      <Button variant="outlined" size="small" endIcon={<ChevronRightIcon />} onClick={onOpen}>Open Route</Button>
    </Paper>
  );
}
