const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/sync - Pull all data
router.get('/', auth, (req, res) => {
  try {
    const watchlist = db.prepare('SELECT symbol, name, market, added_at FROM watchlist WHERE user_id = ?').all(req.userId);
    const reminders = db.prepare('SELECT reminder_id as id, symbol, name, market, type, value, dir, triggered, created_at FROM reminders WHERE user_id = ?').all(req.userId);
    const row = db.prepare('SELECT data FROM settings WHERE user_id = ?').get(req.userId);
    const settings = row ? JSON.parse(row.data) : {};

    res.json({ watchlist, reminders, settings });
  } catch (e) {
    console.error('Sync pull error:', e);
    res.status(500).json({ error: '同步失败' });
  }
});

// POST /api/sync - Push all data
router.post('/', auth, (req, res) => {
  try {
    const { watchlist, reminders, settings } = req.body;
    const insertWL = db.prepare('INSERT OR REPLACE INTO watchlist (user_id, symbol, name, market, added_at) VALUES (?, ?, ?, ?, ?)');
    const insertRM = db.prepare('INSERT OR REPLACE INTO reminders (user_id, reminder_id, symbol, name, market, type, value, dir, triggered, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const deleteWL = db.prepare('DELETE FROM watchlist WHERE user_id = ?');
    const deleteRM = db.prepare('DELETE FROM reminders WHERE user_id = ?');

    const transaction = db.transaction(() => {
      // Replace watchlist
      if (Array.isArray(watchlist)) {
        deleteWL.run(req.userId);
        for (const s of watchlist) {
          insertWL.run(req.userId, s.symbol, s.name || '', s.market, s.addedAt || Date.now());
        }
      }

      // Replace reminders
      if (Array.isArray(reminders)) {
        deleteRM.run(req.userId);
        for (const r of reminders) {
          insertRM.run(req.userId, r.id, r.symbol, r.name || '', r.market, r.type, r.value, r.dir || null, r.triggered ? 1 : 0, r.createdAt || Date.now());
        }
      }

      // Replace settings
      if (settings && typeof settings === 'object') {
        db.prepare('INSERT OR REPLACE INTO settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(req.userId, JSON.stringify(settings));
      }
    });

    transaction();

    res.json({ success: true, message: '同步完成' });
  } catch (e) {
    console.error('Sync push error:', e);
    res.status(500).json({ error: '同步失败' });
  }
});

module.exports = router;
