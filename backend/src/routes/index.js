const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const users = require('../controllers/usersController');
const vehicles = require('../controllers/vehiclesController');
const usage = require('../controllers/usageController');
const alerts = require('../controllers/alertsController');
const reports = require('../controllers/reportsController');

// Auth
router.post('/auth/login', auth.login);
router.post('/auth/verify-admin', authenticate, authorize('HOST'), auth.verifyAdminPassword);

// Users
router.get('/users', authenticate, authorize('HOST', 'ADMIN'), users.getUsers);
router.get('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.getUserById);
router.post('/users', authenticate, authorize('HOST', 'ADMIN'), users.createUser);
router.put('/users/:id', authenticate, authorize('HOST', 'ADMIN'), users.updateUser);
router.delete('/users/:id', authenticate, authorize('HOST'), users.deleteUser);

// Vehicles
router.get('/vehicles', authenticate, vehicles.getVehicles);
router.get('/vehicles/:id', authenticate, vehicles.getVehicleById);
router.post('/vehicles', authenticate, authorize('HOST'), vehicles.createVehicle);
router.put('/vehicles/:id', authenticate, authorize('HOST'), vehicles.updateVehicle);
router.delete('/vehicles/:id', authenticate, authorize('HOST'), vehicles.deleteVehicle);

// Usage
router.post('/usage/checkin', authenticate, authorize('PILOT'), usage.checkIn);
router.post('/usage/checkout', authenticate, authorize('PILOT', 'ADMIN', 'HOST'), usage.checkOut);
router.get('/usage/history', authenticate, usage.getUsageHistory);
router.get('/usage/active', authenticate, authorize('HOST', 'ADMIN'), usage.getActiveUsages);
router.get('/usage/my-active', authenticate, authorize('PILOT'), usage.getMyActiveUsage);

// Alerts
router.get('/alerts', authenticate, alerts.getAlerts);
router.get('/alerts/unread-count', authenticate, alerts.getUnreadCount);
router.put('/alerts/:id/read', authenticate, alerts.markRead);
router.put('/alerts/mark-all-read', authenticate, alerts.markAllRead);

// Reports & Dashboard
router.get('/reports/dashboard', authenticate, reports.getDashboardStats);
router.get('/reports/logs', authenticate, authorize('HOST'), reports.getLogs);
router.get('/reports/export', authenticate, authorize('HOST', 'ADMIN'), reports.exportReport);

module.exports = router;
