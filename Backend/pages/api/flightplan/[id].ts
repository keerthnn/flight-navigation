import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { flightPlanDetailSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: flightPlanDetailSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getFlightPlan(parsed.params.id);
    res.status(200).json(result);
  },
});
