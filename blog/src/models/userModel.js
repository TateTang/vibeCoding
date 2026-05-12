const { pool } = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, avatar, created_at FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, avatar, created_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0] || null;
}

async function findByUsernameOrEmail(identifier) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, avatar, created_at FROM users WHERE username = ? OR email = ? LIMIT 1',
    [identifier, identifier]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, avatar, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
}

async function createUser({ username, email, password, avatar = null }) {
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
    [username, email, password, avatar]
  );

  return findById(result.insertId);
}

async function updateUser(id, fields) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return findById(id);
  }

  const setSql = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  await pool.query(`UPDATE users SET ${setSql} WHERE id = ?`, [...values, id]);
  return findById(id);
}

module.exports = {
  findByUsername,
  findByEmail,
  findByUsernameOrEmail,
  findById,
  createUser,
  updateUser,
};
