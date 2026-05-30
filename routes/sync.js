const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/sync - Pull all data
router.get('/', auth, async (req, res) => {
  try {
    const wlResult = await db.query('SELECT symbol, name, market, added_at FROM watchlist WHERE user_id = $1', [req.userId]);
    const rmResult = await db.query('SELECT reminder_id as id, symbol, name, market, type, value, dir, triggered, created_at FROM reminders WHERE user_id = $1', [req.userId]);
    const stResult = await db.query('SELECT data FROM settings WHERE user_id = $1', [req.userId]);

    const settings = stResult.rows.length > 0 ? JSON.parse(stResult.rows[0].data) : {};

    res.json({
      watchlist: wlResult.rows,
      reminders: rmResult.rows,
      settings
    });
  } catch (e) {
    console.error('Sync pull error:', e);
    res.status(500).json({ error: '同步失败' });
  }
});

// POST /api/sync - Push all data
router.post('/', auth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { watchlist, reminders, settings } = req.body;

    await client.query('BEGIN');

    // Replace watchlist
    if (Array.isArray(watchlist)) {
      await client.query('DELETE FROM watchlist WHERE user_id = $1', [req.userId]);
      for (const s of watchlist) {
        await client.query(
          'INSERT INTO watchlist (user_id, symbol, name, market, added_at) VALUES ($1, $2, $3, $4, $5)',
          [req.userId, s.symbol, s.name || '', s.market, s.addedAt || Date.now()]
        );
      }
    }

    // Replace reminders
    if (Array.isArray(reminders)) {
      await client.query('DELETE FROM reminders WHERE user_id = $1', [req.userId]);
      for (const r of reminders) {
        await client.query(
          'INSERT INTO reminders (user_id, reminder_id, symbol, name, market, type, value, dir, triggered, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [req.userId, r.id, r.symbol, r.name || '', r.market, r.type, r.value, r.dir || null, r.triggered ? 1 : 0, r.createdAt || Date.now()]
        );
      }
    }

    // Replace settings
    if (settings && typeof settings === 'object') {
      await client.query(
        'INSERT INTO settings (user_id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()',
        [req.userId, JSON.stringify(settings)]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: '同步完成' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Sync push error:', e);
    res.status(500).json({ error: '同步失败' });
  } finally {
    client.release();
  }
});

module.exports = router;
