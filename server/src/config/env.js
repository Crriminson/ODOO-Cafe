import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Loads server/.env (two levels up from server/src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT:       parseInt(process.env.PORT || '5000', 10),
  NODE_ENV:   process.env.NODE_ENV  || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // DATABASE_URL takes priority; individual fields are the fallback for local dev
  DATABASE_URL: process.env.DATABASE_URL,
  DB: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME     || 'odoocafe',
  },

  JWT: {
    // Must be set explicitly; no silent fallback in production
    secret:    process.env.JWT_SECRET || 'dev_fallback_secret_change_in_prod',
    expiresIn: '12h',
  },
};
