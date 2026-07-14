import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ENV } from '../config/env.js';

const JWT_SECRET = ENV.JWT_SECRET;

export const requireAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized: Missing token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: Role };
    req.user = decoded;
    next();
  } catch {
    next(new ApiError(401, 'Unauthorized: Invalid or expired token'));
  }
};
