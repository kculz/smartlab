import { validate } from '../utils/validation.js';
import { SAMPLE_PRIORITIES, SAMPLE_SPECIMEN_TYPES } from '../constants/enums.js';

const statuses = ['Pending', 'In Progress', 'Completed', 'Reported', 'Released'];
const stages = ['Reception', 'Lab', 'Doctor Review', 'Pharmacy', 'Completed'];
const specimenTypes = Object.values(SAMPLE_SPECIMEN_TYPES);
const priorities = Object.values(SAMPLE_PRIORITIES);

export const validateCreateSample = validate('body', {
  patient_id: { required: true, isInt: true },
  specimen_type: { required: false, trim: true, isIn: specimenTypes },
  priority: { required: false, trim: true, isIn: priorities },
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
  notes: { required: false, trim: true, maxLength: 2000 },
});

export const validateUpdateSampleStatus = validate('body', {
  current_status: { required: false, trim: true, isIn: statuses },
  current_stage: { required: false, trim: true, isIn: stages },
  notes: { required: false, trim: true, maxLength: 2000 },
});
