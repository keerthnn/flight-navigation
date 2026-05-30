import { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Button, Drawer, IconButton, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabValue = location.pathname.startsWith('/flight/') ? 1 : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
            <FlightTakeoffIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                Flight Intelligence
              </Typography>
            </Box>
          </Stack>
          <Tabs value={tabValue} textColor="inherit" indicatorColor="primary" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Tab label="Route Search" component={Link} to="/" />
            <Tab label="Flight Detail" component={Link} to={location.pathname.startsWith('/flight/') ? location.pathname : '/'} />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ display: { md: 'none' } }}>
        <Box sx={{ width: 260, p: 2 }}>
          <Stack spacing={1}>
            <Button component={Link} to="/" onClick={() => setDrawerOpen(false)}>
              Route Search
            </Button>
            <Button
              component={Link}
              to={location.pathname.startsWith('/flight/') ? location.pathname : '/'}
              onClick={() => setDrawerOpen(false)}
            >
              Flight Detail
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Box component="main" sx={{ p: { xs: 2, md: 3 } }}>
        {children}
      </Box>
    </Box>
  );
}
