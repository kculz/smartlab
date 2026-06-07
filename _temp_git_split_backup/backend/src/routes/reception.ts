import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import { getDashboardSummary } from '../controllers/receptionController.js';

const router = Router();

router.get('/dashboard', authMiddleware, roleMiddleware(['receptionist', 'admin']), getDashboardSummary);

export default router;
