const pool = require('../db');
const { log } = require('../utils/logger');

const getVehicles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, 
        CASE WHEN v.status = 'in_use' THEN
          (SELECT u.full_name FROM vehicle_usage vu JOIN users u ON u.id=vu.pilot_id
           WHERE vu.vehicle_id=v.id AND vu.status='active' LIMIT 1)
        END as current_pilot,
        (v.maintenance_km - v.current_km) as km_to_maintenance
       FROM vehicles v ORDER BY v.plate`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vehículo' });
  }
};

const createVehicle = async (req, res) => {
  const { plate, type, brand, model, year, current_km, maintenance_km, notes } = req.body;
  if (!plate || !type) return res.status(400).json({ error: 'Placa y tipo son requeridos' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO vehicles (plate, type, brand, model, year, current_km, maintenance_km, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [plate.toUpperCase(), type, brand, model, year, current_km || 0, maintenance_km || 5000, notes]
    );
    await log(req.user.id, 'CREATE_VEHICLE', 'vehicles', rows[0].id, { plate }, req.ip);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Placa ya registrada' });
    res.status(500).json({ error: 'Error al crear vehículo' });
  }
};

const updateVehicle = async (req, res) => {
  const { plate, type, brand, model, year, maintenance_km, status, notes } = req.body;
  const { id } = req.params;
  try {
    const fields = []; const values = []; let i = 1;
    if (plate) { fields.push(`plate=$${i++}`); values.push(plate.toUpperCase()); }
    if (type) { fields.push(`type=$${i++}`); values.push(type); }
    if (brand !== undefined) { fields.push(`brand=$${i++}`); values.push(brand); }
    if (model !== undefined) { fields.push(`model=$${i++}`); values.push(model); }
    if (year !== undefined) { fields.push(`year=$${i++}`); values.push(year); }
    if (maintenance_km !== undefined) { fields.push(`maintenance_km=$${i++}`); values.push(maintenance_km); }
    if (status) { fields.push(`status=$${i++}`); values.push(status); }
    if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(notes); }
    if (!fields.length) return res.status(400).json({ error: 'Sin datos para actualizar' });
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE vehicles SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, values
    );
    if (!rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    await log(req.user.id, 'UPDATE_VEHICLE', 'vehicles', id, req.body, req.ip);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT status FROM vehicles WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    if (rows[0].status === 'in_use') return res.status(409).json({ error: 'No puedes eliminar un vehículo en uso' });
    // Soft delete — marcar como inactivo en lugar de borrar
    await pool.query("UPDATE vehicles SET status='maintenance', notes=CONCAT(COALESCE(notes,''), ' [ELIMINADO]') WHERE id=$1", [req.params.id]);
    await log(req.user.id, 'DELETE_VEHICLE', 'vehicles', req.params.id, null, req.ip);
    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    console.error('deleteVehicle error:', err.message);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
