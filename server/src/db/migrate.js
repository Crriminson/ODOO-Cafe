import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import pool, { getClient } from '../config/db.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const SEED_FILE = path.resolve(__dirname, 'seeds/seed.sql');

async function ensureDatabaseExists() {
  const dbName = env.DATABASE_URL
    ? env.DATABASE_URL.split('/').pop().split('?')[0]
    : env.DB.database;

  // Connection config for default postgres database
  let tempConfig;
  if (env.DATABASE_URL) {
    const urlObj = new URL(env.DATABASE_URL);
    urlObj.pathname = '/postgres';
    tempConfig = { connectionString: urlObj.toString() };
  } else {
    tempConfig = {
      host: env.DB.host,
      port: env.DB.port,
      user: env.DB.user,
      password: env.DB.password,
      database: 'postgres'
    };
  }

  const client = new pg.Client(tempConfig);
  await client.connect();
  try {
    const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1;', [dbName]);
    if (rows.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName};`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.error('Error during database checking/creation:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC;');
  return new Set(rows.map(r => r.name));
}

export async function runMigrations() {
  console.log('Initiating database layer...');
  await ensureDatabaseExists();

  console.log('Starting database migrations...');
  const client = await getClient();
  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    let runCount = 0;
    for (const file of sqlFiles) {
      if (applied.has(file)) {
        continue;
      }
      
      console.log(`Applying migration: ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        runCount++;
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`Migration ${file} failed:`, err);
        throw err;
      }
    }
    
    if (runCount === 0) {
      console.log('Database is already up to date. No new migrations to apply.');
    } else {
      console.log(`Successfully applied ${runCount} migration(s).`);
    }
  } catch (err) {
    console.error('Migration run failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

export async function runSeeds() {
  console.log('Seeding database...');
  const client = await getClient();
  try {
    const sql = await fs.readFile(SEED_FILE, 'utf-8');
    if (!sql.trim()) {
      console.log('Seed file is empty. Skipping.');
      return;
    }
    
    await client.query('BEGIN;');
    try {
      await client.query(sql);
      await client.query('COMMIT;');
      console.log('Database seeded successfully.');
    } catch (err) {
      await client.query('ROLLBACK;');
      console.error('Seeding failed:', err);
      throw err;
    }
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

const isDirect = process.argv[1] && (
  process.argv[1].endsWith('migrate.js') || 
  process.argv[1].endsWith('migrate')
);

if (isDirect) {
  runMigrations()
    .then(() => {
      console.log('Migration runner finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
