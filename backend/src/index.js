require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// Global error handler — logs full error details
app.use((err, req, res, _next) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('Route:', req.method, req.path);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FleetControl API running on port ${PORT}`);
});
