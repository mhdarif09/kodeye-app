const userQueries = require('../db/queries/userQueries');
const pool = require('../db/mysql');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const getProfile = async (userId) => {
  const user = await userQueries.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  // Sanitize password_hash
  delete user.password_hash;
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await userQueries.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Map camelCase to snake_case for DB
  const updateData = {};
  if (data.displayName !== undefined) updateData.display_name = data.displayName;
  if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
  if (data.preferredLanguage !== undefined) updateData.preferred_language = data.preferredLanguage;
  if (data.techStacks !== undefined) updateData.tech_stacks = data.techStacks;
  if (data.skillCategories !== undefined) updateData.skill_categories = data.skillCategories;
  if (data.experienceLevel !== undefined) updateData.experience_level = data.experienceLevel;

  const updatedUser = await userQueries.updateProfile(userId, updateData);
  delete updatedUser.password_hash;
  logger.info(`User profile updated: ${userId}`);
  return updatedUser;
};

const completeOnboarding = async (userId, { skillCategories, techStacks, experienceLevel }) => {
  const updateData = {
    skill_categories: skillCategories,
    tech_stacks: techStacks,
    experience_level: experienceLevel,
  };
  
  const updatedUser = await userQueries.updateProfile(userId, updateData);
  delete updatedUser.password_hash;
  logger.info(`User onboarding completed: ${userId}`);
  return updatedUser;
};

const deleteAccount = async (userId) => {
  // Check if there's an active session
  // Status 'waiting' or 'in_progress' are active sessions
  const [rows] = await pool.query(
    `SELECT id FROM sessions WHERE (user_a_id = ? OR user_b_id = ?) AND status IN ('waiting', 'in_progress') LIMIT 1`,
    [userId, userId]
  );

  if (rows.length > 0) {
    throw new AppError('Cannot delete account while having an active session', 400, 'ACTIVE_SESSION_EXISTS');
  }

  await userQueries.deleteUser(userId);
  logger.info(`User account deleted: ${userId}`);
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  deleteAccount,
};
