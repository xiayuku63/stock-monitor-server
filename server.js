require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per 15 min
  message: { error: '请求过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const syncLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per IP per minute
  message: { error: '同步请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sync', syncLimiter, syncRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Server] Stock Monitor Pro API running on port ${PORT}`);
});
