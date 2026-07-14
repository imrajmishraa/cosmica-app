import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Forbidden: Admin access required'));
  }
  next();
};
