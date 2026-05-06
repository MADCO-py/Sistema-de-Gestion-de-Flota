const pool = require('../db');

const getAlerts = async (req, res) => {
  try {
    let query, values;
    if (req.user.role === 'PILOT') {
      query = `SELECT a.*, v.plate, v.type FROM alerts a LEFT JOIN vehicles v ON v.id=a.vehicle_id
               WHERE (a.user_id=$1 OR a.user_id IS NULL) AND a.is_read=false ORDER BY a.created_at DESC LIMIT 50`;
      values = [req.user.id];
    } else {
      query = `SELECT a.*, v.plate, v.type, u.full_name as user_name FROM alerts a
               LEFT JOIN vehicles v ON v.id=a.vehicle_id
               LEFT JOIN users u ON u.id=a.user_id
               ORDER BY a.created_at DESC LIMIT 100`;
      values = [];
    }
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM alerts WHERE is_read=false AND (user_id=$1 OR user_id IS NULL)`,
      [req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

const markRead = async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read=true WHERE id=$1', [req.params.id]);
    res.json({ message: 'Alerta marcada como leída' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    if (req.user.role === 'PILOT') {
      await pool.query('UPDATE alerts SET is_read=true WHERE user_id=$1', [req.user.id]);
    } else {
      await pool.query('UPDATE alerts SET is_read=true');
    }
    res.json({ message: 'Alertas marcadas como leídas' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

module.exports = { getAlerts, getUnreadCount, markRead, markAllRead };
