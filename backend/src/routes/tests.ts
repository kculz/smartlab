import { Router } from 'express';
import * as testController from '../controllers/testController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import {
  validateCreateTest,
  validateUpdateTest,
} from '../validators/testValidators.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  validateCreateTest,
  testController.createTest
);

router.get('/', authMiddleware, testController.getTests);

router.get('/:id', authMiddleware, testController.getTest);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  validateUpdateTest,
  testController.updateTest
);

router.put(
  '/:id/toggle',
  authMiddleware,
  roleMiddleware(['admin']),
  testController.toggleTestStatus
);

export default router;
