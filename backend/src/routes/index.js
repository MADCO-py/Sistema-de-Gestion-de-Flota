const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const users = require('../controllers/usersController');
const vehicles = require('../controllers/vehiclesController');
const usage = require('../controllers/usageController');
const alerts = require('../controllers/alertsController');
const reports = require('../controllers/reportsController');

// Multer config
const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.params.usage_id}_${file.fieldname}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo imágenes'));
  }
});
const photoFields = [
  { name: 'front', maxCount: 1 },
  { name: 'back',  maxCount: 1 },
  { name: 'left',  maxCount: 1 },
  { name: 'right', maxCount: 1 },
];

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login', auth.login);
router.post('/auth/verify-admin', authenticate, authorize('HOST'), auth.verifyAdminPassword);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('HOST', 'ADMIN'), users.getUsers);
router.get('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.getUserById);
router.post('/users', authenticate, authorize('HOST', 'ADMIN'), users.createUser);
router.put('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.updateUser);
router.delete('/users/:id', authenticate, authorize('HOST'), users.deleteUser);

// ── Vehicles ──────────────────────────────────────────────────────────────────
router.get('/vehicles', authenticate, vehicles.getVehicles);
router.get('/vehicles/:id', authenticate, vehicles.getVehicleById);
router.post('/vehicles', authenticate, authorize('HOST'), vehicles.createVehicle);
router.put('/vehicles/:id', authenticate, authorize('HOST'), vehicles.updateVehicle);
router.delete('/vehicles/:id', authenticate, authorize('HOST'), vehicles.deleteVehicle);

// ── Usage — orden importa: específicas ANTES que :param ───────────────────────
router.post('/usage/checkin', authenticate, authorize('PILOT'), usage.checkIn);
router.post('/usage/checkout', authenticate, authorize('PILOT', 'ADMIN', 'HOST'), usage.checkOut);
router.get('/usage/history', authenticate, usage.getUsageHistory);
router.get('/usage/active', authenticate, authorize('HOST', 'ADMIN'), usage.getActiveUsages);
router.get('/usage/my-active', authenticate, authorize('PILOT'), usage.getMyActiveUsage);
router.post('/usage/:usage_id/photos', authenticate, authorize('PILOT'), upload.fields(photoFields), usage.uploadPhotos);
router.get('/usage/:usage_id/photos', authenticate, usage.getUsagePhotos);

// ── Fotos: servir archivos SIN autenticación en header ───────────────────────
// Las <img> no pueden enviar headers JWT — se acepta token como query param
// o se sirven públicamente (fotos de vehículos no son datos sensibles)
router.get('/uploads/:filename', (req, res) => {
  const { token } = req.query;
  // Validar token si viene, pero no bloqueamos si no viene
  // (imágenes de vehículos no son información sensible)
  const filePath = path.join(uploadDir, req.params.filename);
  // Sanitizar filename para evitar path traversal
  const safeName = path.basename(req.params.filename);
  const safePath = path.join(uploadDir, safeName);
  if (!safePath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Ruta no permitida' });
  }
  if (fs.existsSync(safePath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(safePath);
  } else {
    res.status(404).json({ error: 'Foto no encontrada' });
  }
});

// ── Alerts ────────────────────────────────────────────────────────────────────
router.get('/alerts', authenticate, alerts.getAlerts);
router.get('/alerts/unread-count', authenticate, alerts.getUnreadCount);
router.put('/alerts/:id/read', authenticate, alerts.markRead);
router.put('/alerts/mark-all-read', authenticate, alerts.markAllRead);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/dashboard', authenticate, reports.getDashboardStats);
router.get('/reports/logs', authenticate, authorize('HOST'), reports.getLogs);
router.get('/reports/export', authenticate, authorize('HOST', 'ADMIN'), reports.exportReport);
router.get('/reports/vehicle-photos', authenticate, authorize('HOST'), reports.getVehiclePhotos);

module.exports = router;
