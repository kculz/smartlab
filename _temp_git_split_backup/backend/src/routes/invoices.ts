import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/roles.js';
import {
  validateCreateInvoice,
  validateRecordInvoicePayment,
  validateUpdateInvoiceStatus,
} from '../validators/invoiceValidators.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateCreateInvoice,
  invoiceController.createInvoice
);

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin', 'manager']),
  invoiceController.getInvoices
);

router.get('/:id', authMiddleware, invoiceController.getInvoice);

router.post(
  '/:id/payments',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateRecordInvoicePayment,
  invoiceController.recordInvoicePayment
);

router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['receptionist', 'admin']),
  validateUpdateInvoiceStatus,
  invoiceController.updateInvoiceStatus
);

export default router;
