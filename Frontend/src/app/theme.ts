import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    surface: string;
  }

  interface TypographyVariants {
    numeric: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    numeric?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    numeric: true;
  }
}

export function createAviationTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#060D1A' : '#F0F4F8',
        paper: isDark ? '#0D1B2A' : '#FFFFFF',
        surface: isDark ? '#112240' : '#E8EFF7',
      },
      primary: {
        main: isDark ? '#5E92F3' : '#1565C0',
        light: isDark ? '#90B8FF' : '#5E92F3',
        dark: isDark ? '#1565C0' : '#003C8F',
      },
      secondary: {
        main: isDark ? '#26C6DA' : '#00838F',
        light: isDark ? '#6FF9FF' : '#4FB3BF',
        dark: isDark ? '#0095A8' : '#005662',
      },
      success: { main: isDark ? '#66BB6A' : '#2E7D32', light: '#60AD5E' },
      warning: { main: isDark ? '#FFA726' : '#E65100', light: '#FF833A' },
      error: { main: isDark ? '#EF5350' : '#B71C1C', light: '#F05545' },
      info: { main: isDark ? '#29B6F6' : '#0277BD' },
      text: {
        primary: isDark ? '#E8F0FE' : '#0D1B2A',
        secondary: isDark ? '#90A4AE' : '#37474F',
      },
      divider: isDark ? 'rgba(94,146,243,0.2)' : 'rgba(21,101,192,0.15)',
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      h1: { fontSize: '28px', fontWeight: 600 },
      h2: { fontSize: '20px', fontWeight: 600 },
      h3: { fontSize: '16px', fontWeight: 600 },
      body1: { fontSize: '14px', fontWeight: 400 },
      body2: { fontSize: '12px', fontWeight: 400 },
      caption: { fontSize: '11px', fontWeight: 400 },
      numeric: { fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&:focus-visible': {
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}55`,
            },
          }),
        },
      },
    },
  });
}
