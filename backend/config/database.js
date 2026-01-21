/**
 * PostgreSQL database connection configuration
 * Supports both local PostgreSQL and Neon DB (cloud PostgreSQL)
 */
const { Pool } = require('pg');
require('dotenv').config();

let pool;

// Check if DATABASE_URL is provided (Neon DB or other cloud providers)
if (process.env.DATABASE_URL) {
  // Use connection string (Neon DB, Heroku Postgres, etc.)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('neon.tech') 
      ? { rejectUnauthorized: false } 
      : undefined
  });
} else {
  // Use individual connection parameters (local PostgreSQL)
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_attendance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
}

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;

