export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? deriveWebSocketUrl(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'),
};

function deriveWebSocketUrl(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  return url.toString();
}
