import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Alert, Button, Collapse, Paper, Stack, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  panelName: string;
  fallbackHeight?: number;
}

interface State {
  hasError: boolean;
  message?: string;
  showDetails: boolean;
}

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, showDetails: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message, showDetails: false };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Paper sx={{ p: 2, minHeight: this.props.fallbackHeight ?? 200 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberIcon color="warning" />
            <Typography variant="h3">{this.props.panelName} failed to load</Typography>
          </Stack>
          <Button variant="outlined" onClick={() => window.location.reload()}>Refresh panel</Button>
          <Button size="small" onClick={() => this.setState((s) => ({ ...s, showDetails: !s.showDetails }))}>Toggle error details</Button>
          <Collapse in={this.state.showDetails}>
            <Alert severity="warning">{this.state.message}</Alert>
          </Collapse>
        </Stack>
      </Paper>
    );
  }
}
