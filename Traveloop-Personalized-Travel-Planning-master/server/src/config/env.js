require('dotenv').config();
const { z } = require('zod');

// Validate all required environment variables at startup.
// The app will crash immediately with a clear message if anything is missing,
// rather than failing silently at runtime.
const envSchema = z.object({
  DATABASE_URL:         z.string().min(1),
  JWT_ACCESS_SECRET:   z.string().min(1),
  JWT_REFRESH_SECRET:  z.string().min(1),
  JWT_ACCESS_EXPIRY:   z.string().default('15m'),
  JWT_REFRESH_EXPIRY:  z.string().default('7d'),
  PORT:                z.coerce.number().default(5000),
  CLIENT_URL:          z.string().url().default('http://localhost:5173'),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
