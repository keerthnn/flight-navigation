import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NightlightIcon from '@mui/icons-material/Nightlight';
import { IconButton, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

export function NightOpsBanner({
  isNightOperation,
  sunsetUtc,
}: {
  isNightOperation: boolean;
  sunsetUtc: string | null;
}) {
  const [open, setOpen] = useState(false);
  const sunsetLabel = useMemo(() => (sunsetUtc ? `${new Date(sunsetUtc).toISOString().slice(11, 16)}Z` : '--:--Z'), [sunsetUtc]);

  if (!isNightOperation) return null;

  return (
    <Paper
      role="alert"
      aria-label="Night operation warning"
      sx={{
        bgcolor: '#112240',
        border: '1px solid #5E92F3',
        borderRadius: '10px',
        p: '10px 16px',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2}>
        <NightlightIcon sx={{ color: '#fff', fontSize: 20 }} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>Night operation</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Departed after sunset {sunsetLabel} - IFR clearance required
          </Typography>
        </Stack>
        <IconButton aria-label="Night operations info" onClick={() => setOpen((v) => !v)} sx={{ color: '#fff' }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>
      {open ? (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)', maxWidth: 320 }}>
          Night VFR is restricted in most jurisdictions. Ensure IFR flight plan is filed, verify destination lighting, and confirm anti-collision, position, and landing lights.
        </Typography>
      ) : null}
    </Paper>
  );
}
