import pg from 'pg';

async function testHost(host) {
  console.log(`Testing host: ${host}`);
  const client = new pg.Client({
    host: host,
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS connected to ${host}!`);
    const { rows } = await client.query('SELECT version();');
    console.log('PostgreSQL version:', rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED connection to ${host}:`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const v4 = await testHost('127.0.0.1');
  const v6 = await testHost('::1');
  if (v4 || v6) {
    console.log('At least one connection succeeded!');
  } else {
    console.log('Both connections failed.');
  }
}

main();
