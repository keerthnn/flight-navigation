import { Component, ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application boundary captured an error', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Flight deck needs a reset</Typography>
            <Alert severity="error">{this.state.error.message}</Alert>
            <Button type="button" variant="contained" onClick={() => window.location.assign('/')}>
              Return Home
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
