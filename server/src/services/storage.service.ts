import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';

const storageProvider = ENV.STORAGE_PROVIDER;

// S3 / R2 / MinIO Client Config
const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  endpoint: ENV.S3_ENDPOINT,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = ENV.S3_BUCKET_NAME;

export class StorageService {
  /**
   * Save a file from temp path to destination persistent storage (local folder or S3)
   */
  static async saveFile(
    tempFilePath: string,
    destFileName: string,
    folderName: string
  ): Promise<string> {
    if (!fs.existsSync(tempFilePath)) {
      throw new ApiError(400, 'Source file does not exist');
    }

    const relativeDestPath = path.join(folderName, destFileName).replace(/\\/g, '/');

    if (storageProvider === 's3') {
      if (!BUCKET_NAME) {
        throw new ApiError(500, 'S3 bucket name is not configured');
      }

      const fileStream = fs.createReadStream(tempFilePath);
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: relativeDestPath,
        Body: fileStream,
      });

      try {
        await s3Client.send(command);
        return relativeDestPath;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new ApiError(500, `Failed uploading file to S3: ${message}`);
      } finally {
        // Always clean up temp file even if upload fails
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } else {
      // Local persistent storage
      const destDir = path.resolve(ENV.UPLOAD_DIR, folderName);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const destPath = path.join(destDir, destFileName);

      // Use rename or copy+unlink to support cross-device/volume renames
      try {
        await fs.promises.rename(tempFilePath, destPath);
      } catch {
        await fs.promises.copyFile(tempFilePath, destPath);
        await fs.promises.unlink(tempFilePath);
      }

      return `/uploads/${folderName}/${destFileName}`;
    }
  }

  /**
   * Delete a file from persistent storage (local folder or S3)
   */
  static async deleteFile(filePath: string): Promise<void> {
    if (storageProvider === 's3') {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
      });

      try {
        await s3Client.send(command);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed deleting file from S3: ${message}`);
      }
    } else {
      // Extract local path from URL suffix
      const baseUploadDir = path.resolve(ENV.UPLOAD_DIR);
      const normalizedPath = filePath.replace(/^\/uploads\//, '');
      const fullPath = path.join(baseUploadDir, normalizedPath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    }
  }
}
