import { Box, CircularProgress, Skeleton, Stack } from '@mui/material';

export function LeftPanelSkeleton() {
  return (
    <Stack spacing={1.2}>
      <Skeleton variant="rounded" width={120} height={24} animation="wave" />
      <Skeleton variant="rounded" width="100%" height={36} animation="wave" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={80} animation="wave" />)}
      </Box>
      <Skeleton variant="rounded" width="100%" height={150} animation="wave" />
      <Skeleton variant="rounded" width="100%" height={60} animation="wave" />
      <Skeleton variant="rounded" width="100%" height={60} animation="wave" />
    </Stack>
  );
}

export function RightPanelSkeleton() {
  return (
    <Stack spacing={1.2}>
      <Skeleton variant="rounded" width="100%" height={40} animation="wave" />
      {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} variant="rounded" width="100%" height={32} animation="wave" />)}
      <Skeleton variant="rounded" width="100%" height={200} animation="wave" />
    </Stack>
  );
}

export function MapSkeleton() {
  return (
    <Box sx={{ borderRadius: 1.5, minHeight: 360, display: 'grid', placeItems: 'center', bgcolor: 'background.surface' }}>
      <CircularProgress />
    </Box>
  );
}
