const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const mysqlPool = require('./src/db/mysql');
const redisClient = require('./src/db/redis');
const AppError = require('./src/utils/AppError');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const scenarioRoutes = require('./src/routes/scenarios');
const matchmakingRoutes = require('./src/routes/matchmaking');
const matchmakingService = require('./src/services/matchmakingService');
const sessionRoutes = require('./src/routes/sessions');
const { router: adminRoutes, publicRouter: adminPublicRoutes } = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const curriculumRoutes = require('./src/routes/curriculum');
const { handleNotification } = require('./src/services/paymentService');
const { initSocket } = require('./src/socket/index');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: config.env === 'development' ? true : [config.frontendUrl, ...config.frontendUrls],
    credentials: true,
  },
});

// Middlewares
app.use(helmet());

const allowedOrigins = (config.env === 'development') ? [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  /^http:\/\/localhost:\d+$/,
] : [
  config.frontendUrl,
  ...(config.frontendUrls || []),
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);
      const match = allowedOrigins.some((a) =>
        typeof a === 'string' ? origin === a || origin === a.replace(/\/$/, '') : a.test(origin)
      );
      if (match) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(mongoSanitize()); // Strip strange inputs

// Morgan setup to winston
const morganFormat = config.env === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Payment notification webhook — must be BEFORE global rate limiter
app.post('/api/payment/notification', async (req, res, next) => {
  try {
    await handleNotification(req.body, req.headers);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Notification handler error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Auth routes mounted BEFORE global limiter (no rate limit on auth)
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminPublicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/curriculum', curriculumRoutes);

// Health Check
app.get('/health', async (req, res, next) => {
  try {
    // Check MySQL
    await mysqlPool.query('SELECT 1');
    
    // Check Redis
    await redisClient.ping();

    res.status(200).json({ status: 'ok', message: 'All systems operational' });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', message: 'Service Unavailable' });
  }
});

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  if (config.env === 'development') {
    logger.error(`[${code}] ${message}`, { stack: err.stack });
  } else if (statusCode >= 500) {
    logger.error(`[${code}] ${message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    error: {
      message,
      code,
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
});

// Connect DBs and start server
const startServer = async () => {
  try {
    // Attempt connecting to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Initialise Socket.io with JWT auth + arena handlers
    initSocket(io);

    // Pass io reference to matchmakingService so findMatch can emit socket events
    matchmakingService.setIo(io);

    // Start matchmaking loop — runs every 3 seconds after Redis is confirmed ready
    const MATCH_INTERVAL_MS = 3000;
    setInterval(matchmakingService.findMatch, MATCH_INTERVAL_MS);
    logger.info(`Matchmaking loop started (interval: ${MATCH_INTERVAL_MS}ms)`);

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
