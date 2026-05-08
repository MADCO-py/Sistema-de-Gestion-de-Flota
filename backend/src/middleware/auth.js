const jwt = require('jsonwebtoken');

// Jerarquía: ADMIN > HOST > PILOT
const ROLE_LEVEL = { ADMIN: 3, HOST: 2, PILOT: 1 };

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// authorize(...roles) — ADMIN siempre pasa si tiene nivel mayor o igual
const authorize = (...roles) => (req, res, next) => {
  // ADMIN tiene acceso a todo excepto rutas exclusivas de PILOT
  if (req.user.role === 'ADMIN' && !roles.includes('PILOT_ONLY')) {
    return next();
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Sin permisos para esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize, ROLE_LEVEL };
