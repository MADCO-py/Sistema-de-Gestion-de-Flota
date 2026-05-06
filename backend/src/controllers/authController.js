const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { log } = require('../utils/logger');

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    await log(user.id, 'LOGIN', 'users', user.id, null, req.ip);
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const verifyAdminPassword = async (req, res) => {
  // HOST double-validation: verify an ADMIN password to reveal sensitive data
  const { admin_username, admin_password } = req.body;
  if (req.user.role !== 'HOST') {
    return res.status(403).json({ error: 'Solo HOST puede hacer esta verificación' });
  }
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND role = 'ADMIN' AND is_active = true",
      [admin_username]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'ADMIN no encontrado' });
    }
    const valid = await bcrypt.compare(admin_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
    await log(req.user.id, 'ADMIN_VERIFY', 'users', rows[0].id, null, req.ip);
    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { login, verifyAdminPassword };
