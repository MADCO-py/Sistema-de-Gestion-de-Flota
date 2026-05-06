const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'fleetuser',
  password: process.env.DB_PASSWORD || 'fleetpass',
  database: process.env.DB_NAME || 'fleetcontrol',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PG pool error:', err.message);
});

const connectWithRetry = async (retries = 15, delay = 4000) => {
  // Wait 5s initially for Docker DNS to register the 'db' hostname
  await new Promise(r => setTimeout(r, 5000));
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      console.log(`⏳ DB not ready (attempt ${i}/${retries}): ${err.message}`);
      if (i === retries) {
        console.error('❌ Could not connect to database after', retries, 'attempts');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

connectWithRetry();

module.exports = pool;
