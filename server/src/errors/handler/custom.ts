import { ApiError } from '../../utils/ApiError.js';

export const handleCustomError = (err: unknown): ApiError | null => {
  if (err instanceof ApiError) {
    return err;
  }
  return null;
};
