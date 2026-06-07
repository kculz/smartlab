import { validate } from '../utils/validation.js';

export const validateCreatePatient = validate('body', {
  first_name: { required: true, trim: true, minLength: 1, maxLength: 100 },
  last_name: { required: true, trim: true, minLength: 1, maxLength: 100 },
  phone: { required: true, trim: true, minLength: 7, maxLength: 20 },
  email: { required: true, trim: true, isEmail: true },
  date_of_birth: { required: false, trim: true },
  gender: { required: false, trim: true, isIn: ['Male', 'Female', 'Other'] },
  address: { required: false, trim: true, maxLength: 255 },
  city: { required: false, trim: true, maxLength: 120 },
});

export const validateUpdatePatient = validate('body', {
  first_name: { required: false, trim: true, minLength: 1, maxLength: 100 },
  last_name: { required: false, trim: true, minLength: 1, maxLength: 100 },
  phone: { required: false, trim: true, minLength: 7, maxLength: 20 },
  email: { required: false, trim: true, isEmail: true },
  date_of_birth: { required: false, trim: true },
  gender: { required: false, trim: true, isIn: ['Male', 'Female', 'Other'] },
  address: { required: false, trim: true, maxLength: 255 },
  city: { required: false, trim: true, maxLength: 120 },
});
