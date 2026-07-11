import { Router } from 'express';
import { healthz } from '../controllers/healthz.controller.js';

const router = Router();

router.get('/healthz', healthz);

export default router;
