import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';

const router = Router();

router.get(
  '/summary',
  authMiddleware,
  roleMiddleware(['manager', 'admin']),
  reportController.getSummary
);

export default router;
