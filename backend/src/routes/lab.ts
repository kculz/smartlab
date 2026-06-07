import { Router } from 'express';
import * as labController from '../controllers/labController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';

const router = Router();

router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware(['lab_technician', 'admin']),
  labController.getDashboardSummary
);

export default router;
