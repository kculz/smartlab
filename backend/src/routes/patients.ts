import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import {
  validateCreatePatient,
  validateUpdatePatient,
} from '../validators/patientValidators.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateCreatePatient,
  patientController.createPatient
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin', 'doctor', 'manager']),
  patientController.getPatients
);

router.get(
  '/:id',
  authMiddleware,
  patientController.getPatient
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateUpdatePatient,
  patientController.updatePatient
);

export default router;
