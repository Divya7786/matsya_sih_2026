const BASE_URL = 'https://marine-api.open-meteo.com/v1/marine';

export interface MarineCurrentData {
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  windWaveHeight: number;
  windWavePeriod: number;
  swellWaveHeight: number;
  swellWavePeriod: number;
  swellWaveDirection: number;
  oceanCurrentVelocity: number;
  oceanCurrentDirection: number;
  sst: number;
}

export interface MarineHourlyForecast {
  time: string[];
  waveHeight: number[];
  swellWaveHeight: number[];
  swellWavePeriod: number[];
  windWaveHeight: number[];
  sst: number[];
  oceanCurrentVelocity: number[];
}

export interface MarineLiveResponse {
  latitude: number;
  longitude: number;
  current: MarineCurrentData;
  hourlyForecast: MarineHourlyForecast | null;
  dataSource: string;
  dataTimestamp: string;
  retrievedAt: string;
  liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE';
}

export interface SstGradientResult {
  sst: number;
  sstGradient: number;
  dataSource: string;
  dataTimestamp: string;
  liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(lat: number, lng: number, type: string): string {
  const gridLat = Math.round(lat * 10) / 10;
  const gridLng = Math.round(lng * 10) / 10;
  return `${type}:${gridLat}:${gridLng}`;
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
  cache.set(key, { data, timestamp: Date.now(), key });
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

export async function fetchMarineLive(lat: number, lng: number, forecastDays: number = 2): Promise<MarineLiveResponse> {
  const cacheKey = getCacheKey(lat, lng, 'marine');
  const cached = getFromCache<MarineLiveResponse>(cacheKey);
  if (cached) return { ...cached, liveOrCached: 'CACHED' };

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current: 'wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,ocean_current_velocity,ocean_current_direction,sea_surface_temperature',
    hourly: 'wave_height,swell_wave_height,swell_wave_period,wind_wave_height,sea_surface_temperature,ocean_current_velocity',
    forecast_days: forecastDays.toString(),
  });

  const url = `${BASE_URL}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned HTTP ${response.status}`);
    }

    const json = await response.json() as any;
    const now = new Date().toISOString();

    const current: MarineCurrentData = {
      waveHeight: json.current?.wave_height ?? 0,
      waveDirection: json.current?.wave_direction ?? 0,
      wavePeriod: json.current?.wave_period ?? 0,
      windWaveHeight: json.current?.wind_wave_height ?? 0,
      windWavePeriod: json.current?.wind_wave_period ?? 0,
      swellWaveHeight: json.current?.swell_wave_height ?? 0,
      swellWavePeriod: json.current?.swell_wave_period ?? 0,
      swellWaveDirection: json.current?.swell_wave_direction ?? 0,
      oceanCurrentVelocity: json.current?.ocean_current_velocity ?? 0,
      oceanCurrentDirection: json.current?.ocean_current_direction ?? 0,
      sst: json.current?.sea_surface_temperature ?? 0,
    };

    let hourlyForecast: MarineHourlyForecast | null = null;
    if (json.hourly) {
      hourlyForecast = {
        time: json.hourly.time || [],
        waveHeight: json.hourly.wave_height || [],
        swellWaveHeight: json.hourly.swell_wave_height || [],
        swellWavePeriod: json.hourly.swell_wave_period || [],
        windWaveHeight: json.hourly.wind_wave_height || [],
        sst: json.hourly.sea_surface_temperature || [],
        oceanCurrentVelocity: json.hourly.ocean_current_velocity || [],
      };
    }

    const result: MarineLiveResponse = {
      latitude: json.latitude ?? lat,
      longitude: json.longitude ?? lng,
      current,
      hourlyForecast,
      dataSource: 'Open-Meteo Marine API (WaveWatch III / ECMWF)',
      dataTimestamp: json.current_units?.time || json.current?.time || now,
      retrievedAt: now,
      liveOrCached: 'LIVE',
    };

    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[OpenMeteoMarine] Fetch failed for (${lat}, ${lng}):`, err.message);
    return {
      latitude: lat,
      longitude: lng,
      current: { waveHeight: 0, waveDirection: 0, wavePeriod: 0, windWaveHeight: 0, windWavePeriod: 0, swellWaveHeight: 0, swellWavePeriod: 0, swellWaveDirection: 0, oceanCurrentVelocity: 0, oceanCurrentDirection: 0, sst: 0 },
      hourlyForecast: null,
      dataSource: 'Open-Meteo Marine API (UNAVAILABLE)',
      dataTimestamp: new Date().toISOString(),
      retrievedAt: new Date().toISOString(),
      liveOrCached: 'LIVE_DATA_UNAVAILABLE',
    };
  }
}

export async function fetchSstWithGradient(lat: number, lng: number): Promise<SstGradientResult> {
  const cacheKey = getCacheKey(lat, lng, 'sst_grad');
  const cached = getFromCache<SstGradientResult>(cacheKey);
  if (cached) return { ...cached, liveOrCached: 'CACHED' };

  const delta = 0.25;
  const points = [
    { lat, lng },
    { lat: lat + delta, lng },
    { lat: lat - delta, lng },
    { lat, lng: lng + delta },
    { lat, lng: lng - delta },
  ];

  const params = new URLSearchParams({
    latitude: points.map(p => p.lat.toFixed(4)).join(','),
    longitude: points.map(p => p.lng.toFixed(4)).join(','),
    current: 'sea_surface_temperature',
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open-Meteo SST gradient returned HTTP ${response.status}`);
    }

    const json = await response.json() as any;
    const now = new Date().toISOString();

    let ssts: number[];
    if (Array.isArray(json)) {
      ssts = json.map((item: any) => item?.current?.sea_surface_temperature ?? 0);
    } else {
      ssts = [json?.current?.sea_surface_temperature ?? 0];
    }

    const centerSst = ssts[0] || 0;

    let gradient = 0;
    if (ssts.length >= 5) {
      const latGradient = Math.abs((ssts[1] || centerSst) - (ssts[2] || centerSst)) / (2 * delta);
      const lngGradient = Math.abs((ssts[3] || centerSst) - (ssts[4] || centerSst)) / (2 * delta);
      gradient = Math.round(Math.sqrt(latGradient * latGradient + lngGradient * lngGradient) * 1000) / 1000;
    }

    const result: SstGradientResult = {
      sst: centerSst,
      sstGradient: gradient,
      dataSource: 'Open-Meteo Marine API (WaveWatch III / ECMWF)',
      dataTimestamp: now,
      liveOrCached: 'LIVE',
    };

    setCache(cacheKey, result);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[OpenMeteoMarine] SST gradient fetch failed:`, err.message);
    return {
      sst: 0,
      sstGradient: 0,
      dataSource: 'Open-Meteo Marine API (UNAVAILABLE)',
      dataTimestamp: new Date().toISOString(),
      liveOrCached: 'LIVE_DATA_UNAVAILABLE',
    };
  }
}

export async function fetchTomorrowForecast(lat: number, lng: number): Promise<{
  waveHeight: number; swellHeight: number; windWaveHeight: number; sst: number;
  dataSource: string; forecastTimestamp: string; liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE';
}> {
  const marine = await fetchMarineLive(lat, lng, 3);
  if (marine.liveOrCached === 'LIVE_DATA_UNAVAILABLE' || !marine.hourlyForecast) {
    return { waveHeight: 0, swellHeight: 0, windWaveHeight: 0, sst: 0, dataSource: marine.dataSource, forecastTimestamp: '', liveOrCached: marine.liveOrCached };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  const tomorrowStr = tomorrow.toISOString().slice(0, 13);

  const idx = marine.hourlyForecast.time.findIndex(t => t.startsWith(tomorrowStr.slice(0, 10) + 'T08'));
  const i = idx >= 0 ? idx : Math.min(24, marine.hourlyForecast.time.length - 1);

  return {
    waveHeight: marine.hourlyForecast.waveHeight[i] ?? 0,
    swellHeight: marine.hourlyForecast.swellWaveHeight[i] ?? 0,
    windWaveHeight: marine.hourlyForecast.windWaveHeight[i] ?? 0,
    sst: marine.hourlyForecast.sst[i] ?? marine.current.sst,
    dataSource: marine.dataSource,
    forecastTimestamp: marine.hourlyForecast.time[i] || '',
    liveOrCached: 'LIVE',
  };
}
