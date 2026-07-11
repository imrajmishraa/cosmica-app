import sharp from 'sharp';
import exifr from 'exifr';
import { ApiError } from '../utils/ApiError.js';

export interface ExtractedMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  cameraMake?: string;
  cameraModel?: string;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  gps?: {
    latitude: number;
    longitude: number;
  };
  creationDate?: string;
}

export class MetadataService {
  static async extract(filePath: string): Promise<ExtractedMetadata> {
    try {
      // 1. Get basic info via sharp
      const sharpMeta = await sharp(filePath).metadata();

      const metadata: ExtractedMetadata = {
        width: sharpMeta.width,
        height: sharpMeta.height,
        format: sharpMeta.format,
      };

      // 2. Get EXIF via exifr (failsafe parsing)
      try {
        const exifData = await exifr.parse(filePath, {
          tiff: true,
          xmp: true,
          gps: true,
          exif: true,
        });

        if (exifData) {
          metadata.cameraMake = exifData.Make;
          metadata.cameraModel = exifData.Model;
          metadata.exposureTime = exifData.ExposureTime;
          metadata.fNumber = exifData.FNumber;
          metadata.iso = exifData.ISO;
          metadata.focalLength = exifData.FocalLength;
          metadata.creationDate = exifData.DateTimeOriginal || exifData.CreateDate;

          if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
            metadata.gps = {
              latitude: exifData.latitude,
              longitude: exifData.longitude,
            };
          }
        }
      } catch (exifError) {
        // Suppress and log error since exif is optional
        console.warn(`No EXIF data extracted from file: ${exifError}`);
      }

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(500, `Failed to extract metadata: ${message}`);
    }
  }
}
