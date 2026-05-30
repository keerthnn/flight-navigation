import { createTheme } from '@mui/material/styles';

export const aviationTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3db8ff' },
    secondary: { main: '#63d8ff' },
    background: {
      default: '#08101a',
      paper: '#0d1622',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", "Roboto", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0b1520',
          borderBottom: '1px solid rgba(61, 184, 255, 0.14)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: 'none',
        },
      },
    },
  },
});
