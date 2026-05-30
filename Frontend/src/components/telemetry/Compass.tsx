import { Box, Typography } from '@mui/material';

export function Compass({ heading = 0 }: { heading?: number }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ width: 100, height: 100, borderRadius: '50%', border: '1px solid', borderColor: 'divider', position: 'relative', mx: 'auto' }}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `rotate(${heading}deg)`, transition: 'transform 400ms ease-out' }}>
          <svg width="20" height="36" viewBox="0 0 20 36"><path d="M10 0 L16 24 L10 20 L4 24 Z" fill="currentColor" /></svg>
        </Box>
      </Box>
      <Typography variant="numeric">{Math.round(heading)} deg</Typography>
    </Box>
  );
}
