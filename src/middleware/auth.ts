import { Request, Response, NextFunction } from 'express';
import { verifyToken, isTokenBlacklisted } from '../utils/jwt.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    const payload = verifyToken(token);
    (req as any).user = payload;
    (req as any).token = token;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Token verification failed' });
  }
};
