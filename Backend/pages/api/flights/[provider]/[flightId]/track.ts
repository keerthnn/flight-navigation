import { withApiHandler } from '@/src/next/api/withApiHandler';
import { serviceContainer } from '@/src/next/serviceContainer';
import { flightTrackSchema } from '@/src/validators/flightSchemas';

export default withApiHandler({
  method: 'GET',
  schema: flightTrackSchema,
  handler: async ({ res, parsed }) => {
    const result = await serviceContainer.flightService.getFlightTrack(parsed.params.provider, parsed.params.flightId);
    res.status(200).json(result);
  },
});
