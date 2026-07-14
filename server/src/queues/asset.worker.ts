import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import { redisConnection, ASSET_QUEUE_NAME } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { MetadataService } from '../services/metadata.service.js';
import { ImageService } from '../services/image.service.js';
import { StorageService } from '../services/storage.service.js';

interface ProcessingJobData {
  assetId: string;
  tempFilePath: string;
  originalName: string;
}

export const assetWorker = new Worker<ProcessingJobData>(
  ASSET_QUEUE_NAME,
  async (job: Job<ProcessingJobData>) => {
    const { assetId, tempFilePath, originalName } = job.data;
    console.log(`[Worker] Started processing asset ${assetId} for job ${job.id}`);

    if (!fs.existsSync(tempFilePath)) {
      console.error(`[Worker] File not found at temp path: ${tempFilePath}`);
      throw new Error(`Temporary file not found at ${tempFilePath}`);
    }

    let optimizedTempPath: string | null = null;
    let thumbnailTempPath: string | null = null;
    let mediumTempPath: string | null = null;

    try {
      // 1. Extract metadata
      const metadata = await MetadataService.extract(tempFilePath);
      const ext = path.extname(originalName) || '.webp';

      // 2. Generate processed copies in temp directory
      thumbnailTempPath = await ImageService.resizeImage(tempFilePath, 200, 200, 75, 'webp');
      mediumTempPath = await ImageService.resizeImage(tempFilePath, 1000, 1000, 80, 'webp');
      optimizedTempPath = await ImageService.optimizeOriginal(tempFilePath);

      // 3. Save files to persistent storage
      const finalOriginalName = `${assetId}-original${ext}`;
      const finalMediumName = `${assetId}-medium.webp`;
      const finalThumbnailName = `${assetId}-thumb.webp`;

      const originalPath = await StorageService.saveFile(optimizedTempPath, finalOriginalName, 'originals');
      const mediumPath = await StorageService.saveFile(mediumTempPath, finalMediumName, 'medium');
      const thumbnailPath = await StorageService.saveFile(thumbnailTempPath, finalThumbnailName, 'thumbnails');

      // Prevent unlinking in finally blocks if StorageService already renamed/unlinked
      optimizedTempPath = null;
      mediumTempPath = null;
      thumbnailTempPath = null;

      // 4. Update Database
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          path: originalPath,
          thumbnailPath,
          mediumPath,
          status: 'COMPLETED',
          metadata: metadata as any,
        },
      });

      console.log(`[Worker] Finished processing asset ${assetId}`);

      // 5. Clean up initial multer temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (error: any) {
      console.error(`[Worker] Error processing asset ${assetId}: ${error.message}`);
      
      // Update status to FAILED in the database
      try {
        await prisma.asset.update({
          where: { id: assetId },
          data: { status: 'FAILED' },
        });
      } catch (dbError) {
        console.error(`[Worker] Failed to update status to FAILED for asset ${assetId}:`, dbError);
      }

      // Attempt cleanup of temp files
      const pathsToClean = [tempFilePath, optimizedTempPath, thumbnailTempPath, mediumTempPath];
      for (const filePath of pathsToClean) {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            // Suppress error
          }
        }
      }

      throw error;
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 2,
  }
);

assetWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job?.id} completed successfully`);
});

assetWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});
