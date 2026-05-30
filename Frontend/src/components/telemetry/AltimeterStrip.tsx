import { Box, Typography } from '@mui/material';

export function AltimeterStrip({ altitudeFt = 0 }: { altitudeFt?: number }) {
  return (
    <Box sx={{ height: 120, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.surface', p: 1, display: 'grid', alignContent: 'center' }}>
      <Typography variant="numeric" align="center">{Math.round(altitudeFt).toLocaleString()} ft</Typography>
    </Box>
  );
}
