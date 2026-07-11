import { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email';
  minLength?: number;
  maxLength?: number;
  enum?: string[];
};

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const body = req.body;

    for (const rule of rules) {
      const value = body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`'${rule.field}' is required`);
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      if (rule.type === 'email') {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(String(value))) errors.push(`'${rule.field}' must be a valid email`);
      } else if (rule.type && typeof value !== rule.type) {
        errors.push(`'${rule.field}' must be a ${rule.type}`);
      }

      if (rule.minLength && String(value).length < rule.minLength) {
        errors.push(`'${rule.field}' must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && String(value).length > rule.maxLength) {
        errors.push(`'${rule.field}' must be at most ${rule.maxLength} characters`);
      }

      if (rule.enum && !rule.enum.includes(String(value))) {
        errors.push(`'${rule.field}' must be one of: ${rule.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
}
