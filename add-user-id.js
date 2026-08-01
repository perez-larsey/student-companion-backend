const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function addUserIdColumns() {
  await sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  await sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  console.log('user_id columns added');
}

addUserIdColumns();