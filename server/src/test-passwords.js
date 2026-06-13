import pg from 'pg';

const PASSWORDS = [
  'postgres',
  'root',
  'admin',
  '123456',
  '1234',
  '12345',
  'password',
  'password123',
  'odoocafe',
  'odoo',
  'latak',
  'latak123',
  'Latak123!'
];

async function tryPassword(password) {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log(`\n========================================`);
    console.log(`SUCCESS! Connected with password: "${password}"`);
    console.log(`========================================\n`);
    await client.end();
    return password;
  } catch (err) {
    if (err.message.includes('SASL: SCRAM-SERVER-FIRST-MESSAGE')) {
      console.log(`Password "${password}": SASL SCRAM issue (empty/falsy)`);
    } else {
      console.log(`Password "${password}": ${err.message}`);
    }
    try { await client.end(); } catch (e) {}
    return null;
  }
}

async function main() {
  console.log('Testing common passwords against local PostgreSQL...');
  for (const pw of PASSWORDS) {
    const success = await tryPassword(pw);
    if (success) {
      process.exit(0);
    }
  }
  console.log('None of the common passwords worked.');
}

main();
