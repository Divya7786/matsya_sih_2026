import { Router } from 'express';
import { globalWeatherSafetyAgent } from '../agents/weatherSafetyAgent';
import { globalGeofenceAgent } from '../agents/geofenceAgent';
import { fetchMarineLive } from '../data/openMeteoMarineClient';
import { fetchNceiSst, fetchPifscChlorophyll } from '../data/incoisErddapClient';
import { evaluateAndGenerateAlerts, getActiveAlerts, getAllAlerts } from '../services/alertEngine';
import { memUpsertAlert, useInMemory } from '../db/postgres';

export const publicRouter = Router();

// GET /api/public/dashboard?lat=&lng=
// Returns live marine conditions for a given location. No auth required.
publicRouter.get('/dashboard', async (req, res) => {
  const lat = parseFloat(req.query.lat as string) || 13.0827;
  const lng = parseFloat(req.query.lng as string) || 80.2707;
  const region = (req.query.region as string) || 'Indian Ocean';

  const [weatherResult, marineResult, nceiResult, chlResult] = await Promise.allSettled([
    globalWeatherSafetyAgent.evaluateLive({ lat, lng }),
    fetchMarineLive(lat, lng),
    fetchNceiSst(lat, lng),
    fetchPifscChlorophyll(lat, lng),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const marine = marineResult.status === 'fulfilled' ? marineResult.value : null;
  const ncei = nceiResult.status === 'fulfilled' ? nceiResult.value : null;
  const chl = chlResult.status === 'fulfilled' ? chlResult.value : null;

  const waveHeight = weather?.significantWaveHeightMeters ?? marine?.current?.waveHeight ?? 0;
  const windSpeed = weather?.windSpeedKmh ?? 0;
  const windDirection = weather?.windDirection ?? 'N/A';
  const sst = (ncei?.sst && ncei.sst > 0) ? ncei.sst
    : (marine?.current?.sst && marine.current.sst > 0) ? marine.current.sst : null;
  const chlorophyll = (chl?.chlorophyll && chl.chlorophyll > 0) ? chl.chlorophyll : null;
  const overallRisk = weather?.overallRisk ?? 'UNKNOWN';
  const safetyScore = weather?.safetyScore ?? 100;

  // Fire-and-forget alert generation in the background
  evaluateAndGenerateAlerts(lat, lng, region).catch(() => {});

  const geofence = globalGeofenceAgent.checkLocation({ lat, lng });

  res.json({
    lat,
    lng,
    region,
    waveHeight: waveHeight ? Math.round(waveHeight * 10) / 10 : null,
    windSpeed: windSpeed ? Math.round(windSpeed) : null,
    windDirection,
    swellHeight: weather?.swellHeightMeters ?? null,
    sst: sst ? Math.round(sst * 10) / 10 : null,
    chlorophyll: chlorophyll ? Math.round(chlorophyll * 100) / 100 : null,
    overallRisk,
    safetyScore,
    geofenceStatus: geofence.geofenceStatus,
    nearestZone: geofence.nearestZone.name,
    dataStatus: weather ? (weather.dataStatus ?? 'LIVE') : 'UNAVAILABLE',
    dataSource: weather?.dataSource ?? 'N/A',
    lastUpdated: new Date().toISOString(),
    sstSource: ncei?.dataSource ?? (sst ? 'Open-Meteo' : 'unavailable'),
    chlorophyllSource: chl?.dataSource ?? 'unavailable',
  });
});

// GET /api/public/alerts
// Returns currently active marine alerts. No auth required.
publicRouter.get('/alerts', async (_req, res) => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ alerts, count: alerts.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', message: err.message });
  }
});

// GET /api/public/alerts/history?limit=20
// Returns recent alert history. No auth required.
publicRouter.get('/alerts/history', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  try {
    const alerts = await getAllAlerts(limit);
    res.json({ alerts, count: alerts.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alert history', message: err.message });
  }
});

// POST /api/public/alerts/evaluate?lat=&lng=&region=
// Triggers a live alert evaluation for a given location. No auth required (rate-limited by design).
publicRouter.post('/alerts/evaluate', async (req, res) => {
  const lat = parseFloat(req.body.lat) || 13.0827;
  const lng = parseFloat(req.body.lng) || 80.2707;
  const region = (req.body.region as string) || 'Chennai / Coromandel Coast';
  try {
    const alerts = await evaluateAndGenerateAlerts(lat, lng, region);
    res.json({ evaluated: true, alertsGenerated: alerts.length, alerts });
  } catch (err: any) {
    res.status(500).json({ error: 'Alert evaluation failed', message: err.message });
  }
});

// POST /api/public/demo/inject-alerts
// DEV / DEMO ONLY — blocked in production.
// Injects realistic high-severity alerts into the in-memory store so judges can
// see the full alert UI without waiting for an actual storm.
// Usage: POST /api/public/demo/inject-alerts   (no body needed)
// Reset: POST /api/public/demo/inject-alerts   with body { clear: true }
publicRouter.post('/demo/inject-alerts', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Demo endpoint not available in production' });
  }
  if (!useInMemory()) {
    return res.status(400).json({ error: 'Demo injection only works in in-memory mode (DATABASE_URL not set)' });
  }

  const now = new Date().toISOString();
  const base = { latitude: 13.0827, longitude: 80.2707, sst: 29.5, source: 'DEMO — MATSYA AI Alert Engine', is_active: true, expires_at: null };

  const demoAlerts = [
    {
      ...base,
      alert_type: 'WAVE_DANGER',
      severity: 'VERY_HIGH',
      title: 'Dangerous Wave Conditions — Bay of Bengal',
      message: 'Wave height 4.2 m — Cyclonic swell approaching Tamil Nadu coast. All vessels must return to port immediately. IMD bulletin issued.',
      region: 'Tamil Nadu Coast / Bay of Bengal',
      wave_height: 4.2,
      wind_speed: 65,
      dedup_key: 'DEMO:WAVE_DANGER:TN:VERY_HIGH',
    },
    {
      ...base,
      alert_type: 'WIND_WARNING',
      severity: 'HIGH',
      title: 'Gale-Force Wind Warning — Coromandel Coast',
      message: 'Wind speed 67 km/h — Gale-force conditions along the Coromandel Coast. Do not put to sea. Fishermen advised to stay ashore for next 48 hours.',
      region: 'Coromandel Coast',
      wave_height: 3.8,
      wind_speed: 67,
      dedup_key: 'DEMO:WIND_WARNING:COROMANDEL:HIGH',
    },
    {
      ...base,
      latitude: 8.0883,
      longitude: 77.5385,
      alert_type: 'WAVE_WARNING',
      severity: 'HIGH',
      title: 'High Wave Warning — Kanyakumari Coast',
      message: 'Wave height 2.8 m — Small craft advisory. Exercise extreme caution. Mandapam–Rameswaram corridor affected.',
      region: 'Kanyakumari / Gulf of Mannar',
      wave_height: 2.8,
      wind_speed: 42,
      dedup_key: 'DEMO:WAVE_WARNING:KK:HIGH',
    },
  ];

  const injected = demoAlerts.map(a => memUpsertAlert(a));
  console.log(`[DEMO] Injected ${injected.length} demo alerts into in-memory store`);
  res.json({ injected: injected.length, alerts: injected, note: 'Demo alerts active. Call GET /api/public/alerts to verify.' });
});
