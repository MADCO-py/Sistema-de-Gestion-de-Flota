const bcrypt = require('bcrypt');
const pool = require('../db');
const { log } = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, email, dpi, phone, role, is_active, created_at FROM users ORDER BY role, full_name'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener usuarios' }); }
};

const getUserById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, email, dpi, phone, role, is_active, created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al obtener usuario' }); }
};

const createUser = async (req, res) => {
  const { username, password, full_name, email, dpi, phone, role } = req.body;
  if (!username || !password || !full_name || !role)
    return res.status(400).json({ error: 'Campos requeridos: username, password, full_name, role' });
  const allowedRoles = req.user.role === 'HOST' ? ['HOST', 'ADMIN', 'PILOT'] : ['PILOT'];
  if (!allowedRoles.includes(role))
    return res.status(403).json({ error: 'No puedes crear usuarios con ese rol' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, dpi, phone, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, full_name, email, dpi, phone, role`,
      [username, hash, full_name, email||null, dpi||null, phone||null, role]
    );
    await log(req.user.id, 'CREATE_USER', 'users', rows[0].id, { role }, req.ip);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username o DPI ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const updateUser = async (req, res) => {
  const { full_name, email, dpi, phone, is_active, password } = req.body;
  const { id } = req.params;
  try {
    const fields = []; const values = []; let i = 1;
    if (full_name) { fields.push(`full_name=$${i++}`); values.push(full_name); }
    if (email !== undefined) { fields.push(`email=$${i++}`); values.push(email); }
    if (dpi !== undefined) { fields.push(`dpi=$${i++}`); values.push(dpi); }
    if (phone !== undefined) { fields.push(`phone=$${i++}`); values.push(phone); }
    if (is_active !== undefined) { fields.push(`is_active=$${i++}`); values.push(is_active); }
    if (password) { const hash = await bcrypt.hash(password, 10); fields.push(`password_hash=$${i++}`); values.push(hash); }
    if (!fields.length) return res.status(400).json({ error: 'Sin datos para actualizar' });
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${i} RETURNING id, username, full_name, email, dpi, phone, role, is_active`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    await log(req.user.id, 'UPDATE_USER', 'users', id, req.body, req.ip);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al actualizar usuario' }); }
};

const deleteUser = async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active=false WHERE id=$1', [req.params.id]);
    await log(req.user.id, 'DELETE_USER', 'users', req.params.id, null, req.ip);
    res.json({ message: 'Usuario desactivado' });
  } catch (err) { res.status(500).json({ error: 'Error al eliminar usuario' }); }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
