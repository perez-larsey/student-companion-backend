const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      score NUMERIC NOT NULL,
      credits INTEGER NOT NULL
    )
  `;
  console.log('Table created successfully');
}

createTable();