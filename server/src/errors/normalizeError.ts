import { ApiError } from '../utils/ApiError.js';
import { handleCustomError } from './handler/custom.js';
import { handleJwtError } from './handler/jwt.js';
import { handleMulterError } from './handler/multer.js';
import { handlePrismaError } from './handler/prisma.js';
import { handleZodError } from './handler/zod.js';

export const normalizeError = (err: unknown): ApiError => {
  // 1. Check if it's already an ApiError
  const customError = handleCustomError(err);
  if (customError) return customError;

  // 2. Check Zod validation errors
  const zodError = handleZodError(err);
  if (zodError) return zodError;

  // 3. Check JWT token errors
  const jwtError = handleJwtError(err);
  if (jwtError) return jwtError;

  // 4. Check Multer upload errors
  const multerError = handleMulterError(err);
  if (multerError) return multerError;

  // 5. Check Prisma database errors
  const prismaError = handlePrismaError(err);
  if (prismaError) return prismaError;

  // 6. Default fallback error
  const message = err instanceof Error ? err.message : 'Something went wrong';
  const stack = err instanceof Error ? err.stack : undefined;
  
  return new ApiError(500, message, [], null, stack);
};
