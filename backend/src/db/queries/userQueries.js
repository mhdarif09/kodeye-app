const pool = require('../mysql');

const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

const findByGoogleId = async (googleId) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0];
};

const createUser = async (data) => {
  const { id, email, password_hash, google_id, display_name, avatar_url } = data;
  await pool.query(
    'INSERT INTO users (id, email, password_hash, google_id, display_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
    [id, email, password_hash || null, google_id || null, display_name || null, avatar_url || null]
  );
  return await findById(id);
};

const updateUser = async (id, data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) return await findById(id);

  const setString = keys.map((key) => `${key} = ?`).join(', ');
  const values = keys.map((key) => data[key]);
  values.push(id);

  await pool.query(`UPDATE users SET ${setString} WHERE id = ?`, values);
  return await findById(id);
};

const ALLOWED_PROFILE_FIELDS = [
  'display_name',
  'avatar_url',
  'tech_stacks',
  'skill_categories',
  'experience_level',
  'preferred_language',
];

const updateProfile = async (id, fields) => {
  const keys = Object.keys(fields).filter((k) => ALLOWED_PROFILE_FIELDS.includes(k));
  if (keys.length === 0) return await findById(id);

  const setString = keys.map((key) => `${key} = ?`).join(', ');
  const values = keys.map((key) => {
    if (key === 'tech_stacks' || key === 'skill_categories') {
      return JSON.stringify(fields[key]);
    }
    return fields[key];
  });
  values.push(id);

  await pool.query(`UPDATE users SET ${setString} WHERE id = ?`, values);
  return await findById(id);
};

const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
};

module.exports = {
  findByEmail,
  findById,
  findByGoogleId,
  createUser,
  updateUser,
  updateProfile,
  deleteUser,
};
