export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  LAB_TECHNICIAN: 'lab_technician',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  MANAGER: 'manager',
  PATIENT: 'patient',
};

export const SAMPLE_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REPORTED: 'Reported',
  RELEASED: 'Released',
};

export const TEST_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const INVOICE_STATUS = {
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const DEFAULT_PATIENT_PASSWORD = 'Password123!';

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
};

export const SAMPLE_SPECIMEN_TYPES = {
  BLOOD: 'Blood',
  URINE: 'Urine',
  STOOL: 'Stool',
  SWAB: 'Swab',
  SPUTUM: 'Sputum',
  SALIVA: 'Saliva',
  TISSUE: 'Tissue',
  OTHER: 'Other',
};

export const SAMPLE_PRIORITIES = {
  ROUTINE: 'Routine',
  URGENT: 'Urgent',
  STAT: 'STAT',
};

export const WORKFLOW_STAGES = {
  RECEPTION: 'Reception',
  LAB: 'Lab',
  DOCTOR_REVIEW: 'Doctor Review',
  PHARMACY: 'Pharmacy',
  COMPLETED: 'Completed',
};

export const CURRENCIES = {
  USD: 'USD',
  ZWL: 'ZWL',
};
