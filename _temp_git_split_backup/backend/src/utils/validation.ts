import { NextFunction, Request, RequestHandler, Response } from 'express';
import validator from 'validator';

type ValidationSource = 'body' | 'params' | 'query';

type ValidationRule = {
  required?: boolean;
  trim?: boolean;
  isString?: boolean;
  isEmail?: boolean;
  isInt?: boolean;
  isNumeric?: boolean;
  isBoolean?: boolean;
  isArray?: boolean;
  isIn?: readonly string[];
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown, req: Request) => string | null;
  transform?: (value: unknown, req: Request) => unknown;
};

type ValidationSchema = Record<string, ValidationRule>;

export const validate = (
  source: ValidationSource,
  schema: ValidationSchema
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = (req as Request & Record<ValidationSource, Record<string, unknown>>)[source] || {};
    const errors: Array<{ field: string; message: string }> = [];
    const updates: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const hasValue =
        value !== undefined && value !== null && value !== '';

      if (rule.required && !hasValue) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (!hasValue) {
        continue;
      }

      let normalizedValue = value;

      if (rule.trim && typeof normalizedValue === 'string') {
        normalizedValue = normalizedValue.trim();
      }

      if (rule.isString && typeof normalizedValue !== 'string') {
        errors.push({ field, message: `${field} must be a string` });
        continue;
      }

      if (rule.isEmail && (!validator.isEmail(String(normalizedValue)) || typeof normalizedValue !== 'string')) {
        errors.push({ field, message: `${field} must be a valid email address` });
        continue;
      }

      if (rule.isInt && !validator.isInt(String(normalizedValue))) {
        errors.push({ field, message: `${field} must be an integer` });
        continue;
      }

      if (rule.isNumeric && !validator.isNumeric(String(normalizedValue))) {
        errors.push({ field, message: `${field} must be numeric` });
        continue;
      }

      if (rule.isBoolean && !validator.isBoolean(String(normalizedValue))) {
        errors.push({ field, message: `${field} must be a boolean` });
        continue;
      }

      if (rule.isArray && !Array.isArray(normalizedValue)) {
        errors.push({ field, message: `${field} must be an array` });
        continue;
      }

      if (rule.isIn && !validator.isIn(String(normalizedValue), [...rule.isIn])) {
        errors.push({
          field,
          message: `${field} must be one of: ${rule.isIn.join(', ')}`,
        });
        continue;
      }

      if (rule.minLength !== undefined && !validator.isLength(String(normalizedValue), { min: rule.minLength })) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters long`,
        });
        continue;
      }

      if (rule.maxLength !== undefined && !validator.isLength(String(normalizedValue), { max: rule.maxLength })) {
        errors.push({
          field,
          message: `${field} must be no more than ${rule.maxLength} characters long`,
        });
        continue;
      }

      if (rule.custom) {
        const errorMessage = rule.custom(normalizedValue, req);
        if (errorMessage) {
          errors.push({ field, message: errorMessage });
          continue;
        }
      }

      updates[field] = rule.transform ? rule.transform(normalizedValue, req) : normalizedValue;
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    if (source === 'body') {
      req.body = { ...req.body, ...updates };
    }

    next();
  };
};
