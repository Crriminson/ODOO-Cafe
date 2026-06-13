import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or fewer'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(150, 'Email must be 150 characters or fewer'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),

  role: z.enum(['admin', 'employee'], {
    errorMap: () => ({ message: "Role must be 'admin' or 'employee'" }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name:  z.string().min(1, 'Name cannot be empty').max(100, 'Name must be 100 characters or fewer'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code e.g. #FF5733'),
});

export const updateCategorySchema = z.object({
  name:  z.string().min(1, 'Name cannot be empty').max(100, 'Name must be 100 characters or fewer').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code e.g. #FF5733').optional(),
}).refine(
  (data) => data.name !== undefined || data.color !== undefined,
  { message: 'At least one field (name or color) must be provided' }
);
