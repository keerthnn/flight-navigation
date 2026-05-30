import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { fuelSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: fuelSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getFuelEstimate(parsed.query.aircraft, parsed.query.distance);
    res.status(200).json(result);
  },
});
