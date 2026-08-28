import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth';
import {
  dbQuery, useInMemory,
  StoredUserLocation,
  memGetUserLocations,
  memSaveUserLocation,
  memDeleteUserLocation,
  memGetActiveAlerts,
} from '../db/postgres';

export const userRouter = Router();

// All user routes require authentication
userRouter.use(requireAuth);

// ── Saved Locations ────────────────────────────────────────────────────────

// GET /api/user/locations
userRouter.get('/locations', async (req, res) => {
  const userId = req.user!.id;
  try {
    if (useInMemory()) {
      return res.json({ locations: memGetUserLocations(userId) });
    }
    const rows = await dbQuery(
      `SELECT * FROM user_locations WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
    res.json({ locations: rows as StoredUserLocation[] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch locations', message: err.message });
  }
});

// POST /api/user/locations
userRouter.post('/locations', async (req, res) => {
  const userId = req.user!.id;
  const { name, latitude, longitude, is_default = false } = req.body;

  if (!name || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'name, latitude, longitude are required' });
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude must be numbers' });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'latitude/longitude out of range' });
  }

  try {
    const loc: StoredUserLocation = {
      id: randomUUID(),
      user_id: userId,
      name: String(name).slice(0, 100),
      latitude,
      longitude,
      is_default: Boolean(is_default),
      created_at: new Date().toISOString(),
    };

    if (useInMemory()) {
      memSaveUserLocation(loc);
      return res.status(201).json({ location: loc });
    }

    const rows = await dbQuery(
      `INSERT INTO user_locations (id, user_id, name, latitude, longitude, is_default)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [loc.id, userId, loc.name, loc.latitude, loc.longitude, loc.is_default],
    );
    res.status(201).json({ location: rows[0] as StoredUserLocation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save location', message: err.message });
  }
});

// DELETE /api/user/locations/:id
userRouter.delete('/locations/:id', async (req, res) => {
  const userId = req.user!.id;
  const locationId = req.params.id;

  try {
    if (useInMemory()) {
      memDeleteUserLocation(userId, locationId);
      return res.json({ deleted: true });
    }
    await dbQuery(
      `DELETE FROM user_locations WHERE id = $1 AND user_id = $2`,
      [locationId, userId],
    );
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete location', message: err.message });
  }
});

// ── Notifications / Alerts ─────────────────────────────────────────────────

// GET /api/user/notifications
// Returns active alerts for the authenticated user (currently global active alerts;
// in a production system these would be filtered by the user's saved locations).
userRouter.get('/notifications', async (req, res) => {
  const userId = req.user!.id;
  try {
    if (useInMemory()) {
      const alerts = memGetActiveAlerts();
      return res.json({ notifications: alerts, unreadCount: alerts.length });
    }
    const rows = await dbQuery(
      `SELECT ma.*, ua.is_read, ua.read_at
       FROM marine_alerts ma
       LEFT JOIN user_alerts ua ON ma.id = ua.alert_id AND ua.user_id = $1
       WHERE ma.is_active = TRUE
       ORDER BY ma.created_at DESC
       LIMIT 30`,
      [userId],
    );
    const unreadCount = rows.filter(r => !r.is_read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: err.message });
  }
});

// PUT /api/user/notifications/:alertId/read
userRouter.put('/notifications/:alertId/read', async (req, res) => {
  const userId = req.user!.id;
  const alertId = req.params.alertId;
  try {
    if (!useInMemory()) {
      await dbQuery(
        `INSERT INTO user_alerts (id, user_id, alert_id, is_read, read_at)
         VALUES (gen_random_uuid(), $1, $2, TRUE, NOW())
         ON CONFLICT (user_id, alert_id) DO UPDATE SET is_read = TRUE, read_at = NOW()`,
        [userId, alertId],
      );
    }
    res.json({ marked: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark notification read', message: err.message });
  }
});
