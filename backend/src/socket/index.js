'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');
const userSocketMap = require('./userSocketMap');
const { registerArenaHandler } = require('./arenaHandler');

/**
 * Initialise the Socket.io server:
 *  1. JWT auth middleware on every connection handshake
 *  2. Register per-socket event handlers
 *  3. Keep userSocketMap in sync so matchmakingService can emit to specific users
 */
const initSocket = (io) => {
  // ── Auth middleware ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      logger.warn(`Socket rejected: no token | socketId=${socket.id}`);
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      // Attach user data to socket for use in handlers
      socket.data.userId = decoded.id;
      socket.data.email = decoded.email;
      next();
    } catch (err) {
      logger.warn(`Socket rejected: invalid token | socketId=${socket.id} err=${err.message}`);
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ──────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    // Register userId <-> socketId mapping so matchmakingService.findMatch can emit
    // 'match:found' directly to this user via userSocketMap.getSocketId(userId)
    userSocketMap.set(userId, socket.id);

    // Join a personal room so matchmakingService can do io.to(`user:${userId}`)
    socket.join(`user:${userId}`);

    logger.info(`Socket connected | user=${userId} socketId=${socket.id}`);

    // Register all arena events
    registerArenaHandler(io, socket);

    socket.on('disconnect', () => {
      userSocketMap.removeBySocketId(socket.id);
      logger.info(`Socket disconnected | user=${userId} socketId=${socket.id}`);
      // Note: arena disconnect event is handled inside registerArenaHandler
    });
  });
};

module.exports = { initSocket };
