import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { uploadSingle, validateUploadedFile } from '../middlewares/upload.middleware.js';
import { UploadController } from '../controllers/upload.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uploadRouter = Router();

uploadRouter.post(
  '/',
  requireAuth,
  uploadSingle,
  asyncHandler(validateUploadedFile),
  asyncHandler(UploadController.uploadAsset)
);

export { uploadRouter };
