const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../src/db/mysql');
const logger = require('../src/utils/logger');

const seedAdmin = async () => {
  try {
    logger.info('Checking admin account...');

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@kodeye.dev']);

    if (existing.length > 0) {
      await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", ['admin@kodeye.dev']);
      logger.info('Admin account already exists, role set to admin');
      console.log('✓ Admin account already exists, role set to admin');
      return;
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash('admin123', 12);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, 'admin')`,
      [id, 'admin@kodeye.dev', passwordHash, 'Admin Kodeye']
    );

    logger.info('Admin account created: admin@kodeye.dev / admin123');
    console.log('✓ Admin account created');
    console.log('  Email: admin@kodeye.dev');
    console.log('  Password: admin123');
  } catch (error) {
    logger.error('Failed to seed admin account', error);
    console.error('✗ Failed to seed admin account:', error.message);
  } finally {
    await pool.end();
  }
};

seedAdmin();
