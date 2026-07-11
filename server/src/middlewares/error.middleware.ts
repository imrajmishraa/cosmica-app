import { Request, Response, NextFunction } from 'express';
import { normalizeError } from '../errors/normalizeError.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const normalizedErr = normalizeError(err);
  const { statusCode, message, errors, stack } = normalizedErr;

  if (ENV.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }
};
