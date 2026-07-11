import multer from 'multer';
import { ApiError } from '../../utils/ApiError.js';

export const handleMulterError = (err: unknown): ApiError | null => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return new ApiError(400, 'File is too large. Max size allowed is 10MB.');
      case 'LIMIT_FILE_COUNT':
        return new ApiError(400, 'Too many files uploaded.');
      case 'LIMIT_UNEXPECTED_FILE':
        return new ApiError(400, `Unexpected field: '${err.field}'. Only 'file' is accepted.`);
      default:
        return new ApiError(400, `File upload error: ${err.message}`);
    }
  }
  return null;
};
