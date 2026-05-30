import { CssBaseline, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';
import { AppStoreProvider } from '../store/appStore';
import { aviationTheme } from './theme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={aviationTheme}>
      <CssBaseline />
      <AppStoreProvider>
        {children}
      </AppStoreProvider>
    </ThemeProvider>
  );
}
