import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const adminRouter = Router();

// Apply auth and admin check middleware globally to this router
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/stats', asyncHandler(AdminController.getStats));
adminRouter.get('/assets', asyncHandler(AdminController.listAllAssets));
adminRouter.delete('/assets/:id', asyncHandler(AdminController.deleteAsset));

export { adminRouter };
