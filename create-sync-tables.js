const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createSyncTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_classes (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      data JSONB NOT NULL DEFAULT '[]'
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_slides (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      data JSONB NOT NULL DEFAULT '[]'
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      data JSONB NOT NULL DEFAULT '{}'
    )
  `;
  console.log('Sync tables created successfully');
}

createSyncTables();