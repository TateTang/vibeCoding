const { pool } = require('../config/db');

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === 'string' && tags.trim()) {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [tags];
    } catch {
      return [tags];
    }
  }

  return [];
}

function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (Buffer.isBuffer(tags)) {
    return parseTags(tags.toString('utf8'));
  }

  if (typeof tags === 'string' && tags.trim()) {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [tags];
    }
  }

  return [];
}

function formatArticle(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    tags: parseTags(row.tags),
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name || null,
        }
      : null,
    author: row.author_id
      ? {
          id: row.author_id,
          username: row.author_username,
          avatar: row.author_avatar,
        }
      : null,
  };
}

async function getArticles({ page = 1, pageSize = 10, limit, category, categoryId, keyword }) {
  const currentPageSize = Number(pageSize || limit || 10);
  const offset = (page - 1) * currentPageSize;
  const whereClauses = [];
  const values = [];

  const categoryFilter = category !== undefined ? category : categoryId;
  if (categoryFilter !== undefined && categoryFilter !== null && String(categoryFilter).trim()) {
    const normalizedCategory = String(categoryFilter).trim();

    if (/^\d+$/.test(normalizedCategory)) {
      whereClauses.push('a.category_id = ?');
      values.push(Number(normalizedCategory));
    } else {
      whereClauses.push('c.name = ?');
      values.push(normalizedCategory);
    }
  }

  if (keyword) {
    whereClauses.push('(a.title LIKE ? OR a.content LIKE ?)');
    values.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.title,
       a.content,
       a.cover,
       a.category_id,
       c.name AS category_name,
       a.tags,
       a.views,
       a.created_at,
       a.updated_at,
       u.id AS author_id,
       u.username AS author_username,
       u.avatar AS author_avatar
     FROM articles a
     LEFT JOIN users u ON a.author_id = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereSql}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, currentPageSize, Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereSql}`,
    values
  );

  return {
    list: rows.map(formatArticle),
    total: countRows[0]?.total || 0,
  };
}

async function getArticleById(id) {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.title,
       a.content,
       a.cover,
       a.category_id,
       c.name AS category_name,
       a.tags,
       a.views,
       a.created_at,
       a.updated_at,
       u.id AS author_id,
       u.username AS author_username,
       u.avatar AS author_avatar
     FROM articles a
     LEFT JOIN users u ON a.author_id = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );

  return formatArticle(rows[0] || null);
}

async function incrementArticleViews(id) {
  await pool.query('UPDATE articles SET views = views + 1 WHERE id = ?', [id]);
}

async function createArticle({ title, content, cover = null, categoryId = null, tags = [], authorId }) {
  const [result] = await pool.query(
    'INSERT INTO articles (title, content, cover, category_id, tags, author_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, content, cover, categoryId, JSON.stringify(normalizeTags(tags)), authorId]
  );

  return getArticleById(result.insertId);
}

async function updateArticle(id, fields) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return getArticleById(id);
  }

  const setSql = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([key, value]) => (key === 'tags' ? JSON.stringify(normalizeTags(value)) : value));

  await pool.query(`UPDATE articles SET ${setSql} WHERE id = ?`, [...values, id]);
  return getArticleById(id);
}

async function deleteArticle(id, authorId) {
  const [result] = await pool.query('DELETE FROM articles WHERE id = ? AND author_id = ?', [id, authorId]);
  return result.affectedRows > 0;
}

module.exports = {
  getArticles,
  getArticleById,
  incrementArticleViews,
  createArticle,
  updateArticle,
  deleteArticle,
};
