const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    if (sql.trim()) {
      await db.query(sql);
      console.log(`Applied ${file}`);
    }
  }

  await db.pool.end();
}

migrate().catch(async (error) => {
  console.error(error);
  await db.pool.end();
  process.exit(1);
});
