import { validate } from '../utils/validation.js';
import { PAYMENT_METHODS, INVOICE_STATUS } from '../constants/enums.js';

const invoiceStatuses = [
  INVOICE_STATUS.PENDING,
  INVOICE_STATUS.PARTIALLY_PAID,
  INVOICE_STATUS.PAID,
  INVOICE_STATUS.CANCELLED,
];
const currencies = ['USD', 'ZWL'];
const paymentMethods = Object.values(PAYMENT_METHODS);

export const validateCreateInvoice = validate('body', {
  patient_id: { required: true, isInt: true },
  test_ids: {
    required: true,
    isArray: true,
    custom: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'test_ids must contain at least one test';
      }

      const hasInvalidId = value.some((item) => !Number.isInteger(Number(item)));
      return hasInvalidId ? 'test_ids must contain only integers' : null;
    },
    transform: (value) => (Array.isArray(value) ? value.map((item) => Number(item)) : value),
  },
  currency: { required: true, trim: true, isIn: currencies },
});

export const validateUpdateInvoiceStatus = validate('body', {
  status: { required: true, trim: true, isIn: invoiceStatuses },
});

export const validateRecordInvoicePayment = validate('body', {
  payer_name: { required: true, trim: true, minLength: 2, maxLength: 120 },
  amount_tendered: {
    required: true,
    isNumeric: true,
    custom: (value) => (Number(value) > 0 ? null : 'amount_tendered must be greater than zero'),
    transform: (value) => Number(value),
  },
  payment_method: {
    required: true,
    trim: true,
    isIn: paymentMethods,
  },
  reference_number: { required: false, trim: true, maxLength: 120 },
  notes: { required: false, trim: true, maxLength: 500 },
});
