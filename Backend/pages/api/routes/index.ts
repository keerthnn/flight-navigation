import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { createRouteSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'POST',
  schema: createRouteSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.createRoute(parsed.body.fromICAO, parsed.body.toICAO);
    res.status(201).json(result);
  },
});
