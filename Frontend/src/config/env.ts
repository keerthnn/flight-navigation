export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? deriveWebSocketUrl(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'),
  liveWsEnabled: deriveLiveWsEnabled(),
  tileUrl: import.meta.env.VITE_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: import.meta.env.VITE_TILE_ATTRIBUTION ?? '&copy; OpenStreetMap contributors',
};

function deriveWebSocketUrl(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  return url.toString();
}

function deriveLiveWsEnabled(): boolean {
  const flag = import.meta.env.VITE_LIVE_WS_ENABLED;
  if (flag !== undefined) return String(flag).toLowerCase() === 'true';

  // Vercel serverless deployments do not expose our custom /ws upgrade endpoint.
  return !((import.meta.env.VITE_API_BASE_URL ?? '').includes('vercel.app'));
}
