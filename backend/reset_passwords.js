const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://postgres.gskhtnwvfrszxiwxxtzq:@Arpita1511@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);
  
  await client.query('UPDATE users SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL', [hash]);
  console.log('Successfully updated all users to have password "password123" and unlocked accounts.');
  
  await client.end();
}

run();
