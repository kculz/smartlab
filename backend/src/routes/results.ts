import { Router } from 'express';
import * as resultController from '../controllers/resultController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import {
  validateApproveResult,
  validateCreateResult,
  validateUpdateResult,
} from '../validators/resultValidators.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['lab_technician', 'admin']),
  validateCreateResult,
  resultController.createResult
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['doctor', 'lab_technician', 'admin', 'manager']),
  resultController.getResults
);

router.get('/:id', authMiddleware, resultController.getResult);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['lab_technician', 'admin']),
  validateUpdateResult,
  resultController.updateResult
);

router.put(
  '/:id/approve',
  authMiddleware,
  roleMiddleware(['doctor', 'admin']),
  validateApproveResult,
  resultController.approveResult
);

router.put(
  '/:id/reject',
  authMiddleware,
  roleMiddleware(['doctor', 'admin']),
  resultController.rejectResult
);

export default router;
