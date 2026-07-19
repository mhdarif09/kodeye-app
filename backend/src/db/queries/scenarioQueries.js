const pool = require('../mysql');

const findAll = async (filters) => {
  let query = 'SELECT * FROM scenarios';
  const conditions = [];
  const values = [];

  if (filters.category) {
    conditions.push('category = ?');
    values.push(filters.category);
  }
  if (filters.difficulty) {
    conditions.push('difficulty = ?');
    values.push(filters.difficulty);
  }
  if (filters.mode) {
    conditions.push('mode = ?');
    values.push(filters.mode);
  }
  if (filters.skill_category) {
    conditions.push('skill_category = ?');
    values.push(filters.skill_category);
  }
  if (filters.is_active !== undefined) {
    conditions.push('is_active = ?');
    values.push(filters.is_active);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(query, values);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM scenarios WHERE id = ?', [id]);
  return rows[0];
};

const findBySlug = async (slug) => {
  const [rows] = await pool.query('SELECT * FROM scenarios WHERE slug = ?', [slug]);
  return rows[0];
};

const insertScenario = async (data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  await pool.query(
    `INSERT INTO scenarios (${keys.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return await findById(data.id);
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  insertScenario,
};
