import { Request, Response, NextFunction } from 'express';

export const ownerOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { id: string; name: string; role?: string } | undefined;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'OWNER') return res.status(403).json({ message: 'Forbidden: OWNER access required' });
  next();
};
