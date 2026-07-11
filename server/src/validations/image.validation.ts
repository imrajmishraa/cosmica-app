import { z } from 'zod';

// Schema to validate Multer upload file details
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().min(1, 'Original filename is required'),
  encoding: z.string(),
  mimetype: z.string().refine(
    (val) =>
      [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/tiff',
        'image/avif',
      ].includes(val),
    {
      message: 'Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF, TIFF, AVIF',
    }
  ),
  size: z.number().max(10 * 1024 * 1024, 'Image size must not exceed 10MB (10485760 bytes)'),
});

// Schema to validate updates to asset properties
export const updateAssetSchema = z.object({
  originalName: z
    .string()
    .min(1, 'Filename must not be empty')
    .max(255, 'Filename is too long')
    .regex(/^[^\\/:*?"<>|]+$/, 'Filename contains invalid characters')
    .optional(),
});
