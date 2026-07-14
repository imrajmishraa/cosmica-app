import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { StorageService } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class AdminController {
  /**
   * Aggregates global system and storage statistics
   */
  static async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [totalAssets, totalUsers, storageSum, statusGroups] = await Promise.all([
        prisma.asset.count(),
        prisma.user.count(),
        prisma.asset.aggregate({
          _sum: { size: true },
        }),
        prisma.asset.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
        }),
      ]);

      const totalSize = storageSum._sum.size || 0;

      // Unpack status counts
      const statusCounts = {
        PENDING: 0,
        COMPLETED: 0,
        FAILED: 0,
      };

      statusGroups.forEach((group) => {
        if (group.status in statusCounts) {
          statusCounts[group.status as keyof typeof statusCounts] = group._count.status;
        }
      });

      res.status(200).json(
        new ApiResponse(200, 'Global statistics aggregated successfully', {
          totalAssets,
          totalUsers,
          totalSize,
          statusCounts,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists all assets in the system across all users
   */
  static async listAllAssets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (status) {
        whereClause.status = status.toUpperCase();
      }

      const [assets, totalCount] = await Promise.all([
        prisma.asset.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.asset.count({ where: whereClause }),
      ]);

      res.status(200).json(
        new ApiResponse(200, 'All system assets fetched successfully', {
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
   * Force delete any asset in the system (Admin action)
   */
  static async deleteAsset(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (typeof id !== 'string') {
        return next(new ApiError(400, 'Invalid asset ID'));
      }

      const asset = await prisma.asset.findUnique({
        where: { id },
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
        new ApiResponse(200, 'Asset and files force-deleted by administrator successfully', null)
      );
    } catch (error) {
      next(error);
    }
  }
}
