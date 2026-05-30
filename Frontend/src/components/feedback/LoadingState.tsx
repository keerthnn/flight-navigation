import { CircularProgress, Stack, Typography } from '@mui/material';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" aria-live="polite">
      <CircularProgress size={18} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
