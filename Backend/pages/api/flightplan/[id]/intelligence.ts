import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { routeIntelligenceSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: routeIntelligenceSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getRouteIntelligence(parsed.params.id, parsed.query.aircraft);
    res.status(200).json(result);
  },
});
