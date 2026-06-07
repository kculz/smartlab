import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';

const router = Router();

router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware(['doctor', 'admin']),
  doctorController.getDashboardSummary
);

export default router;
