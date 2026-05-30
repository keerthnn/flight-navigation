import CloseIcon from '@mui/icons-material/Close';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import { IconButton, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

export interface CBWarningBannerProps {
  affectedNodes: string[];
  onDismiss?: () => void;
}

export function CBWarningBanner({ affectedNodes, onDismiss }: CBWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const nodesText = useMemo(() => affectedNodes.join(', '), [affectedNodes]);

  if (!affectedNodes.length || dismissed) return null;

  return (
    <Stack
      role="alert"
      aria-label="Cumulonimbus warning"
      direction="row"
      alignItems="center"
      spacing={1.2}
      sx={{
        bgcolor: 'error.main',
        color: '#fff',
        borderRadius: '10px',
        px: 2,
        py: 1.4,
      }}
    >
      <ThunderstormIcon
        sx={{
          fontSize: 24,
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'cb-flash 1s infinite',
          },
          '@keyframes cb-flash': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
        }}
      />
      <Stack sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 500 }}>Cumulonimbus detected</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          CB clouds at: {nodesText} - approach hazard, consider alternate
        </Typography>
      </Stack>
      <IconButton
        aria-label="Dismiss CB warning"
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        sx={{ color: '#fff' }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
