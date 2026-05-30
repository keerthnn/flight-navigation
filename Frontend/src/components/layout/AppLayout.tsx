import { PropsWithChildren } from 'react';
import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import { ThemeToggle } from '../nav/ThemeToggle';
import { ConnectionStatusDot } from '../nav/ConnectionStatusDot';
import { useAppStore } from '../../store/appStore';

function deriveStatus(providerStatus: unknown): 'live' | 'degraded' | 'offline' {
  if (!providerStatus || typeof providerStatus !== 'object') return 'degraded';
  const flags = Object.values(providerStatus as Record<string, unknown>);
  if (flags.every((value) => value === false)) return 'offline';
  if (flags.some((value) => value === true)) return 'live';
  return 'degraded';
}

export function AppLayout({ children }: PropsWithChildren) {
  const { providerStatus } = useAppStore();
  const connectionStatus = deriveStatus(providerStatus);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        className="nav-bar"
        position="sticky"
        elevation={0}
        sx={{
          height: 56,
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(13,27,42,0.85)',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FlightIcon color="primary" />
            <Typography variant="h3" sx={{ letterSpacing: '0.05em' }}>FlightNav</Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ConnectionStatusDot status={connectionStatus} />
            <ThemeToggle />
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: { xs: 1.5, md: 2.5 } }}>
        {children}
      </Box>
    </Box>
  );
}
