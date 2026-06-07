import { Router } from 'express';
import * as sampleController from '../controllers/sampleController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import {
  validateCreateSample,
  validateUpdateSampleStatus,
} from '../validators/sampleValidators.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateCreateSample,
  sampleController.createSample
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin', 'lab_technician', 'doctor', 'manager']),
  sampleController.getSamples
);

router.get('/track/:sample_id', sampleController.trackSample);

router.get('/:id', authMiddleware, sampleController.getSample);

router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['lab_technician', 'doctor', 'admin']),
  validateUpdateSampleStatus,
  sampleController.updateSampleStatus
);

export default router;
