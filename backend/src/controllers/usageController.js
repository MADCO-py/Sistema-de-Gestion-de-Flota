const pool = require('../db');
const { log } = require('../utils/logger');

const SUSPICIOUS_KM_THRESHOLD = 500;

const checkIn = async (req, res) => {
  const { vehicle_id, km_start, route } = req.body;
  const pilot_id = req.user.id;
  if (!vehicle_id || km_start === undefined || !route) {
    return res.status(400).json({ error: 'vehicle_id, km_start y route son requeridos' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check pilot has no active usage
    const activeUsage = await client.query(
      "SELECT id FROM vehicle_usage WHERE pilot_id=$1 AND status='active'", [pilot_id]
    );
    if (activeUsage.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ya tienes un vehículo activo. Haz check-out primero.' });
    }
    // Check vehicle availability
    const vehicle = await client.query(
      "SELECT * FROM vehicles WHERE id=$1 FOR UPDATE", [vehicle_id]
    );
    if (!vehicle.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    const v = vehicle.rows[0];
    if (v.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El vehículo no está disponible' });
    }
    if (km_start < v.current_km) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `El km inicial no puede ser menor al actual (${v.current_km} km)` });
    }
    // Create usage record
    const { rows } = await client.query(
      `INSERT INTO vehicle_usage (vehicle_id, pilot_id, route, km_start)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [vehicle_id, pilot_id, route, km_start]
    );
    // Update vehicle status
    await client.query(
      "UPDATE vehicles SET status='in_use', current_km=$1 WHERE id=$2",
      [km_start, vehicle_id]
    );
    await client.query('COMMIT');
    await log(pilot_id, 'CHECKIN', 'vehicle_usage', rows[0].id, { vehicle_id, km_start, route }, req.ip);
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error en check-in' });
  } finally {
    client.release();
  }
};

const checkOut = async (req, res) => {
  const { usage_id, km_end } = req.body;
  const pilot_id = req.user.id;
  if (!usage_id || km_end === undefined) {
    return res.status(400).json({ error: 'usage_id y km_end son requeridos' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const usageRes = await client.query(
      "SELECT vu.*, v.maintenance_km, v.plate FROM vehicle_usage vu JOIN vehicles v ON v.id=vu.vehicle_id WHERE vu.id=$1 AND vu.status='active' FOR UPDATE",
      [usage_id]
    );
    if (!usageRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Uso activo no encontrado' });
    }
    const usage = usageRes.rows[0];
    // Role check: pilot can only checkout their own; host/admin can checkout any
    if (req.user.role === 'PILOT' && usage.pilot_id !== pilot_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No puedes hacer checkout de este vehículo' });
    }
    if (km_end <= usage.km_start) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `El km final (${km_end}) debe ser mayor al inicial (${usage.km_start})` });
    }
    const kmDiff = km_end - usage.km_start;
    const suspicious = kmDiff > SUSPICIOUS_KM_THRESHOLD;
    // Update usage
    const { rows } = await client.query(
      `UPDATE vehicle_usage SET km_end=$1, checkout_at=NOW(), status='closed', km_suspicious=$2
       WHERE id=$3 RETURNING *`,
      [km_end, suspicious, usage_id]
    );
    // Update vehicle
    await client.query(
      "UPDATE vehicles SET status='available', current_km=$1 WHERE id=$2",
      [km_end, usage.vehicle_id]
    );
    await client.query('COMMIT');
    // Check maintenance alert
    const vehicleRes = await pool.query('SELECT * FROM vehicles WHERE id=$1', [usage.vehicle_id]);
    const veh = vehicleRes.rows[0];
    const kmToMaint = veh.maintenance_km - veh.current_km;
    if (kmToMaint <= 500 && kmToMaint >= 0) {
      await pool.query(
        `INSERT INTO alerts (vehicle_id, type, message) VALUES ($1,'maintenance',$2)`,
        [veh.id, `Vehículo ${veh.plate}: faltan ${kmToMaint} km para mantenimiento`]
      );
    } else if (kmToMaint < 0) {
      await pool.query(
        `INSERT INTO alerts (vehicle_id, type, message) VALUES ($1,'maintenance',$2)`,
        [veh.id, `Vehículo ${veh.plate}: kilometraje de mantenimiento superado por ${Math.abs(kmToMaint)} km`]
      );
    }
    if (suspicious) {
      await pool.query(
        `INSERT INTO alerts (user_id, vehicle_id, usage_id, type, message) VALUES ($1,$2,$3,'suspicious_km',$4)`,
        [usage.pilot_id, usage.vehicle_id, usage_id, `Kilometraje sospechoso en ${veh.plate}: +${kmDiff} km en un solo uso`]
      );
    }
    await log(pilot_id, 'CHECKOUT', 'vehicle_usage', usage_id, { km_end, suspicious }, req.ip);
    res.json({ ...rows[0], km_diff: kmDiff, suspicious });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error en check-out' });
  } finally {
    client.release();
  }
};

const getUsageHistory = async (req, res) => {
  const { pilot_id, vehicle_id, date_from, date_to, status } = req.query;
  const conditions = [];
  const values = [];
  let i = 1;
  // Pilots only see their own
  if (req.user.role === 'PILOT') {
    conditions.push(`vu.pilot_id=$${i++}`);
    values.push(req.user.id);
  } else {
    if (pilot_id) { conditions.push(`vu.pilot_id=$${i++}`); values.push(pilot_id); }
  }
  if (vehicle_id) { conditions.push(`vu.vehicle_id=$${i++}`); values.push(vehicle_id); }
  if (date_from) { conditions.push(`vu.checkin_at>=$${i++}`); values.push(date_from); }
  if (date_to) { conditions.push(`vu.checkin_at<=$${i++}`); values.push(date_to); }
  if (status) { conditions.push(`vu.status=$${i++}`); values.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT vu.*, 
        u.full_name as pilot_name, u.username as pilot_username,
        v.plate, v.type, v.brand, v.model,
        (vu.km_end - vu.km_start) as km_traveled
       FROM vehicle_usage vu
       JOIN users u ON u.id=vu.pilot_id
       JOIN vehicles v ON v.id=vu.vehicle_id
       ${where}
       ORDER BY vu.checkin_at DESC
       LIMIT 500`,
      values
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

const getActiveUsages = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT vu.*, u.full_name as pilot_name, v.plate, v.type
       FROM vehicle_usage vu
       JOIN users u ON u.id=vu.pilot_id
       JOIN vehicles v ON v.id=vu.vehicle_id
       WHERE vu.status='active'
       ORDER BY vu.checkin_at`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usos activos' });
  }
};

const getMyActiveUsage = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT vu.*, v.plate, v.type, v.brand, v.model, v.maintenance_km
       FROM vehicle_usage vu
       JOIN vehicles v ON v.id=vu.vehicle_id
       WHERE vu.pilot_id=$1 AND vu.status='active'
       LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
};

module.exports = { checkIn, checkOut, getUsageHistory, getActiveUsages, getMyActiveUsage };
