import { withApiHandler } from '@/src/next/api/withApiHandler';
import { env } from '@/src/config/env';

export default withApiHandler({
  method: 'GET',
  handler: ({ res }) => {
    res.status(200).json({
      flightPlans: {
        mode: env.FLIGHT_PLAN_DB_API_KEY ? 'flightplandb-live' : 'generated-fallback',
        configured: Boolean(env.FLIGHT_PLAN_DB_API_KEY),
        fallback: 'generated great-circle route provider',
      },
      aviationWeather: {
        mode: 'aviationweather.gov-primary',
        fallback: 'open-meteo, then deterministic synthetic weather',
        configured: true,
      },
      airports: {
        mode: 'bundled-csv',
        fallback: 'OurAirports-compatible CSV import boundary',
        configured: true,
      },
      fuel: {
        mode: 'local-estimator',
        fallback: 'provider interface ready for verified fuel APIs',
        configured: true,
      },
      realtime: {
        mode: 'websocket-live-flight-tracking',
        path: '/ws/flights/:provider/:flightId/live?routeId=<route-id>',
        demoFallback: '/ws/simulation?flightPlanId=<id>&aircraft=A320',
      },
    });
  },
});
