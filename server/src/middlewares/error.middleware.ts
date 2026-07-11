import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  if (ENV.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: err instanceof ApiError ? err.errors : [],
      stack: err.stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message: err instanceof ApiError ? message : 'Something went wrong',
      errors: err instanceof ApiError ? err.errors : [],
    });
  }
};
