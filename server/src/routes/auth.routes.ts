import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const authRouter = Router();

authRouter.post('/signup', asyncHandler(AuthController.signup));
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/refresh', asyncHandler(AuthController.refresh));
authRouter.post('/logout', asyncHandler(AuthController.logout));

export { authRouter };
