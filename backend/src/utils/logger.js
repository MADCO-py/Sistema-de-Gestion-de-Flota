const pool = require('../db');

const log = async (userId, action, entity = null, entityId = null, details = null, ip = null) => {
  try {
    await pool.query(
      `INSERT INTO system_logs (user_id, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entity, entityId, details ? JSON.stringify(details) : null, ip]
    );
  } catch (err) {
    console.error('Log error:', err.message);
  }
};

module.exports = { log };
