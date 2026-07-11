import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { AssetController } from '../controllers/asset.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const assetRouter = Router();

// Secure all asset management routes
assetRouter.use(requireAuth);

assetRouter.get('/', asyncHandler(AssetController.listAssets));
assetRouter.get('/search', asyncHandler(AssetController.searchAssets));
assetRouter.put('/:id', asyncHandler(AssetController.updateAsset));
assetRouter.delete('/:id', asyncHandler(AssetController.deleteAsset));

export { assetRouter };
