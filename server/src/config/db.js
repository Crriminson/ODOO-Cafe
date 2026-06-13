import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const poolConfig = env.DB.url
  ? { connectionString: env.DB.url }
  : {
      host: env.DB.host,
      port: env.DB.port,
      user: env.DB.user,
      password: env.DB.password,
      database: env.DB.database
    };

const pool = new Pool({
  ...poolConfig,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  // Database client connected
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;
