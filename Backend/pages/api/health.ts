import { withApiHandler } from '@/src/next/api/withApiHandler';

export default withApiHandler({
  method: 'GET',
  handler: ({ res }) => {
    res.status(200).json({
      status: 'ok',
      service: 'flight-navigation-backend',
      timestamp: new Date().toISOString(),
    });
  },
});
