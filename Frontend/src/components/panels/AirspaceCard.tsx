import { Chip, Paper, Stack, Typography } from '@mui/material';

function deriveClass(icao: string) {
  if (icao.startsWith('K')) return 'Class B/C + A above FL180';
  if (icao.startsWith('EG')) return 'Class A/D';
  if (icao.startsWith('VI')) return 'Class A/B/C';
  if (icao.startsWith('OM')) return 'Class A';
  return 'Controlled airspace';
}

export function AirspaceCard({ fromICAO, toICAO }: { fromICAO: string; toICAO: string }) {
  return (
    <Paper sx={{ p: 1.2, bgcolor: 'background.surface' }}>
      <Stack spacing={1}>
        <Typography variant="caption">Airspace</Typography>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label={`${fromICAO}: ${deriveClass(fromICAO)}`} />
          <Chip size="small" label={`${toICAO}: ${deriveClass(toICAO)}`} />
        </Stack>
        <Typography variant="caption" color="text.secondary">Cruise: Class A (FL180-FL600). Contact appropriate ATC for clearances.</Typography>
      </Stack>
    </Paper>
  );
}
