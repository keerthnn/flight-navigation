import { Box, Typography } from '@mui/material';
import { Polyline, TileLayer } from 'react-leaflet';
import { MapContainer } from 'react-leaflet/MapContainer';
import { useThemeMode } from '../../context/ThemeContext';

export function MinimapControl({ path }: { path: [number, number][] }) {
  const { mode } = useThemeMode();
  const tileUrl = mode === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <Box className="minimap" sx={{ position: 'absolute', left: 16, bottom: 24, zIndex: 1000, width: 200, height: 130, borderRadius: 1.2, overflow: 'hidden' }}>
      <Typography variant="caption" sx={{ position: 'absolute', top: 4, left: 6, zIndex: 1001, bgcolor: 'background.paper', px: 0.6, borderRadius: 0.6 }}>Overview</Typography>
      <MapContainer center={path[0] ?? [20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false}>
        <TileLayer url={tileUrl} attribution="© OpenStreetMap contributors © CARTO" />
        <Polyline positions={path} color="#ef5350" weight={2} />
      </MapContainer>
    </Box>
  );
}
