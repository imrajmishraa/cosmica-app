import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { assetQueue } from '../config/redis.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class UploadController {
  static async uploadAsset(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        return next(new ApiError(400, 'No file uploaded'));
      }

      const userId = req.user?.userId;
      if (!userId) {
        return next(new ApiError(401, 'Unauthorized: Missing user context'));
      }

      // Create a pending asset record in the database
      const asset = await prisma.asset.create({
        data: {
          userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: req.file.path, // Temporary location path. Worker updates this upon processing completion.
        },
      });

      // Dispatch background job to resize/compress images and extract EXIF metadata
      await assetQueue.add('process-media', {
        assetId: asset.id,
        tempFilePath: req.file.path,
        originalName: req.file.originalname,
      });

      res.status(202).json(
        new ApiResponse(202, 'Asset uploaded successfully and scheduled for background processing', {
          id: asset.id,
          fileName: asset.fileName,
          originalName: asset.originalName,
          size: asset.size,
          mimeType: asset.mimeType,
          createdAt: asset.createdAt,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
