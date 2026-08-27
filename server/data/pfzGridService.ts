/**
 * MATSYA AI — PFZ Real Spatial Grid Data Service
 *
 * Fetches actual satellite/model data for a spatial grid around a location.
 *
 * SST source:         NCEI ERDDAP — NOAA OISST v2.1 (bbox query, 0.25° grid, 1-day lag)
 * Chlorophyll source: PIFSC ERDDAP — ESA-CCI CHL v6.0 (bbox query, 0.042°, 8-day composite)
 * SST gradient:       Computed from multi-point SST grid (finite differences)
 *
 * Data labeling:
 *   SST     → LIVE (NCEI updated daily) or CACHED REAL DATA (30-min in-process cache)
 *   CHL     → CACHED REAL DATA (8-day composite, labeled with actual observation date)
 *   UNAVAILABLE → when source returns no valid pixels
 */

const NCEI_ERDDAP_BASE   = 'https://www.ncei.noaa.gov/erddap/griddap';
const PIFSC_ERDDAP_BASE  = 'https://oceanwatch.pifsc.noaa.gov/erddap/griddap';
const OPENMETEO_MARINE   = 'https://marine-api.open-meteo.com/v1/marine';
const NCEI_PRELIM_DS     = 'ncdc_oisst_v2_avhrr_prelim_by_time_zlev_lat_lon';
const NCEI_FINAL_DS      = 'ncdc_oisst_v2_avhrr_by_time_zlev_lat_lon';
const PIFSC_CHL_DS       = 'esa-cci-chla-8d-v6-0';

export interface GridPoint {
  lat: number;
  lng: number;
  sst: number;            // °C, NCEI OISST (0 = unavailable)
  sstGradient: number;    // °C / 0.25° grid cell
  chlorophyll: number;    // mg/m³, ESA-CCI (0 = unavailable)
  sstStatus: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  chlStatus: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  sstTimestamp: string;
  chlTimestamp: string;
}

export interface PfzGridResult {
  origin: { lat: number; lng: number };
  radiusKm: number;
  gridPoints: GridPoint[];
  sstSource: string;
  chlSource: string;
  sstStatus: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  chlStatus: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  sstTimestamp: string;
  chlTimestamp: string;
  retrievedAt: string;
}

// ── In-process cache ──────────────────────────────────────────────────────────
interface CacheEntry<T> { data: T; timestamp: number }
const sstCache  = new Map<string, CacheEntry<SstBboxGrid>>();
const chlCache  = new Map<string, CacheEntry<ChlBboxGrid>>();
const SST_TTL   = 30 * 60 * 1000;   // 30 min
const CHL_TTL   = 8 * 60 * 60 * 1000; // 8 hours (composite refresh rate)

function bboxKey(latMin: number, latMax: number, lngMin: number, lngMax: number, tag: string) {
  return `${tag}:${latMin.toFixed(2)}:${latMax.toFixed(2)}:${lngMin.toFixed(2)}:${lngMax.toFixed(2)}`;
}

// ── SST bbox from NCEI ERDDAP ─────────────────────────────────────────────────
interface SstBboxGrid {
  points: { lat: number; lng: number; sst: number }[];
  dataTimestamp: string;
  dataSource: string;
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
}

async function fetchSstBbox(
  latMin: number, latMax: number, lngMin: number, lngMax: number
): Promise<SstBboxGrid> {
  const key = bboxKey(latMin, latMax, lngMin, lngMax, 'sst');
  const hit  = sstCache.get(key);
  if (hit && Date.now() - hit.timestamp < SST_TTL) {
    return { ...hit.data, status: 'CACHED' };
  }

  // Snap to 0.25° grid
  const latLo = (Math.round(latMin * 4) / 4).toFixed(2);
  const latHi = (Math.round(latMax * 4) / 4).toFixed(2);
  const lngLo = (Math.round(lngMin * 4) / 4).toFixed(2);
  const lngHi = (Math.round(lngMax * 4) / 4).toFixed(2);

  for (const dsId of [NCEI_PRELIM_DS, NCEI_FINAL_DS]) {
    const url = `${NCEI_ERDDAP_BASE}/${dsId}.json?sst[(last)][(0.0)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 14000);

    try {
      const resp = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!resp.ok) continue;

      const json = await resp.json() as any;
      const table = json?.table;
      if (!table?.rows?.length) continue;

      const cols: string[] = table.columnNames || [];
      const sstIdx  = cols.indexOf('sst');
      const latIdx  = cols.indexOf('latitude');
      const lngIdx  = cols.indexOf('longitude');
      const timeIdx = cols.indexOf('time');

      const points: { lat: number; lng: number; sst: number }[] = [];
      let dataTime = '';

      for (const row of table.rows) {
        const v = sstIdx >= 0 ? row[sstIdx] : null;
        if (v != null && typeof v === 'number' && !isNaN(v) && v > 0 && v < 40) {
          const lat = latIdx >= 0 ? row[latIdx] : 0;
          const lng = lngIdx >= 0 ? row[lngIdx] : 0;
          points.push({ lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000, sst: Math.round(v * 100) / 100 });
        }
        if (timeIdx >= 0 && row[timeIdx]) dataTime = row[timeIdx];
      }

      if (points.length === 0) continue;

      const result: SstBboxGrid = {
        points,
        dataTimestamp: dataTime,
        dataSource: `NCEI ERDDAP OISST v2.1 (${dsId.includes('prelim') ? 'preliminary' : 'final'})`,
        status: 'LIVE',
      };
      sstCache.set(key, { data: result, timestamp: Date.now() });
      console.log(`[PfzGrid] SST bbox: ${points.length} valid points from ${result.dataSource} ts=${dataTime}`);
      return result;
    } catch {
      clearTimeout(timer);
      continue;
    }
  }

  console.warn('[PfzGrid] SST bbox: NCEI ERDDAP unavailable, no SST data');
  return { points: [], dataTimestamp: '', dataSource: 'NCEI ERDDAP (UNAVAILABLE)', status: 'UNAVAILABLE' };
}

// ── Open-Meteo multi-location SST fallback ───────────────────────────────────
// When NCEI ERDDAP is unavailable, fetch SST for a list of grid points from
// Open-Meteo Marine API (HYCOM ocean model, real-time, free, no API key).
// Open-Meteo supports comma-separated lat/lng arrays in one request.

async function fetchSstMultiPointOpenMeteo(
  points: { lat: number; lng: number }[]
): Promise<SstBboxGrid> {
  if (points.length === 0) return { points: [], dataTimestamp: '', dataSource: 'Open-Meteo (no input)', status: 'UNAVAILABLE' };

  // Open-Meteo supports up to ~100 locations per request; batch if needed
  const BATCH = 80;
  const allPts: { lat: number; lng: number; sst: number }[] = [];
  let dataTimestamp = new Date().toISOString();

  for (let i = 0; i < points.length; i += BATCH) {
    const slice = points.slice(i, i + BATCH);
    const params = new URLSearchParams({
      latitude: slice.map(p => p.lat.toFixed(4)).join(','),
      longitude: slice.map(p => p.lng.toFixed(4)).join(','),
      current: 'sea_surface_temperature',
    });
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);

    try {
      const resp = await fetch(`${OPENMETEO_MARINE}?${params}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!resp.ok) continue;

      const json = await resp.json() as any;
      const items = Array.isArray(json) ? json : [json];
      for (let j = 0; j < items.length && j < slice.length; j++) {
        const sst = items[j]?.current?.sea_surface_temperature ?? 0;
        if (sst > 0 && sst < 40) {
          allPts.push({ lat: slice[j].lat, lng: slice[j].lng, sst: Math.round(sst * 100) / 100 });
        }
      }
      if (items[0]?.current?.time) dataTimestamp = items[0].current.time;
    } catch {
      clearTimeout(timer);
    }
  }

  console.log(`[PfzGrid] SST Open-Meteo fallback: ${allPts.length}/${points.length} valid points`);
  return {
    points: allPts,
    dataTimestamp,
    dataSource: 'Open-Meteo Marine API (HYCOM/ECMWF — model-derived SST, fallback)',
    status: allPts.length > 0 ? 'LIVE' : 'UNAVAILABLE',
  };
}

// ── Chlorophyll bbox from PIFSC ERDDAP ───────────────────────────────────────
interface ChlBboxGrid {
  points: { lat: number; lng: number; chl: number }[];
  dataTimestamp: string;
  dataSource: string;
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
}

async function fetchChlBbox(
  latMin: number, latMax: number, lngMin: number, lngMax: number
): Promise<ChlBboxGrid> {
  const key = bboxKey(latMin, latMax, lngMin, lngMax, 'chl');
  const hit  = chlCache.get(key);
  if (hit && Date.now() - hit.timestamp < CHL_TTL) {
    return { ...hit.data, status: 'CACHED' };
  }

  const latLo = latMin.toFixed(3);
  const latHi = latMax.toFixed(3);
  const lngLo = lngMin.toFixed(3);
  const lngHi = lngMax.toFixed(3);

  const url = `${PIFSC_ERDDAP_BASE}/${PIFSC_CHL_DS}.json?chlor_a[(last)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`PIFSC HTTP ${resp.status}`);

    const json = await resp.json() as any;
    const table = json?.table;
    if (!table?.rows?.length) throw new Error('Empty PIFSC response');

    const cols: string[] = table.columnNames || [];
    const chlIdx  = cols.indexOf('chlor_a');
    const latIdx  = cols.indexOf('latitude');
    const lngIdx  = cols.indexOf('longitude');
    const timeIdx = cols.indexOf('time');

    const points: { lat: number; lng: number; chl: number }[] = [];
    let dataTime = '';

    for (const row of table.rows) {
      const v = chlIdx >= 0 ? row[chlIdx] : null;
      if (v != null && !isNaN(v) && v > 0 && v < 100) {
        const lat = latIdx >= 0 ? row[latIdx] : 0;
        const lng = lngIdx >= 0 ? row[lngIdx] : 0;
        points.push({ lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000, chl: Math.round(v * 1000) / 1000 });
      }
      if (timeIdx >= 0 && row[timeIdx]) dataTime = row[timeIdx];
    }

    if (points.length === 0) throw new Error('No valid pixels in PIFSC bbox');

    const result: ChlBboxGrid = {
      points,
      dataTimestamp: dataTime,
      dataSource: 'PIFSC ERDDAP — ESA-CCI Chlorophyll-a v6.0 (8-day composite)',
      status: 'LIVE',
    };
    chlCache.set(key, { data: result, timestamp: Date.now() });
    console.log(`[PfzGrid] CHL bbox: ${points.length} valid pixels ts=${dataTime}`);
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[PfzGrid] CHL bbox UNAVAILABLE: ${err.message}`);
    return { points: [], dataTimestamp: '', dataSource: 'PIFSC ERDDAP ESA-CCI (UNAVAILABLE)', status: 'UNAVAILABLE' };
  }
}

// ── Nearest-value lookup helpers ──────────────────────────────────────────────

function nearestSst(
  lat: number, lng: number,
  sstPoints: { lat: number; lng: number; sst: number }[]
): number {
  if (sstPoints.length === 0) return 0;
  let best = sstPoints[0], bestDist = Infinity;
  for (const p of sstPoints) {
    const d = (lat - p.lat) ** 2 + (lng - p.lng) ** 2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return bestDist < 0.5 * 0.5 ? best.sst : 0; // only use if within 0.5°
}

function nearestChl(
  lat: number, lng: number,
  chlPoints: { lat: number; lng: number; chl: number }[]
): number {
  if (chlPoints.length === 0) return 0;
  let best = chlPoints[0], bestDist = Infinity;
  for (const p of chlPoints) {
    const d = (lat - p.lat) ** 2 + (lng - p.lng) ** 2;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return bestDist < 0.25 * 0.25 ? best.chl : 0;
}

// ── SST gradient from multi-point grid ───────────────────────────────────────
// Uses finite differences over the 0.25° OISST grid.
// Gradient = sqrt((dSST/dlat)^2 + (dSST/dlng)^2) in °C / 0.25°

function computeGradient(
  lat: number, lng: number,
  sstPoints: { lat: number; lng: number; sst: number }[]
): number {
  const delta = 0.25;
  const centerSst = nearestSst(lat, lng, sstPoints);
  if (centerSst === 0) return 0;

  const northSst = nearestSst(lat + delta, lng, sstPoints);
  const southSst = nearestSst(lat - delta, lng, sstPoints);
  const eastSst  = nearestSst(lat, lng + delta, sstPoints);
  const westSst  = nearestSst(lat, lng - delta, sstPoints);

  // Use central difference where both neighbours are valid; else one-sided
  const dLat = northSst > 0 && southSst > 0
    ? Math.abs((northSst - southSst) / (2 * delta))
    : northSst > 0 ? Math.abs((northSst - centerSst) / delta)
    : southSst > 0 ? Math.abs((centerSst - southSst) / delta)
    : 0;

  const dLng = eastSst > 0 && westSst > 0
    ? Math.abs((eastSst - westSst) / (2 * delta))
    : eastSst > 0 ? Math.abs((eastSst - centerSst) / delta)
    : westSst > 0 ? Math.abs((centerSst - westSst) / delta)
    : 0;

  const grad = Math.sqrt(dLat * dLat + dLng * dLng);
  return Math.round(grad * 1000) / 1000;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a real spatial grid of (SST, SST gradient, Chlorophyll) around a location.
 * Grid step: 0.25°. Area: ±1° in each direction from origin.
 * All values come from real satellite/model data sources (no synthetic variation).
 */
export async function fetchPfzGrid(
  originLat: number,
  originLng: number,
  radiusKm: number = 150
): Promise<PfzGridResult> {
  const now = new Date().toISOString();
  const margin = Math.min(radiusKm / 111, 1.5); // km → degrees, cap at 1.5°

  const latMin = originLat - margin;
  const latMax = originLat + margin;
  const lngMin = originLng - margin;
  const lngMax = originLng + margin;

  // Parallel fetch of SST and CHL grids
  let [sstGrid, chlGrid] = await Promise.all([
    fetchSstBbox(latMin, latMax, lngMin, lngMax),
    fetchChlBbox(latMin, latMax, lngMin, lngMax),
  ]);

  // SST fallback: if NCEI unavailable, use Open-Meteo multi-location
  if (sstGrid.status === 'UNAVAILABLE') {
    const step = 0.25;
    const fallbackPoints: { lat: number; lng: number }[] = [];
    for (let dLat = -margin; dLat <= margin + 0.01; dLat += step) {
      for (let dLng = -margin; dLng <= margin + 0.01; dLng += step) {
        const cLat = Math.round((originLat + dLat) * 1000) / 1000;
        const cLng = Math.round((originLng + dLng) * 1000) / 1000;
        if (cLat >= -90 && cLat <= 90 && cLng >= -180 && cLng <= 180) {
          fallbackPoints.push({ lat: cLat, lng: cLng });
        }
      }
    }
    console.log(`[PfzGrid] NCEI unavailable — trying Open-Meteo for ${fallbackPoints.length} points`);
    sstGrid = await fetchSstMultiPointOpenMeteo(fallbackPoints);
  }

  // Build candidate grid at 0.25° steps
  const gridStep = 0.25;
  const gridPoints: GridPoint[] = [];

  for (let dLat = -margin; dLat <= margin + 0.01; dLat += gridStep) {
    for (let dLng = -margin; dLng <= margin + 0.01; dLng += gridStep) {
      const cLat = Math.round((originLat + dLat) * 1000) / 1000;
      const cLng = Math.round((originLng + dLng) * 1000) / 1000;

      // Skip origin itself and out-of-ocean bounds
      if (cLat < -90 || cLat > 90 || cLng < -180 || cLng > 180) continue;

      const sst = nearestSst(cLat, cLng, sstGrid.points);
      const chl = nearestChl(cLat, cLng, chlGrid.points);
      const gradient = sst > 0 ? computeGradient(cLat, cLng, sstGrid.points) : 0;

      gridPoints.push({
        lat: cLat,
        lng: cLng,
        sst,
        sstGradient: gradient,
        chlorophyll: chl,
        sstStatus: sst > 0 ? (sstGrid.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : sstGrid.status) : 'UNAVAILABLE',
        chlStatus: chl > 0 ? (chlGrid.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : chlGrid.status) : 'UNAVAILABLE',
        sstTimestamp: sstGrid.dataTimestamp,
        chlTimestamp: chlGrid.dataTimestamp,
      });
    }
  }

  const validSstCount = gridPoints.filter(p => p.sst > 0).length;
  const validChlCount = gridPoints.filter(p => p.chlorophyll > 0).length;
  console.log(`[PfzGrid] Built ${gridPoints.length} grid points — SST valid: ${validSstCount}, CHL valid: ${validChlCount}`);

  return {
    origin: { lat: originLat, lng: originLng },
    radiusKm,
    gridPoints,
    sstSource: sstGrid.dataSource,
    chlSource: chlGrid.dataSource,
    sstStatus: sstGrid.status,
    chlStatus: chlGrid.status,
    sstTimestamp: sstGrid.dataTimestamp,
    chlTimestamp: chlGrid.dataTimestamp,
    retrievedAt: now,
  };
}
