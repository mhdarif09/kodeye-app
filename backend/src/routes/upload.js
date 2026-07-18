const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const verifyJWT = require('../middleware/auth');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('File type not allowed. Use: jpg, png, gif, webp, svg', 400));
    }
  },
});

const router = express.Router();

router.use(verifyJWT);

router.post('/image', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large. Max 5MB', 400));
      }
      return next(err);
    }
    if (!req.file) return next(new AppError('No file uploaded', 400));

    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ data: { url } });
  });
});

module.exports = router;
