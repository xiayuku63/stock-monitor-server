const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
});

// Initialize tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL DEFAULT '',
        password VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS watchlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(50) DEFAULT '',
        market VARCHAR(10) NOT NULL,
        added_at BIGINT,
        UNIQUE(user_id, symbol, market)
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reminder_id VARCHAR(40) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(50) DEFAULT '',
        market VARCHAR(10) NOT NULL,
        type VARCHAR(20) NOT NULL,
        value REAL NOT NULL,
        dir VARCHAR(10),
        triggered INTEGER DEFAULT 0,
        created_at BIGINT
      );

      CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data TEXT NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[DB] Tables initialized');
  } finally {
    client.release();
  }
}

initDB().catch(err => console.error('[DB] Init error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
