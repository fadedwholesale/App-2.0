import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Access token required'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(403).json({
      error: 'Invalid or expired token'
    });
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
