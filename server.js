require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
var origins = process.env.ALLOWED_ORIGINS || '*';
app.use(cors({ origin: origins === '*' ? true : origins.split(',') }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ name: 'Stock Monitor Pro API', version: '1.0.0', status: 'running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Server] Stock Monitor Pro API running on port ${PORT}`);
});
