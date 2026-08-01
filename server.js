const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

// ── TASKS ──
app.get('/tasks', async (req, res) => {
  const tasks = await sql`SELECT * FROM tasks ORDER BY id`;
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const { name, date, priority } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const result = await sql`
    INSERT INTO tasks (name, date, priority, done)
    VALUES (${name}, ${date}, ${priority}, false)
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  const result = await sql`
    UPDATE tasks SET done = ${done} WHERE id = ${id}
    RETURNING *
  `;
  res.json(result[0]);
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM tasks WHERE id = ${id}`;
  res.status(204).send();
});

// ── NOTES ──
app.get('/notes', async (req, res) => {
  const notes = await sql`SELECT * FROM notes ORDER BY id`;
  res.json(notes);
});

app.post('/notes', async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing fields' });
  const result = await sql`
    INSERT INTO notes (title, body)
    VALUES (${title}, ${body})
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM notes WHERE id = ${id}`;
  res.status(204).send();
});

// GET all grades
app.get('/grades', async (req, res) => {
  const grades = await sql`SELECT * FROM grades ORDER BY id`;
  res.json(grades);
});

// POST a new grade
app.post('/grades', async (req, res) => {
  const { name, score, credits } = req.body;
  if (!name || score == null || credits == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const result = await sql`
    INSERT INTO grades (name, score, credits)
    VALUES (${name}, ${score}, ${credits})
    RETURNING *
  `;
  res.status(201).json(result[0]);
});

// DELETE a grade
app.delete('/grades/:id', async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM grades WHERE id = ${id}`;
  res.status(204).send();
});

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));