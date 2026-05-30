import { PropsWithChildren } from 'react';
import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const onFlightDetail = location.pathname.startsWith('/flight/');

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
            {onFlightDetail ? (
              <IconButton
                aria-label="Back to home"
                size="small"
                onClick={() => navigate('/')}
                sx={{ color: 'text.primary' }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            ) : null}

            <Typography
              variant="h3"
              sx={{ letterSpacing: '0.05em', cursor: 'pointer' }}
              onClick={() => navigate('/')}
              role="button"
              aria-label="Go to home page"
            >
              RouteIQ
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* <ConnectionStatusDot status={connectionStatus} /> */}
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
