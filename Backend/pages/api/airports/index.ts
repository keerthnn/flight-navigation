import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { airportSearchSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: airportSearchSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.searchAirports(parsed.query.q, parsed.query.limit);
    res.status(200).json(result);
  },
});
