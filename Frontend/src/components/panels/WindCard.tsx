import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import { Paper, Stack, Typography } from '@mui/material';
import { MidpointWeatherData } from '../../types/external';
import { Units } from '../../utils/units';

export function WindCard({ weather }: { weather: MidpointWeatherData | null }) {
  if (!weather) {
    return <Typography variant="caption" color="text.secondary">Wind data unavailable</Typography>;
  }

  return (
    <Paper sx={{ p: 1.2, bgcolor: 'background.surface' }}>
      <Stack direction="row" spacing={1.5}>
        <AirIcon />
        <Stack spacing={0.4}>
          <Typography variant="caption">Wind at midpoint</Typography>
          <Typography variant="numeric">{weather.windspeedKnots} kt</Typography>
          <Typography variant="caption"><SpeedIcon sx={{ fontSize: 12, mr: 0.4 }} />{weather.pressureHpa} hPa</Typography>
          <Typography variant="caption">Dir {Math.round(weather.windDirectionDeg)} deg · {Units.formatUtcTime(weather.fetchedAtUtc)}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
