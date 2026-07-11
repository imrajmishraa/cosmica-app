import jwt from 'jsonwebtoken';
import { ApiError } from '../../utils/ApiError.js';

export const handleJwtError = (err: unknown): ApiError | null => {
  if (err instanceof jwt.TokenExpiredError) {
    return new ApiError(401, 'Access token expired');
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return new ApiError(401, 'Invalid access token');
  }

  return null;
};
