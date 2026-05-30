import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { activeFlightsSchema } from '@/src/validators/flightSchemas';
import { queryObject } from '@/src/next/api/validate';

export default withApiHandler({
  method: 'GET',
  handler: async ({ req, res }) => {
    const parsed = activeFlightsSchema.parse({
      params: { id: String(req.query.routeId ?? '') },
      query: queryObject(req),
    });
    const result = await serviceContainer.flightService.getActiveFlightsNearRoute(
      parsed.params.id,
      parsed.query.radiusKm,
      parsed.query.limit,
    );
    res.status(200).json(result);
  },
});
