import { fetchMarineLive, fetchSstWithGradient, fetchTomorrowForecast, MarineLiveResponse, SstGradientResult } from './openMeteoMarineClient';
import { fetchChlorophyll, fetchArgoSst, fetchNceiSst, fetchPifscChlorophyll, ChlorophyllResult, ArgoSstResult } from './incoisErddapClient';

export interface LiveOceanData {
  sst: number;
  sstGradient: number;
  chlorophyll: number;
  waveHeight: number;
  swellHeight: number;
  swellPeriod: number;
  windWaveHeight: number;
  wavePeriod: number;
  oceanCurrentVelocity: number;
  oceanCurrentDirection: number;
  sources: {
    sst: { source: string; timestamp: string; status: 'LIVE' | 'CACHED' | 'HISTORICAL' | 'LIVE_DATA_UNAVAILABLE' };
    chlorophyll: { source: string; timestamp: string; status: 'LIVE' | 'CACHED' | 'HISTORICAL' | 'LIVE_DATA_UNAVAILABLE' };
    weather: { source: string; timestamp: string; status: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE' };
    argoValidation?: { source: string; timestamp: string; sst: number; status: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE' };
  };
  retrievedAt: string;
  overallStatus: 'LIVE' | 'PARTIAL_LIVE' | 'CACHED' | 'UNAVAILABLE';
}

export interface MlModelInput {
  sst: number;
  sst_gradient: number;
  chlorophyll: number;
  dataSource: string;
  liveOrCached: 'LIVE' | 'PARTIAL_LIVE' | 'CACHED' | 'UNAVAILABLE';
}

export interface ForecastData {
  tomorrowWaveHeight: number;
  tomorrowSwellHeight: number;
  tomorrowWindWaveHeight: number;
  tomorrowSst: number;
  forecastTimestamp: string;
  dataSource: string;
  liveOrCached: 'LIVE' | 'CACHED' | 'LIVE_DATA_UNAVAILABLE';
}

export async function getLiveOceanData(lat: number, lng: number): Promise<LiveOceanData> {
  const [marineData, sstGradientData, chlData] = await Promise.all([
    fetchMarineLive(lat, lng),
    fetchSstWithGradient(lat, lng),
    fetchChlorophyll(lat, lng),
  ]);

  const now = new Date().toISOString();

  const sst = sstGradientData.sst || marineData.current.sst;
  const sstGradient = sstGradientData.sstGradient;
  const chlorophyll = chlData.chlorophyll;

  const sstStatus = marineData.liveOrCached === 'LIVE' ? 'LIVE' as const : marineData.liveOrCached;
  const chlStatus = chlData.liveOrCached;
  const weatherStatus = marineData.liveOrCached;

  let overallStatus: LiveOceanData['overallStatus'] = 'UNAVAILABLE';
  if (sstStatus === 'LIVE' && weatherStatus === 'LIVE') {
    overallStatus = chlStatus === 'HISTORICAL' ? 'PARTIAL_LIVE' : 'LIVE';
  } else if (sstStatus === 'LIVE' || weatherStatus === 'LIVE') {
    overallStatus = 'PARTIAL_LIVE';
  } else if (sstStatus === 'CACHED' || weatherStatus === 'CACHED') {
    overallStatus = 'CACHED';
  }

  return {
    sst,
    sstGradient,
    chlorophyll,
    waveHeight: marineData.current.waveHeight,
    swellHeight: marineData.current.swellWaveHeight,
    swellPeriod: marineData.current.swellWavePeriod,
    windWaveHeight: marineData.current.windWaveHeight,
    wavePeriod: marineData.current.wavePeriod,
    oceanCurrentVelocity: marineData.current.oceanCurrentVelocity,
    oceanCurrentDirection: marineData.current.oceanCurrentDirection,
    sources: {
      sst: { source: sstGradientData.dataSource, timestamp: sstGradientData.dataTimestamp, status: sstStatus },
      chlorophyll: { source: chlData.dataSource, timestamp: chlData.dataTimestamp, status: chlStatus },
      weather: { source: marineData.dataSource, timestamp: marineData.dataTimestamp, status: weatherStatus },
    },
    retrievedAt: now,
    overallStatus,
  };
}

export async function getMlModelInput(lat: number, lng: number): Promise<MlModelInput> {
  // Cascading data sources: try best (most recent) first, fall back to alternatives
  const [sstGradientData, nceiSst, pifscChl, incoisChl] = await Promise.all([
    fetchSstWithGradient(lat, lng),
    fetchNceiSst(lat, lng),
    fetchPifscChlorophyll(lat, lng),
    fetchChlorophyll(lat, lng),
  ]);

  // SST: prefer NCEI (1-2 days lag) > Open-Meteo (real-time but model-derived) > gradient center
  let sst = 0;
  let sstSource = '';
  if (nceiSst.sst > 0) {
    sst = nceiSst.sst;
    sstSource = nceiSst.dataSource;
  } else if (sstGradientData.sst > 0) {
    sst = sstGradientData.sst;
    sstSource = sstGradientData.dataSource;
  }

  const sstGradient = sstGradientData.sstGradient;

  // Chlorophyll: prefer PIFSC ESA-CCI (recent, 8-day composite) > INCOIS Oceansat-2 (historical)
  let chlorophyll = 0;
  let chlSource = '';
  let chlStatus: 'LIVE' | 'CACHED' | 'HISTORICAL' | 'LIVE_DATA_UNAVAILABLE' = 'LIVE_DATA_UNAVAILABLE';
  if (pifscChl.chlorophyll > 0) {
    chlorophyll = pifscChl.chlorophyll;
    chlSource = pifscChl.dataSource;
    chlStatus = pifscChl.liveOrCached;
  } else if (incoisChl.chlorophyll > 0) {
    chlorophyll = incoisChl.chlorophyll;
    chlSource = incoisChl.dataSource;
    chlStatus = incoisChl.liveOrCached;
  }

  let liveOrCached: MlModelInput['liveOrCached'] = 'UNAVAILABLE';
  if (sst > 0 && chlorophyll > 0) {
    liveOrCached = chlStatus === 'HISTORICAL' ? 'PARTIAL_LIVE' : 'LIVE';
  } else if (sst > 0) {
    liveOrCached = 'PARTIAL_LIVE';
  } else if (chlorophyll > 0) {
    liveOrCached = 'PARTIAL_LIVE';
  }

  const sources = [sstSource, chlSource].filter(Boolean);

  return {
    sst,
    sst_gradient: sstGradient,
    chlorophyll,
    dataSource: sources.join(' + ') || 'UNAVAILABLE',
    liveOrCached,
  };
}

export async function getTomorrowForecast(lat: number, lng: number): Promise<ForecastData> {
  const forecast = await fetchTomorrowForecast(lat, lng);
  return {
    tomorrowWaveHeight: forecast.waveHeight,
    tomorrowSwellHeight: forecast.swellHeight,
    tomorrowWindWaveHeight: forecast.windWaveHeight,
    tomorrowSst: forecast.sst,
    forecastTimestamp: forecast.forecastTimestamp,
    dataSource: forecast.dataSource,
    liveOrCached: forecast.liveOrCached,
  };
}

export async function getArgoValidation(lat: number, lng: number): Promise<ArgoSstResult> {
  return fetchArgoSst(lat, lng);
}
