const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.gskhtnwvfrszxiwxxtzq:@Arpita1511@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB!');
  try {
    const res = await client.query('SELECT email, role, status, failed_login_attempts FROM users LIMIT 5');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  }
  await client.end();
}

run();
