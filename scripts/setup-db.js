const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const password = process.env.SUPABASE_DB_PASSWORD || 'jjLIuJSImnRREHDF';
const encodedPassword = encodeURIComponent(password);
const projectRef = 'wpsgaxzwlbvvpkchvsjq';

const candidates = [
  // 1. Session pooler (Port 5432 - best for DDL / migrations)
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  // 2. Direct connection
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  // 3. Transaction pooler (Port 6543)
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
];

async function tryConnect(connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  return client;
}

async function main() {
  let client = null;
  let connectedUrl = '';

  for (const url of candidates) {
    const masked = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`Attempting connection to: ${masked}...`);
    try {
      client = await tryConnect(url);
      connectedUrl = masked;
      console.log(`Successfully connected!`);
      break;
    } catch (err) {
      console.log(`Failed with: ${err.message}. Trying next candidate...`);
    }
  }

  if (!client) {
    console.error('ERROR: Could not establish a connection to any database endpoint.');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'setup_all.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Reading and executing setup_all.sql...');
    await client.query(sql);

    console.log('----------------------------------------------------');
    console.log('SUCCESS! All database tables, triggers, and seed data have been created!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('SQL Execution Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
