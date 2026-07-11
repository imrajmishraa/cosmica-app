import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authRouter } from './auth.routes.js';
import { uploadRouter } from './upload.routes.js';
import { assetRouter } from './asset.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/assets', assetRouter);

// Health check endpoint
router.get('/health', async (_req, res, next) => {
  try {
    // Check database connection
    await prisma.$executeRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'success',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      memoryUsage: process.memoryUsage(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

export { router };
