const pool = require('../db');

const getDashboardStats = async (req, res) => {
  try {
    const [vehicles, activeUsages, alerts, users] = await Promise.all([
      pool.query("SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='available') available, COUNT(*) FILTER(WHERE status='in_use') in_use FROM vehicles"),
      pool.query("SELECT COUNT(*) FROM vehicle_usage WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM alerts WHERE is_read=false"),
      pool.query("SELECT COUNT(*) FILTER(WHERE role='PILOT') pilots, COUNT(*) FILTER(WHERE role='ADMIN') admins FROM users WHERE is_active=true"),
    ]);
    res.json({
      vehicles: vehicles.rows[0],
      active_usages: parseInt(activeUsages.rows[0].count),
      unread_alerts: parseInt(alerts.rows[0].count),
      users: users.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

const getLogs = async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT sl.*, u.username, u.full_name FROM system_logs sl
       LEFT JOIN users u ON u.id=sl.user_id
       ORDER BY sl.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

const exportReport = async (req, res) => {
  const { date_from, date_to, vehicle_id, pilot_id } = req.query;
  const conditions = [];
  const values = [];
  let i = 1;
  if (date_from) { conditions.push(`vu.checkin_at>=$${i++}`); values.push(date_from); }
  if (date_to) { conditions.push(`vu.checkin_at<=$${i++}`); values.push(date_to); }
  if (vehicle_id) { conditions.push(`vu.vehicle_id=$${i++}`); values.push(vehicle_id); }
  if (pilot_id) { conditions.push(`vu.pilot_id=$${i++}`); values.push(pilot_id); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT u.full_name as piloto, u.username, v.plate as placa, v.type as tipo,
        vu.route as ruta, vu.km_start as km_inicial, vu.km_end as km_final,
        (vu.km_end - vu.km_start) as km_recorridos,
        vu.checkin_at as entrada, vu.checkout_at as salida, vu.status, vu.km_suspicious as sospechoso
       FROM vehicle_usage vu
       JOIN users u ON u.id=vu.pilot_id
       JOIN vehicles v ON v.id=vu.vehicle_id
       ${where}
       ORDER BY vu.checkin_at DESC`,
      values
    );
    // Build CSV
    if (!rows.length) return res.status(404).json({ error: 'Sin datos para exportar' });
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_flota.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar' });
  }
};

module.exports = { getDashboardStats, getLogs, exportReport };
