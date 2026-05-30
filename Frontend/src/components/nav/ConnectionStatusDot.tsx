import { Stack, Typography } from '@mui/material';

interface ConnectionStatusDotProps {
  status: 'live' | 'degraded' | 'offline';
}

const colors = {
  live: '#66BB6A',
  degraded: '#FFA726',
  offline: '#EF5350',
};

export function ConnectionStatusDot({ status }: ConnectionStatusDotProps) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center" role="status" aria-live="polite" aria-label="Connection status">
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          display: 'inline-block',
          background: colors[status],
          animation: status === 'live' ? 'pulse-glow-green 2s infinite' : undefined,
        }}
      />
      <Typography variant="caption">{status === 'live' ? 'Live' : status === 'degraded' ? 'Degraded' : 'Offline'}</Typography>
    </Stack>
  );
}
