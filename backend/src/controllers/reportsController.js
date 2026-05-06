const pool = require('../db');

const getDashboardStats = async (req, res) => {
  try {
    const [vehicles, alerts, users] = await Promise.all([
      pool.query("SELECT COUNT(*)::int total, COUNT(*) FILTER(WHERE status='available')::int available, COUNT(*) FILTER(WHERE status='in_use')::int in_use FROM vehicles"),
      pool.query("SELECT COUNT(*)::int FROM alerts WHERE is_read=false"),
      pool.query("SELECT COUNT(*) FILTER(WHERE role='PILOT')::int pilots, COUNT(*) FILTER(WHERE role='ADMIN')::int admins FROM users WHERE is_active=true"),
    ]);
    res.json({
      vehicles: vehicles.rows[0],
      unread_alerts: alerts.rows[0].count,
      users: users.rows[0],
    });
  } catch (err) {
    console.error('getDashboardStats error:', err.message);
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
      [parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error('getLogs error:', err.message);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

const exportReport = async (req, res) => {
  const { date_from, date_to, vehicle_id, pilot_id } = req.query;
  const conditions = []; const values = []; let i = 1;
  if (date_from) { conditions.push(`vu.checkin_at>=$${i++}`); values.push(date_from); }
  if (date_to)   { conditions.push(`vu.checkin_at<=$${i++}`); values.push(date_to); }
  if (vehicle_id){ conditions.push(`vu.vehicle_id=$${i++}`); values.push(vehicle_id); }
  if (pilot_id)  { conditions.push(`vu.pilot_id=$${i++}`); values.push(pilot_id); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT u.full_name as piloto, u.username, COALESCE(u.dpi,'') as dpi, COALESCE(u.phone,'') as telefono,
        v.plate as placa, v.type as tipo,
        vu.route as ruta, vu.km_start as km_inicial, COALESCE(vu.km_end::text,'') as km_final,
        COALESCE((vu.km_end - vu.km_start)::text,'') as km_recorridos,
        vu.checkin_at as entrada, COALESCE(vu.checkout_at::text,'') as salida,
        vu.status, vu.km_suspicious as sospechoso
       FROM vehicle_usage vu
       JOIN users u ON u.id=vu.pilot_id
       JOIN vehicles v ON v.id=vu.vehicle_id
       ${where} ORDER BY vu.checkin_at DESC`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Sin datos para exportar' });
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_flota.csv');
    res.send(csv);
  } catch (err) {
    console.error('exportReport error:', err.message);
    res.status(500).json({ error: 'Error al exportar' });
  }
};

const getVehiclePhotos = async (req, res) => {
  const { vehicle_id } = req.query;
  try {
    const baseSelect = `
      SELECT
        vu.id as usage_id,
        vu.checkin_at,
        vu.checkout_at,
        vu.km_start,
        vu.km_end,
        vu.route,
        vu.status,
        u.full_name as pilot_name,
        COALESCE(u.dpi, '') as pilot_dpi,
        COALESCE(u.phone, '') as pilot_phone,
        v.plate,
        COALESCE(v.brand, '') as brand,
        COALESCE(v.model, '') as model,
        COALESCE(
          json_agg(
            json_build_object(
              'id', up.id,
              'side', up.side,
              'filename', up.filename,
              'created_at', up.created_at
            ) ORDER BY up.side
          ) FILTER (WHERE up.id IS NOT NULL),
          '[]'::json
        ) as photos
      FROM vehicle_usage vu
      JOIN users u ON u.id = vu.pilot_id
      JOIN vehicles v ON v.id = vu.vehicle_id
      LEFT JOIN usage_photos up ON up.usage_id = vu.id
    `;

    let query, params;
    if (vehicle_id) {
      query = `${baseSelect} WHERE vu.vehicle_id = $1 GROUP BY vu.id, u.full_name, u.dpi, u.phone, v.plate, v.brand, v.model ORDER BY vu.checkin_at DESC`;
      params = [vehicle_id];
    } else {
      query = `${baseSelect} GROUP BY vu.id, u.full_name, u.dpi, u.phone, v.plate, v.brand, v.model ORDER BY vu.checkin_at DESC LIMIT 200`;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getVehiclePhotos error:', err.message, err.stack);
    res.status(500).json({ error: 'Error al obtener fotos: ' + err.message });
  }
};

module.exports = { getDashboardStats, getLogs, exportReport, getVehiclePhotos };
