import { validate } from '../utils/validation.js';

const allowedRoles = ['admin', 'receptionist', 'lab_technician', 'doctor', 'nurse', 'manager', 'patient'];

export const validateRegister = validate('body', {
  email: { required: true, trim: true, isEmail: true },
  password: { required: true, trim: true, minLength: 8 },
  full_name: { required: true, trim: true, minLength: 3, maxLength: 120 },
  phone: { required: true, trim: true, minLength: 7, maxLength: 20 },
  role: {
    required: false,
    trim: true,
    isIn: allowedRoles,
  },
});

export const validateLogin = validate('body', {
  email: { required: true, trim: true, isEmail: true },
  password: { required: true, trim: true, minLength: 8 },
});

export const validateChangePassword = validate('body', {
  current_password: { required: true, trim: true, minLength: 8 },
  new_password: { required: true, trim: true, minLength: 8 },
  confirm_password: {
    required: true,
    trim: true,
    custom: (value, req) =>
      value === req.body?.new_password ? null : 'confirm_password must match new_password',
  },
});
