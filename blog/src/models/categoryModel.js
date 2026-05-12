const { pool } = require('../config/db');

async function getAllCategories() {
  const [rows] = await pool.query('SELECT id, name, description FROM categories ORDER BY id DESC');
  return rows;
}

async function findCategoryById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, description FROM categories WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
}

async function findCategoryByName(name) {
  const [rows] = await pool.query(
    'SELECT id, name, description FROM categories WHERE name = ? LIMIT 1',
    [name]
  );

  return rows[0] || null;
}

async function findCategoryByIdentifier(identifier) {
  if (identifier === undefined || identifier === null) {
    return null;
  }

  const normalizedIdentifier = String(identifier).trim();
  if (!normalizedIdentifier) {
    return null;
  }

  if (/^\d+$/.test(normalizedIdentifier)) {
    return findCategoryById(Number(normalizedIdentifier));
  }

  return findCategoryByName(normalizedIdentifier);
}

async function createCategory({ name, description = null }) {
  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description]
  );

  const [rows] = await pool.query('SELECT id, name, description FROM categories WHERE id = ? LIMIT 1', [result.insertId]);
  return rows[0] || null;
}

module.exports = {
  getAllCategories,
  findCategoryById,
  findCategoryByName,
  findCategoryByIdentifier,
  createCategory,
};
