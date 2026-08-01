const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  const result = await sql`SELECT 1 as test`;
  console.log('Connection successful:', result);
}

testConnection();
