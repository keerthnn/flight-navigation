import BedtimeIcon from '@mui/icons-material/Bedtime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { Paper, Stack, Typography } from '@mui/material';
import { SunriseSunsetData } from '../../types/external';
import { Units } from '../../utils/units';

export function DaylightStrip({ data }: { data: SunriseSunsetData | null }) {
  if (!data) return <Typography variant="caption" color="text.secondary">Daylight data unavailable</Typography>;

  return (
    <Stack spacing={0.6}>
      <Typography variant="caption">Daylight Window (UTC)</Typography>
      <Paper sx={{ p: 1, bgcolor: 'background.surface' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption"><WbSunnyIcon sx={{ fontSize: 12, mr: 0.4 }} />{Units.formatUtcTime(data.sunriseUtc)}</Typography>
          <Typography variant="caption"><BedtimeIcon sx={{ fontSize: 12, mr: 0.4 }} />{Units.formatUtcTime(data.sunsetUtc)}</Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
