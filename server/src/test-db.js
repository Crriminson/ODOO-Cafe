import pg from 'pg';
import { env } from './config/env.js';

// Apply the defaults workaround
pg.defaults.password = '';

const client = new pg.Client({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  database: 'postgres'
});

async function main() {
  console.log('Connecting to postgres with pg.defaults.password workaround...');
  await client.connect();
  console.log('Connected successfully!');
  const { rows } = await client.query('SELECT version();');
  console.log('PostgreSQL version:', rows[0].version);
  await client.end();
}

main().catch(err => {
  console.error('Connection failed:', err);
  process.exit(1);
});
