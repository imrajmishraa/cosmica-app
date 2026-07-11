import { Prisma } from '@prisma/client';
import { ApiError } from '../../utils/ApiError.js';

export const handlePrismaError = (err: unknown): ApiError | null => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const targets = (err.meta?.target as string[]) || [];
        const fields = targets.join(', ');
        return new ApiError(400, `Duplicate field value error. Value of [${fields}] must be unique.`);
      }
      case 'P2025':
        return new ApiError(404, (err.meta?.cause as string) || 'Requested record was not found.');
      case 'P2003':
        return new ApiError(400, 'Foreign key constraint failed. Related record not found.');
      default:
        return new ApiError(400, `Database error: [${err.code}] ${err.message}`);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new ApiError(400, 'Database request validation failed.');
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new ApiError(500, 'Failed to connect to the database.');
  }

  return null;
};
