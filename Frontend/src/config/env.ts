export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? deriveWebSocketUrl(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'),
  tileUrl: import.meta.env.VITE_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: import.meta.env.VITE_TILE_ATTRIBUTION ?? '© OpenStreetMap contributors',
};

function deriveWebSocketUrl(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/simulation';
  url.search = '';
  return url.toString();
}
