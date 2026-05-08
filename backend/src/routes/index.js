const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const users = require('../controllers/usersController');
const vehicles = require('../controllers/vehiclesController');
const usage = require('../controllers/usageController');
const alerts = require('../controllers/alertsController');
const reports = require('../controllers/reportsController');
const { streamFromR2 } = require('../utils/r2');

// Multer — guarda temporalmente en /tmp antes de subir a R2
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo imágenes'));
  }
});
const photoFields = [
  { name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 },
  { name: 'left',  maxCount: 1 }, { name: 'right', maxCount: 1 },
];

// ── Auth
router.post('/auth/login', auth.login);
router.post('/auth/verify-admin', authenticate, authorize('HOST'), auth.verifyAdminPassword);

// ── Mi perfil
router.get('/me', authenticate, users.getMyProfile);
router.put('/me', authenticate, users.updateMyProfile);

// ── Users
router.get('/users', authenticate, authorize('HOST', 'ADMIN'), users.getUsers);
router.get('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.getUserById);
router.post('/users', authenticate, authorize('HOST', 'ADMIN'), users.createUser);
router.put('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), users.deleteUser);

// ── Vehicles
router.get('/vehicles', authenticate, vehicles.getVehicles);
router.get('/vehicles/:id', authenticate, vehicles.getVehicleById);
router.post('/vehicles', authenticate, authorize('HOST', 'ADMIN'), vehicles.createVehicle);
router.put('/vehicles/:id', authenticate, authorize('HOST', 'ADMIN'), vehicles.updateVehicle);
router.delete('/vehicles/:id', authenticate, authorize('HOST', 'ADMIN'), vehicles.deleteVehicle);

// ── Usage
router.post('/usage/checkin', authenticate, authorize('PILOT'), usage.checkIn);
router.post('/usage/checkout', authenticate, authorize('PILOT', 'HOST', 'ADMIN'), usage.checkOut);
router.get('/usage/history', authenticate, usage.getUsageHistory);
router.get('/usage/active', authenticate, authorize('HOST', 'ADMIN'), usage.getActiveUsages);
router.get('/usage/my-active', authenticate, authorize('PILOT'), usage.getMyActiveUsage);
router.post('/usage/:usage_id/photos', authenticate, authorize('PILOT'), upload.fields(photoFields), usage.uploadPhotos);
router.get('/usage/:usage_id/photos', authenticate, usage.getUsagePhotos);

// ── Fotos — stream desde R2
router.get('/uploads/:filename', async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    await streamFromR2(safeName, res);
  } catch (err) {
    res.status(404).json({ error: 'Foto no encontrada' });
  }
});

// ── Alerts
router.get('/alerts', authenticate, alerts.getAlerts);
router.get('/alerts/unread-count', authenticate, alerts.getUnreadCount);
router.put('/alerts/:id/read', authenticate, alerts.markRead);
router.put('/alerts/mark-all-read', authenticate, alerts.markAllRead);

// ── Reports
router.get('/reports/dashboard', authenticate, reports.getDashboardStats);
router.get('/reports/logs', authenticate, authorize('HOST', 'ADMIN'), reports.getLogs);
router.get('/reports/export', authenticate, authorize('HOST', 'ADMIN'), reports.exportReport);
router.get('/reports/vehicle-photos', authenticate, authorize('HOST', 'ADMIN'), reports.getVehiclePhotos);

module.exports = router;
