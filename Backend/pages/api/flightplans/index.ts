import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { searchFlightPlansSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: searchFlightPlansSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.searchFlightPlans(
      parsed.query.fromICAO,
      parsed.query.toICAO,
      parsed.query.limit,
    );
    res.status(200).json(result);
  },
});
