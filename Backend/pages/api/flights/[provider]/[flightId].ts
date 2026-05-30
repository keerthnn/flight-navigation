import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { liveFlightSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: liveFlightSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getLiveFlight(
      parsed.params.provider,
      parsed.params.flightId,
      parsed.query.routeId,
    );
    res.status(200).json(result);
  },
});
