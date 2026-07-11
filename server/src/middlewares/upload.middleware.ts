import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { fileUploadSchema } from '../validations/image.validation.js';

const UPLOAD_TEMP_DIR = path.resolve(ENV.UPLOAD_TEMP_DIR);

// Ensure upload temp directory exists
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

// Multer storage config (stores as random unique names in temp dir)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Enforce 10MB limit
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

const multerUpload = multer({
  storage,
  limits,
});

export const uploadSingle = multerUpload.single('file');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/avif',
];

export const validateUploadedFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    return next(new ApiError(400, 'No file uploaded'));
  }

  const filePath = req.file.path;

  try {
    const fileTypeInfo = await fileTypeFromFile(filePath);

    if (!fileTypeInfo || !ALLOWED_MIME_TYPES.includes(fileTypeInfo.mime)) {
      // Delete malicious or unsupported file
      fs.unlinkSync(filePath);
      return next(new ApiError(400, 'Invalid file type. Only standard images are supported.'));
    }

    // Attach verified mime type to req.file
    req.file.mimetype = fileTypeInfo.mime;

    // Validate the Multer file object properties against the Zod schema
    const parsedFile = fileUploadSchema.safeParse(req.file);
    if (!parsedFile.success) {
      fs.unlinkSync(filePath);
      return next(new ApiError(400, parsedFile.error.issues[0].message));
    }

    next();
  } catch {
    // Cleanup if file checking fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    next(new ApiError(500, 'Error validating file content type'));
  }
};
