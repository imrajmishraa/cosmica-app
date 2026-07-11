import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';

export const handleZodError = (err: unknown): ApiError | null => {
  if (err instanceof z.ZodError) {
    const message = err.issues.map((issue) => issue.message).join(', ');
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return new ApiError(400, `Validation failed: ${message}`, errors);
  }
  return null;
};
