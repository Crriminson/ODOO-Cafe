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

// ─── Products ───────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name:                z.string().min(1).max(150),
  category_id:         z.number().int().positive(),
  price:               z.number().nonnegative(),
  unit_of_measure:     z.enum(['piece', 'kg', 'litre']),
  tax_rate:            z.number().min(0).max(100).default(0),
  description:         z.string().max(1000).optional().nullable(),
  estimated_prep_time: z.number().int().positive().optional().nullable(),
  show_on_kds:         z.boolean().default(true),
});

export const updateProductSchema = z.object({
  name:                z.string().min(1).max(150).optional(),
  category_id:         z.number().int().positive().optional(),
  price:               z.number().nonnegative().optional(),
  unit_of_measure:     z.enum(['piece', 'kg', 'litre']).optional(),
  tax_rate:            z.number().min(0).max(100).optional(),
  description:         z.string().max(1000).optional().nullable(),
  estimated_prep_time: z.number().int().positive().optional().nullable(),
  show_on_kds:         z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// ─── Floors & Tables ─────────────────────────────────────────────────────────

export const createFloorSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createTableSchema = z.object({
  table_number: z.number().int().positive(),
  seats:        z.number().int().positive(),
});

export const updateTableSchema = z.object({
  table_number: z.number().int().positive().optional(),
  seats:        z.number().int().positive().optional(),
  is_active:    z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);
