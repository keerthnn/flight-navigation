import { Alert, Stack, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">{title}</Typography>
      <Alert severity="info">{description}</Alert>
    </Stack>
  );
}
