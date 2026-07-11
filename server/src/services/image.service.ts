import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

export class ImageService {
  /**
   * Resizes and compresses an image, saving it to a temp file, then returns the temp file path.
   */
  static async resizeImage(
    inputPath: string,
    width: number,
    height: number,
    quality = 80,
    format: 'webp' | 'jpeg' | 'png' = 'webp'
  ): Promise<string> {
    if (!fs.existsSync(inputPath)) {
      throw new ApiError(400, 'Input file for processing does not exist');
    }

    const tempDir = path.dirname(inputPath);
    const tempFileName = `processed-${Date.now()}-${width}x${height}-${Math.round(Math.random() * 1000)}.${format}`;
    const outputPath = path.join(tempDir, tempFileName);

    try {
      let pipeline = sharp(inputPath).resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      });

      if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, progressive: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
      }

      await pipeline.toFile(outputPath);
      return outputPath;
    } catch (error) {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(500, `Sharp image processing failed: ${message}`);
    }
  }

  /**
   * Optimize the original image and return its temp path.
   */
  static async optimizeOriginal(inputPath: string): Promise<string> {
    const metadata = await sharp(inputPath).metadata();
    const format =
      (metadata.format as string) === 'webp' || (metadata.format as string) === 'avif'
        ? metadata.format
        : 'webp';
    const tempDir = path.dirname(inputPath);
    const tempFileName = `optimized-${Date.now()}-${Math.round(Math.random() * 1000)}.${format}`;
    const outputPath = path.join(tempDir, tempFileName);

    try {
      let pipeline = sharp(inputPath);
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 85 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
      }

      await pipeline.toFile(outputPath);
      return outputPath;
    } catch (error) {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(500, `Optimizing original failed: ${message}`);
    }
  }
}
