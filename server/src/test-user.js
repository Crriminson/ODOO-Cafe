import pg from 'pg';

async function testUser(user) {
  console.log(`Testing connection as user: "${user}"...`);
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: user,
    database: 'postgres'
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS! Connected as user: "${user}"`);
    const { rows } = await client.query('SELECT version();');
    console.log('PostgreSQL version:', rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED connection for user "${user}":`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  await testUser('latak');
  await testUser('');
}

main();
