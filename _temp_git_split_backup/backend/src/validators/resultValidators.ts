import { validate } from '../utils/validation.js';

const resultStatuses = ['Normal', 'Abnormal', 'Pending Review'];

export const validateCreateResult = validate('body', {
  sample_test_id: { required: true, isInt: true },
  value: { required: true, trim: true, minLength: 1, maxLength: 255 },
  status: { required: false, trim: true, isIn: resultStatuses },
});

export const validateUpdateResult = validate('body', {
  value: { required: false, trim: true, minLength: 1, maxLength: 255 },
  status: { required: false, trim: true, isIn: resultStatuses },
});

export const validateApproveResult = validate('params', {
  id: { required: true, isInt: true },
});
