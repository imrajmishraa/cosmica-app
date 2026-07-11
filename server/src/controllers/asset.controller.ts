import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { StorageService } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { updateAssetSchema } from '../validations/image.validation.js';

export class AssetController {
  /**
   * Get all assets for the authenticated user with optional pagination and filtering
   */
  static async listAssets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const mimeType = req.query.mimeType as string;
      const skip = (page - 1) * limit;

      const whereClause: any = { userId };
      if (mimeType) {
        whereClause.mimeType = { contains: mimeType, mode: 'insensitive' };
      }

      const [assets, totalCount] = await Promise.all([
        prisma.asset.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.asset.count({ where: whereClause }),
      ]);

      res.status(200).json(
        new ApiResponse(200, 'Assets fetched successfully', {
          assets,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            limit,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search within asset metadata (cameraMake, cameraModel, format, originalName)
   */
  static async searchAssets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      const query = req.query.q;
      if (typeof query !== 'string') {
        return next(new ApiError(400, 'Search query parameter q is required and must be a string'));
      }

      // Query database filtering by name and EXIF JSON keys
      const assets = await prisma.asset.findMany({
        where: {
          userId,
          OR: [
            { originalName: { contains: query, mode: 'insensitive' } },
            {
              metadata: {
                path: ['cameraMake'],
                string_contains: query,
              },
            },
            {
              metadata: {
                path: ['cameraModel'],
                string_contains: query,
              },
            },
            {
              metadata: {
                path: ['format'],
                string_contains: query,
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(
        new ApiResponse(200, 'Assets searched successfully', assets)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update metadata (rename asset originalName)
   */
  static async updateAsset(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const id = req.params.id;

      if (!userId) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      const parsed = updateAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(400, parsed.error.issues[0].message));
      }

      const { originalName } = parsed.data;

      if (typeof id !== 'string') {
        return next(new ApiError(400, 'Invalid asset ID'));
      }

      const asset = await prisma.asset.findFirst({
        where: { id, userId },
      });

      if (!asset) {
        return next(new ApiError(404, 'Asset not found'));
      }

      const updatedAsset = await prisma.asset.update({
        where: { id },
        data: {
          originalName: originalName || asset.originalName,
        },
      });

      res.status(200).json(
        new ApiResponse(200, 'Asset updated successfully', updatedAsset)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an asset and clean up its files from the storage service
   */
  static async deleteAsset(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const id = req.params.id;

      if (!userId) {
        return next(new ApiError(401, 'Unauthorized'));
      }

      if (typeof id !== 'string') {
        return next(new ApiError(400, 'Invalid asset ID'));
      }

      const asset = await prisma.asset.findFirst({
        where: { id, userId },
      });

      if (!asset) {
        return next(new ApiError(404, 'Asset not found'));
      }

      // 1. Delete associated physical files via StorageService
      if (asset.path) {
        await StorageService.deleteFile(asset.path);
      }
      if (asset.mediumPath) {
        await StorageService.deleteFile(asset.mediumPath);
      }
      if (asset.thumbnailPath) {
        await StorageService.deleteFile(asset.thumbnailPath);
      }

      // 2. Delete database record
      await prisma.asset.delete({
        where: { id },
      });

      res.status(200).json(
        new ApiResponse(200, 'Asset and all associated files deleted successfully', null)
      );
    } catch (error) {
      next(error);
    }
  }
}
