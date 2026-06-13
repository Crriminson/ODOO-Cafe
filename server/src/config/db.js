import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool(
  env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        host:     env.DB.host,
        port:     env.DB.port,
        user:     env.DB.user,
        password: env.DB.password,
        database: env.DB.database,
      },
  {
    max:                    20,
    idleTimeoutMillis:      30_000,
    connectionTimeoutMillis: 2_000,
  }
);

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err);
});

/** Run a single query — use for everything that doesn't need a transaction. */
export const query = (text, params) => pool.query(text, params);

/** Grab a dedicated client from the pool — caller must call client.release(). */
export const getClient = () => pool.connect();

export default pool;
