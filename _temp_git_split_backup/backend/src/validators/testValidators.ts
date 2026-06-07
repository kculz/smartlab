import { validate } from '../utils/validation.js';

const currencies = ['USD', 'ZWL'];

export const validateCreateTest = validate('body', {
  test_category_id: { required: true, isInt: true },
  name: { required: true, trim: true, minLength: 2, maxLength: 150 },
  description: { required: false, trim: true, maxLength: 1000 },
  price: { required: true, isNumeric: true },
  currency: { required: false, trim: true, isIn: currencies },
});

export const validateUpdateTest = validate('body', {
  test_category_id: { required: false, isInt: true },
  name: { required: false, trim: true, minLength: 2, maxLength: 150 },
  description: { required: false, trim: true, maxLength: 1000 },
  price: { required: false, isNumeric: true },
  currency: { required: false, trim: true, isIn: currencies },
});
