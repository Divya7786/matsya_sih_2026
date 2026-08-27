const ERDDAP_BASE = 'https://erddap.incois.gov.in/erddap/griddap';
const NCEI_ERDDAP_BASE = 'https://www.ncei.noaa.gov/erddap/griddap';
const PIFSC_ERDDAP_BASE = 'https://oceanwatch.pifsc.noaa.gov/erddap/griddap';

export interface ChlorophyllResult {
  chlorophyll: number;
  dataSource: string;
  datasetId: string;
  dataTimestamp: string;
  retrievedAt: string;
  liveOrCached: 'LIVE' | 'CACHED' | 'HISTORICAL' | 'LIVE_DATA_UNAVAILABLE';
  spatialResolution: string;
  note: string;
}

export interface ArgoSstResult {
  sst: number;
  salinity: number;
  depth: number;
  dataSource: string;
  datasetId: string;
  dataTimestamp: string;
  retrievedAt: string;
  liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (data is historical/infrequently updated)

function getCacheKey(dataset: string, lat: number, lng: number): string {
  const gridLat = Math.round(lat * 20) / 20;
  const gridLng = Math.round(lng * 20) / 20;
  return `${dataset}:${gridLat}:${gridLng}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 300) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

export async function fetchChlorophyll(lat: number, lng: number): Promise<ChlorophyllResult> {
  const cacheKey = getCacheKey('chl', lat, lng);
  const cached = getFromCache<ChlorophyllResult>(cacheKey);
  if (cached) return cached;

  const latLo = (lat - 0.1).toFixed(2);
  const latHi = (lat + 0.1).toFixed(2);
  const lngLo = (lng - 0.1).toFixed(2);
  const lngHi = (lng + 0.1).toFixed(2);

  const url = `${ERDDAP_BASE}/incois_oceansat2_datasets.json?CHL[(last)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`INCOIS ERDDAP returned HTTP ${response.status}`);
    }

    const json = await response.json() as any;
    const now = new Date().toISOString();

    const table = json?.table;
    if (!table || !table.rows || table.rows.length === 0) {
      throw new Error('No chlorophyll data in response');
    }

    const colNames: string[] = table.columnNames || [];
    const chlIdx = colNames.indexOf('CHL');
    const timeIdx = colNames.indexOf('time');

    let totalChl = 0;
    let validCount = 0;
    let dataTime = '';

    for (const row of table.rows) {
      const val = chlIdx >= 0 ? row[chlIdx] : null;
      if (val != null && !isNaN(val) && val > 0 && val < 100) {
        totalChl += val;
        validCount++;
      }
      if (timeIdx >= 0 && row[timeIdx]) {
        dataTime = row[timeIdx];
      }
    }

    const avgChl = validCount > 0 ? Math.round((totalChl / validCount) * 1000) / 1000 : 0;

    const result: ChlorophyllResult = {
      chlorophyll: avgChl,
      dataSource: 'INCOIS ERDDAP — Oceansat-2 OCM Chlorophyll-a',
      datasetId: 'incois_oceansat2_datasets',
      dataTimestamp: dataTime || '2020-05-01T00:00:00Z',
      retrievedAt: now,
      liveOrCached: 'HISTORICAL',
      spatialResolution: '0.04° (~4 km)',
      note: 'Latest available: May 2020. No free real-time chlorophyll source for Indian waters. Labeled HISTORICAL.',
    };

    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[INCOIS ERDDAP] Chlorophyll fetch failed:`, err.message);
    return {
      chlorophyll: 0,
      dataSource: 'INCOIS ERDDAP (UNAVAILABLE)',
      datasetId: 'incois_oceansat2_datasets',
      dataTimestamp: '',
      retrievedAt: new Date().toISOString(),
      liveOrCached: 'LIVE_DATA_UNAVAILABLE',
      spatialResolution: '0.04° (~4 km)',
      note: `Fetch failed: ${err.message}`,
    };
  }
}

export async function fetchNceiSst(lat: number, lng: number): Promise<{ sst: number; dataTimestamp: string; dataSource: string; liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE' }> {
  const cacheKey = getCacheKey('ncei_sst', lat, lng);
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  // Use a small spatial range to handle NaN gaps in satellite data
  const latLo = (Math.round(lat * 4) / 4 - 0.25).toFixed(2);
  const latHi = (Math.round(lat * 4) / 4 + 0.25).toFixed(2);
  const lngLo = (Math.round(lng * 4) / 4 - 0.25).toFixed(2);
  const lngHi = (Math.round(lng * 4) / 4 + 0.25).toFixed(2);

  const datasets = [
    'ncdc_oisst_v2_avhrr_prelim_by_time_zlev_lat_lon',
    'ncdc_oisst_v2_avhrr_by_time_zlev_lat_lon',
  ];

  for (const dsId of datasets) {
    const url = `${NCEI_ERDDAP_BASE}/${dsId}.json?sst[(last)][(0.0)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;

      const json = await response.json() as any;
      const table = json?.table;
      if (!table?.rows?.length) continue;

      const colNames: string[] = table.columnNames || [];
      const sstIdx = colNames.indexOf('sst');
      const timeIdx = colNames.indexOf('time');

      let totalSst = 0;
      let validCount = 0;
      let dataTime = '';
      for (const row of table.rows) {
        const val = sstIdx >= 0 ? row[sstIdx] : null;
        if (val != null && typeof val === 'number' && !isNaN(val) && val > 0 && val < 40) {
          totalSst += val;
          validCount++;
        }
        if (timeIdx >= 0 && row[timeIdx]) dataTime = row[timeIdx];
      }

      if (validCount === 0) continue;
      const avgSst = totalSst / validCount;

      const result = {
        sst: Math.round(avgSst * 100) / 100,
        dataTimestamp: dataTime,
        dataSource: `NCEI ERDDAP OISST v2.1 (${dsId.includes('prelim') ? 'preliminary' : 'final'})`,
        liveOrCached: 'LIVE' as const,
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      clearTimeout(timeout);
      continue;
    }
  }

  return { sst: 0, dataTimestamp: '', dataSource: 'NCEI ERDDAP (UNAVAILABLE)', liveOrCached: 'LIVE_DATA_UNAVAILABLE' };
}

export async function fetchPifscChlorophyll(lat: number, lng: number): Promise<ChlorophyllResult> {
  const cacheKey = getCacheKey('pifsc_chl', lat, lng);
  const cached = getFromCache<ChlorophyllResult>(cacheKey);
  if (cached) return cached;

  const latLo = (lat - 0.05).toFixed(3);
  const latHi = (lat + 0.05).toFixed(3);
  const lngLo = (lng - 0.05).toFixed(3);
  const lngHi = (lng + 0.05).toFixed(3);

  const url = `${PIFSC_ERDDAP_BASE}/esa-cci-chla-8d-v6-0.json?chlor_a[(last)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`PIFSC ERDDAP returned HTTP ${response.status}`);

    const json = await response.json() as any;
    const table = json?.table;
    if (!table?.rows?.length) throw new Error('No chlorophyll data');

    const colNames: string[] = table.columnNames || [];
    const chlIdx = colNames.indexOf('chlor_a');
    const timeIdx = colNames.indexOf('time');

    let totalChl = 0;
    let validCount = 0;
    let dataTime = '';

    for (const row of table.rows) {
      const val = chlIdx >= 0 ? row[chlIdx] : null;
      if (val != null && !isNaN(val) && val > 0 && val < 100) {
        totalChl += val;
        validCount++;
      }
      if (timeIdx >= 0 && row[timeIdx]) dataTime = row[timeIdx];
    }

    const avgChl = validCount > 0 ? Math.round((totalChl / validCount) * 1000) / 1000 : 0;

    const result: ChlorophyllResult = {
      chlorophyll: avgChl,
      dataSource: 'PIFSC ERDDAP — ESA CCI Chlorophyll-a v6.0 (8-day composite)',
      datasetId: 'esa-cci-chla-8d-v6-0',
      dataTimestamp: dataTime,
      retrievedAt: new Date().toISOString(),
      liveOrCached: 'LIVE',
      spatialResolution: '0.042° (~4 km)',
      note: 'ESA Climate Change Initiative Ocean Colour dataset, 8-day composite, global coverage.',
    };

    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[PIFSC ERDDAP] Chlorophyll fetch failed:`, err.message);
    return {
      chlorophyll: 0,
      dataSource: 'PIFSC ERDDAP (UNAVAILABLE)',
      datasetId: 'esa-cci-chla-8d-v6-0',
      dataTimestamp: '',
      retrievedAt: new Date().toISOString(),
      liveOrCached: 'LIVE_DATA_UNAVAILABLE',
      spatialResolution: '0.042° (~4 km)',
      note: `Fetch failed: ${err.message}`,
    };
  }
}

export async function fetchArgoSst(lat: number, lng: number): Promise<ArgoSstResult> {
  const cacheKey = getCacheKey('argo_sst', lat, lng);
  const cached = getFromCache<ArgoSstResult>(cacheKey);
  if (cached) return cached;

  const latLo = (Math.floor(lat * 2) / 2).toFixed(1);
  const latHi = (Math.ceil(lat * 2) / 2).toFixed(1);
  const lngLo = (Math.floor(lng * 2) / 2).toFixed(1);
  const lngHi = (Math.ceil(lng * 2) / 2).toFixed(1);

  const url = `${ERDDAP_BASE}/incois_argo_10d_VAM.json?TEMP[(last)][(5.0)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})],SAL[(last)][(5.0)][(${latLo}):(${latHi})][(${lngLo}):(${lngHi})]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`INCOIS Argo ERDDAP returned HTTP ${response.status}`);
    }

    const json = await response.json() as any;
    const now = new Date().toISOString();

    const table = json?.table;
    if (!table || !table.rows || table.rows.length === 0) {
      throw new Error('No Argo data in response');
    }

    const colNames: string[] = table.columnNames || [];
    const tempIdx = colNames.indexOf('TEMP');
    const salIdx = colNames.indexOf('SAL');
    const timeIdx = colNames.indexOf('time');
    const depthIdx = colNames.indexOf('depth');

    let temp = 0;
    let sal = 0;
    let dataTime = '';
    let depth = 5;

    for (const row of table.rows) {
      const t = tempIdx >= 0 ? row[tempIdx] : null;
      const s = salIdx >= 0 ? row[salIdx] : null;
      if (t != null && !isNaN(t)) temp = t;
      if (s != null && !isNaN(s)) sal = s;
      if (timeIdx >= 0 && row[timeIdx]) dataTime = row[timeIdx];
      if (depthIdx >= 0 && row[depthIdx]) depth = row[depthIdx];
    }

    const result: ArgoSstResult = {
      sst: Math.round(temp * 100) / 100,
      salinity: Math.round(sal * 100) / 100,
      depth,
      dataSource: 'INCOIS ERDDAP — Argo 10-Day VAM (near-real-time)',
      datasetId: 'incois_argo_10d_VAM',
      dataTimestamp: dataTime,
      retrievedAt: now,
      liveOrCached: 'LIVE',
    };

    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[INCOIS ERDDAP] Argo SST fetch failed:`, err.message);
    return {
      sst: 0,
      salinity: 0,
      depth: 5,
      dataSource: 'INCOIS ERDDAP Argo (UNAVAILABLE)',
      datasetId: 'incois_argo_10d_VAM',
      dataTimestamp: '',
      retrievedAt: new Date().toISOString(),
      liveOrCached: 'LIVE_DATA_UNAVAILABLE',
    };
  }
}
