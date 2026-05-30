import BedtimeIcon from '@mui/icons-material/Bedtime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { Paper, Stack, Typography } from '@mui/material';
import { SunriseSunsetData } from '../../types/external';
import { Units } from '../../utils/units';

export function DaylightStrip({ data }: { data: SunriseSunsetData | null }) {
  if (!data) return <Typography variant="caption" color="text.secondary">Daylight data unavailable</Typography>;
  const now = new Date();
  const sunset = new Date(data.sunsetUtc);
  const isNight = now > sunset;
  const nightDeltaMs = isNight ? now.getTime() - sunset.getTime() : 0;
  const nightHours = Math.floor(nightDeltaMs / (1000 * 60 * 60));
  const nightMins = Math.floor((nightDeltaMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Stack spacing={0.6}>
      <Typography variant="caption">Daylight Window (UTC)</Typography>
      <Paper sx={{ p: 1, bgcolor: 'background.surface' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption"><WbSunnyIcon sx={{ fontSize: 12, mr: 0.4 }} />{Units.formatUtcTime(data.sunriseUtc)}</Typography>
          <Typography variant="caption"><BedtimeIcon sx={{ fontSize: 12, mr: 0.4 }} />{Units.formatUtcTime(data.sunsetUtc)}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>
          Sunset: {Units.formatUtcTime(data.sunsetUtc)} · Now: {Units.formatUtcTime(now.toISOString())}
          {isNight ? ` · Night +${nightHours}h${String(nightMins).padStart(2, '0')}m` : ' · Day operation'}
        </Typography>
      </Paper>
    </Stack>
  );
}
