const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

// ── AUTH ──
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this';

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      RETURNING id, email
    `;
    const token = jwt.sign({ userId: result[0].id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: result[0] });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, users[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: users[0].id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: users[0].id, email: users[0].email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── GRADES ──
app.get('/grades', requireAuth, async (req, res) => {
  const grades = await sql`SELECT * FROM grades WHERE user_id = ${req.userId} ORDER BY id`;
  res.json(grades);
});

app.post('/grades', requireAuth, async (req, res) => {
  const { name, score, credits } = req.body;
  if (!name || score == null || credits == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const result = await sql`
    INSERT INTO grades (name, score, credits, user_id)
    VALUES (${name}, ${score}, ${credits}, ${req.userId})
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

app.delete('/grades/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM grades WHERE id = ${id} AND user_id = ${req.userId}`;
  res.status(204).send();
});

// ── TASKS ──
app.get('/tasks', requireAuth, async (req, res) => {
  const tasks = await sql`SELECT * FROM tasks WHERE user_id = ${req.userId} ORDER BY id`;
  res.json(tasks);
});

app.post('/tasks', requireAuth, async (req, res) => {
  const { name, date, priority } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const result = await sql`
    INSERT INTO tasks (name, date, priority, done, user_id)
    VALUES (${name}, ${date}, ${priority}, false, ${req.userId})
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

app.put('/tasks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  const result = await sql`
    UPDATE tasks SET done = ${done} WHERE id = ${id} AND user_id = ${req.userId}
    RETURNING *
  `;
  res.json(result[0]);
});

app.delete('/tasks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${req.userId}`;
  res.status(204).send();
});

// ── NOTES ──
app.get('/notes', requireAuth, async (req, res) => {
  const notes = await sql`SELECT * FROM notes WHERE user_id = ${req.userId} ORDER BY id`;
  res.json(notes);
});

app.post('/notes', requireAuth, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing fields' });
  const result = await sql`
    INSERT INTO notes (title, body, user_id)
    VALUES (${title}, ${body}, ${req.userId})
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

app.delete('/notes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${req.userId}`;
  res.status(204).send();
});

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));