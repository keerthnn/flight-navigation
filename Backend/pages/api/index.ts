import { NextApiRequest, NextApiResponse } from 'next';
import { applyCors } from '@/src/next/pagesHttp';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return;
  res.status(200).json({ service: 'flight-navigation-backend', status: 'running' });
}
