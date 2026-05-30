import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { activeFlightsSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: activeFlightsSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getActiveFlightsNearRoute(
      parsed.params.id,
      parsed.query.radiusKm,
      parsed.query.limit,
    );
    res.status(200).json(result);
  },
});
