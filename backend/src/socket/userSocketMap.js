'use strict';

/**
 * In-memory userId <-> socketId bi-directional map.
 *
 * TODO (multi-instance scale): When running behind a load balancer with multiple
 * Node.js instances, this in-memory map breaks — socket A and socket B may live
 * on different instances. Replace with a Redis Pub/Sub pattern:
 *   - On connect: HSET socket_map:{userId} socketId <socketId> instanceId <instanceId>
 *   - On emit to user: publish to channel "user:{userId}", all instances receive,
 *     only the one owning the socketId actually emits.
 *   - Use socket.io-redis adapter (https://socket.io/docs/v4/redis-adapter/) to
 *     make room broadcasts work across instances automatically.
 */

/** @type {Map<string, string>}  userId -> socketId */
const userToSocket = new Map();

/** @type {Map<string, string>}  socketId -> userId */
const socketToUser = new Map();

const set = (userId, socketId) => {
  userToSocket.set(userId, socketId);
  socketToUser.set(socketId, userId);
};

const removeBySocketId = (socketId) => {
  const userId = socketToUser.get(socketId);
  if (userId) userToSocket.delete(userId);
  socketToUser.delete(socketId);
};

const getSocketId = (userId) => userToSocket.get(userId);

const getUserId = (socketId) => socketToUser.get(socketId);

module.exports = { set, removeBySocketId, getSocketId, getUserId };
