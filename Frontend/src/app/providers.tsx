import { CssBaseline, ThemeProvider } from '@mui/material';
import { PropsWithChildren, useMemo } from 'react';
import { ThemeModeProvider, useThemeMode } from '../context/ThemeContext';
import { AppStoreProvider } from '../store/appStore';
import { createAviationTheme } from './theme';

function ProvidersInner({ children }: PropsWithChildren) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAviationTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppStoreProvider>{children}</AppStoreProvider>
    </ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeModeProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </ThemeModeProvider>
  );
}
