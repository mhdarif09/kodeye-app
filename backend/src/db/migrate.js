const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Dedicated pool with multi-statement support for migrations only
function createMigrationPool() {
  return mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true,
    connectionLimit: 1,
  });
}

async function migrate() {
  const pool = createMigrationPool();
  let connection;
  try {
    logger.info('Connecting to the database for migration...');
    connection = await pool.getConnection();
    
    logger.info('Database connected. Checking migrations table...');

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.info('No migration files found.');
      return;
    }

    const [tables] = await connection.query(`SHOW TABLES LIKE 'migrations'`);
    let executedMigrations = [];

    if (tables.length > 0) {
      const [rows] = await connection.query('SELECT name FROM migrations');
      executedMigrations = rows.map((row) => row.name);
    }

    for (const file of files) {
      if (executedMigrations.includes(file)) {
        logger.info(`Skipping ${file} - already executed.`);
        continue;
      }

      logger.info(`Executing migration: ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute SQL with multi-statement support
      await connection.query(sql);

      // Record migration success (re-check table exists, since 001 creates it)
      const [rows] = await connection.query(`SHOW TABLES LIKE 'migrations'`);
      if (rows.length > 0) {
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
      } else {
        logger.warn(`migrations table does not exist after ${file}, skipping record.`);
      }
      
      logger.info(`Migration ${file} executed successfully.`);
    }

    logger.info('All migrations executed successfully.');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    // Close the migration pool
    await pool.end();
    logger.info('Database connection pool closed.');
  }
}

migrate();
