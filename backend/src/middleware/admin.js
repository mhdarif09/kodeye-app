const AppError = require('../utils/AppError');
const pool = require('../db/mysql');

const requireAdmin = async (req, res, next) => {
  try {
    const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== 'admin') {
      return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAdmin;
