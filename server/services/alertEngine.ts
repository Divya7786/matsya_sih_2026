import { globalWeatherSafetyAgent } from '../agents/weatherSafetyAgent';
import {
  dbQuery, useInMemory,
  StoredMarineAlert,
  memUpsertAlert,
  memGetActiveAlerts,
  memGetAllAlerts,
} from '../db/postgres';

const WAVE_MODERATE = 1.5;
const WAVE_HIGH = 2.5;
const WAVE_VERY_HIGH = 3.5;
const WIND_MODERATE = 25;
const WIND_HIGH = 40;

type AlertCandidate = Omit<StoredMarineAlert, 'id' | 'created_at'>;

function buildCandidates(
  waveHeight: number,
  windSpeed: number,
  lat: number,
  lng: number,
  region: string,
): AlertCandidate[] {
  const base = { latitude: lat, longitude: lng, region, wave_height: waveHeight, wind_speed: windSpeed, sst: null, source: 'MATSYA AI / Open-Meteo', expires_at: null };
  const alerts: AlertCandidate[] = [];

  if (waveHeight >= WAVE_VERY_HIGH) {
    alerts.push({ ...base, alert_type: 'WAVE_DANGER', severity: 'VERY_HIGH', is_active: true,
      title: 'Dangerous Wave Conditions',
      message: `Wave height ${waveHeight.toFixed(1)} m — extremely hazardous for all marine activity. Vessels must return to port immediately.`,
      dedup_key: `WAVE_DANGER:${region}:VERY_HIGH` });
  } else if (waveHeight >= WAVE_HIGH) {
    alerts.push({ ...base, alert_type: 'WAVE_WARNING', severity: 'HIGH', is_active: true,
      title: 'High Wave Warning',
      message: `Wave height ${waveHeight.toFixed(1)} m — small craft advisory in effect. Exercise extreme caution at sea.`,
      dedup_key: `WAVE_WARNING:${region}:HIGH` });
  } else if (waveHeight >= WAVE_MODERATE) {
    alerts.push({ ...base, alert_type: 'WAVE_CAUTION', severity: 'MODERATE', is_active: true,
      title: 'Moderate Wave Conditions',
      message: `Wave height ${waveHeight.toFixed(1)} m — caution advised for small fishing vessels and coastal activities.`,
      dedup_key: `WAVE_CAUTION:${region}:MODERATE` });
  }

  if (windSpeed >= WIND_HIGH) {
    alerts.push({ ...base, alert_type: 'WIND_WARNING', severity: 'HIGH', is_active: true,
      title: 'Strong Wind Warning',
      message: `Wind speed ${windSpeed.toFixed(0)} km/h — gale-force conditions. Do not put to sea.`,
      dedup_key: `WIND_WARNING:${region}:HIGH` });
  } else if (windSpeed >= WIND_MODERATE) {
    alerts.push({ ...base, alert_type: 'WIND_ADVISORY', severity: 'MODERATE', is_active: true,
      title: 'Wind Advisory',
      message: `Wind speed ${windSpeed.toFixed(0)} km/h — moderate winds. Small vessel operators exercise caution.`,
      dedup_key: `WIND_ADVISORY:${region}:MODERATE` });
  }

  return alerts;
}

async function upsertAlertDb(candidate: AlertCandidate): Promise<StoredMarineAlert | null> {
  try {
    const rows = await dbQuery(
      `INSERT INTO marine_alerts
         (id, alert_type, severity, title, message, latitude, longitude, region,
          wave_height, wind_speed, sst, source, is_active, dedup_key, expires_at)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (dedup_key) DO UPDATE SET
         severity    = EXCLUDED.severity,
         title       = EXCLUDED.title,
         message     = EXCLUDED.message,
         wave_height = EXCLUDED.wave_height,
         wind_speed  = EXCLUDED.wind_speed,
         is_active   = TRUE
       RETURNING *`,
      [
        candidate.alert_type, candidate.severity, candidate.title, candidate.message,
        candidate.latitude, candidate.longitude, candidate.region,
        candidate.wave_height, candidate.wind_speed, candidate.sst,
        candidate.source, candidate.is_active, candidate.dedup_key, candidate.expires_at,
      ],
    );
    return (rows[0] as StoredMarineAlert) ?? null;
  } catch (err: any) {
    console.error('[AlertEngine] DB upsert failed:', err.message);
    return null;
  }
}

export async function evaluateAndGenerateAlerts(
  lat: number,
  lng: number,
  region: string,
): Promise<StoredMarineAlert[]> {
  try {
    const weather = await globalWeatherSafetyAgent.evaluateLive({ lat, lng });
    const waveHeight = weather.significantWaveHeightMeters ?? 0;
    const windSpeed = weather.windSpeedKmh ?? 0;

    const candidates = buildCandidates(waveHeight, windSpeed, lat, lng, region);
    const results: StoredMarineAlert[] = [];

    for (const c of candidates) {
      const stored = useInMemory()
        ? memUpsertAlert(c)
        : await upsertAlertDb(c);
      if (stored) results.push(stored);
    }
    return results;
  } catch (err: any) {
    console.error('[AlertEngine] Evaluation failed:', err.message);
    return [];
  }
}

export async function getActiveAlerts(): Promise<StoredMarineAlert[]> {
  if (useInMemory()) return memGetActiveAlerts();
  try {
    return (await dbQuery(
      `SELECT * FROM marine_alerts WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 50`,
    )) as StoredMarineAlert[];
  } catch { return []; }
}

export async function getAllAlerts(limit = 30): Promise<StoredMarineAlert[]> {
  if (useInMemory()) return memGetAllAlerts(limit);
  try {
    return (await dbQuery(
      `SELECT * FROM marine_alerts ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )) as StoredMarineAlert[];
  } catch { return []; }
}
