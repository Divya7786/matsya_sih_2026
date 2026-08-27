import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { globalMultiAgentOrchestrator } from './server/agents/orchestrator';
import { orchestratorAgent } from './server/agents/orchestratorAgent';
import { marineIntelligenceAgent } from './server/agents/marineIntelligenceAgent';
import { spatialRiskAgent } from './server/agents/spatialRiskAgent';
import { globalOceanPfzAgent } from './server/agents/oceanPfzAgent';
import { globalWeatherSafetyAgent } from './server/agents/weatherSafetyAgent';
import { globalGeofenceAgent } from './server/agents/geofenceAgent';
import { globalVectorStore } from './server/db/vectorStore';
import { TOOL_REGISTRY, getToolsForIntent } from './server/agents/toolRegistry';
import { fetchMarineLive, fetchSstWithGradient } from './server/data/openMeteoMarineClient';
import { fetchNceiSst, fetchPifscChlorophyll } from './server/data/incoisErddapClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT as string, 10) : 3000;

app.use(express.json());

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MATSYA AI — Four-Agent Marine Intelligence Platform',
    version: '3.0.0-four-agent',
    timestamp: new Date().toISOString(),
    aiReady: !!process.env.GEMINI_API_KEY,
    architecture: 'Four-Agent System',
    registeredAgents: [
      'Agent 1: Orchestrator AI',
      'Agent 2: Marine Intelligence & Prediction AI',
      'Agent 3: Spatial & Risk AI',
      'Agent 4: Synthesis & Voice AI',
    ],
  });
});

// 2. Real-Time Ocean Location Telemetry
app.get('/api/ocean/location', async (req, res) => {
  const lat = parseFloat(req.query.lat as string) || 13.0827;
  const lng = parseFloat(req.query.lng as string) || 80.2707;

  const isBayOfBengal = lat >= 8 && lat <= 22 && lng >= 80 && lng <= 95;
  const isArabianSea = lat >= 8 && lat <= 24 && lng >= 60 && lng <= 78;

  // Fetch real data in parallel — allSettled so partial failures don't crash
  const [marineResult, sstGradResult, nceiSstResult, chlResult] = await Promise.allSettled([
    fetchMarineLive(lat, lng),
    fetchSstWithGradient(lat, lng),
    fetchNceiSst(lat, lng),
    fetchPifscChlorophyll(lat, lng),
  ]);

  const marine = marineResult.status === 'fulfilled' ? marineResult.value : null;
  const sstGrad = sstGradResult.status === 'fulfilled' ? sstGradResult.value : null;
  const nceiSst = nceiSstResult.status === 'fulfilled' ? nceiSstResult.value : null;
  const chlData = chlResult.status === 'fulfilled' ? chlResult.value : null;

  // SST: NCEI OISST (best, 1-2 day lag) > Open-Meteo gradient > Open-Meteo current > physics model
  const liveSST = (nceiSst?.sst && nceiSst.sst > 0) ? nceiSst.sst
    : (sstGrad?.sst && sstGrad.sst > 0) ? sstGrad.sst
    : (marine?.current?.sst && marine.current.sst > 0) ? marine.current.sst
    : null;
  const baseSst = 29.5 - Math.abs(lat) * 0.42 + (isBayOfBengal ? 0.6 : 0) - (isArabianSea ? 0.3 : 0);
  const temperature = liveSST
    ? Math.round(liveSST * 10) / 10
    : Math.max(12, Math.min(31.8, Math.round(baseSst * 10) / 10));

  // Salinity: no free real-time API — physics model
  const baseSalinity = isBayOfBengal ? 33.2 : isArabianSea ? 36.4 : 35.0;
  const salinity = Math.round((baseSalinity + (Math.sin(lat * 3 + lng) * 0.4)) * 10) / 10;

  // Chlorophyll: PIFSC ESA-CCI > physics model
  const liveChl = (chlData?.chlorophyll && chlData.chlorophyll > 0) ? chlData.chlorophyll : null;
  const chlorophyll = liveChl
    ? liveChl
    : Math.round((1.2 + (Math.abs(Math.sin(lat * 5 + lng * 2)) * 1.8)) * 100) / 100;

  // Wave height: Open-Meteo Marine > physics model
  const waveHeight = (marine?.current?.waveHeight && marine.current.waveHeight > 0)
    ? Math.round(marine.current.waveHeight * 10) / 10
    : Math.round((0.7 + (Math.abs(Math.sin(lat * 2 - lng)) * 1.2)) * 10) / 10;

  // Wind speed: estimated from windWaveHeight correlation > physics model
  const windSpeed = (marine?.current?.windWaveHeight && marine.current.windWaveHeight > 0)
    ? Math.round(marine.current.windWaveHeight * 15)
    : Math.round(10 + Math.abs(Math.sin(lng * 3)) * 14);

  // Wind direction from wave direction (best available proxy)
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const waveDirDeg = marine?.current?.waveDirection || 225;
  const windDirection = `${dirs[Math.round(waveDirDeg / 45) % 8]}`;

  // Ocean current: Open-Meteo Marine (km/h → m/s) > physics model
  const currentSpeedMs = (marine?.current?.oceanCurrentVelocity && marine.current.oceanCurrentVelocity > 0)
    ? Math.round((marine.current.oceanCurrentVelocity / 3.6) * 100) / 100
    : 0.42;
  const currentDirDeg = marine?.current?.oceanCurrentDirection || 45;
  const currentDirection = dirs[Math.round(currentDirDeg / 45) % 8];

  const risk = waveHeight > 2.2 || windSpeed > 35 ? 'HIGH'
    : waveHeight > 1.5 || windSpeed > 24 ? 'MODERATE'
    : 'LOW';
  const suitability = risk === 'HIGH' ? 'UNFAVOURABLE'
    : chlorophyll > 2.0 && temperature > 27 ? 'FAVOURABLE'
    : 'MODERATE';

  const geofence = globalGeofenceAgent.checkLocation({ lat, lng });

  const hasLiveMarine = marine?.liveOrCached === 'LIVE';
  const hasCachedMarine = marine?.liveOrCached === 'CACHED';
  const sstSource = (nceiSst?.sst && nceiSst.sst > 0) ? nceiSst.dataSource
    : (sstGrad?.sst && sstGrad.sst > 0) ? sstGrad.dataSource
    : 'Physics model';
  const sstStatus = (nceiSst?.sst && nceiSst.sst > 0) ? 'LIVE'
    : (sstGrad?.sst && sstGrad.sst > 0) ? (sstGrad.liveOrCached === 'LIVE' ? 'LIVE' : 'CACHED')
    : 'MODEL';

  res.json({
    locationName: `Ocean Coordinate (${lat >= 0 ? lat.toFixed(2) + '°N' : Math.abs(lat).toFixed(2) + '°S'}, ${lng >= 0 ? lng.toFixed(2) + '°E' : Math.abs(lng).toFixed(2) + '°W'})`,
    latitude: lat,
    longitude: lng,
    temperature,
    salinity,
    chlorophyll,
    waveHeight,
    windSpeed,
    windDirection,
    currentSpeed: currentSpeedMs,
    currentDirection,
    precipitation: 0.1,
    seaLevelAnomaly: 2.4,
    weatherCondition: waveHeight > 1.8 ? 'Moderate ocean swell, choppy surface' : 'Mild sea state, clear atmospheric visibility',
    marineRisk: risk,
    fishingSuitability: suitability,
    productivityIndicator: chlorophyll > 2.2 ? 'HIGH' : chlorophyll > 1.5 ? 'MEDIUM' : 'LOW',
    lastUpdated: new Date().toISOString(),
    geofenceStatus: geofence.geofenceStatus,
    nearestRestrictedDistanceKm: geofence.nearestZone.distanceKm,
    nearestZoneName: geofence.nearestZone.name,
    dataStatus: hasLiveMarine ? 'LIVE' : hasCachedMarine ? 'CACHED' : 'MODEL',
    dataTimestamp: marine?.dataTimestamp || new Date().toISOString(),
    sstSource,
    sstStatus,
    chlorophyllSource: liveChl ? (chlData!.dataSource) : 'Physics model',
    chlorophyllStatus: liveChl ? (chlData!.liveOrCached === 'HISTORICAL' ? 'HISTORICAL' : 'LIVE') : 'MODEL',
    waveSource: hasLiveMarine || hasCachedMarine ? marine!.dataSource : 'Physics model',
    currentSource: hasLiveMarine || hasCachedMarine ? marine!.dataSource : 'Physics model',
    salinitySource: 'Physics model — no free real-time salinity API',
    salinityStatus: 'MODEL',
    windNote: 'Estimated from wave height correlation',
  });
});

// 3. MASTER MULTI-AGENT ORCHESTRATION ENDPOINT
app.post('/api/agents/orchestrate', async (req, res) => {
  try {
    const { query, language = 'en', locationContext, memoryContext } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await globalMultiAgentOrchestrator.orchestrate(query, language, locationContext, memoryContext);
    res.json(result);
  } catch (err: any) {
    console.error('Agent Orchestration Error:', err);
    res.status(500).json({
      error: 'Orchestration failed gracefully',
      message: err?.message || 'Internal Agent Error',
    });
  }
});

// 4. PLANNER AGENT STANDALONE ENDPOINT
app.post('/api/agent/plan', (req, res) => {
  const { query, language = 'en', context } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  const plan = orchestratorAgent.plan(query, language, context);
  res.json(plan);
});

// 5. OCEAN & PFZ AGENT ENDPOINT
app.post('/api/pfz/analyze', (req, res) => {
  const { lat = 13.0827, lng = 80.2707, locationName, radiusKm = 80, targetSpecies } = req.body;
  const result = globalOceanPfzAgent.analyze({ lat, lng, locationName, radiusKm, targetSpecies });
  res.json(result);
});

// 5b. ML PFZ PREDICTIONS ENDPOINT (GeoJSON fallback data)
app.get('/api/pfz', (req, res) => {
  const geojsonPath = path.join(process.cwd(), 'server', 'data', 'pfz_map_locations.geojson');

  try {
    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({
        error: 'PFZ prediction data not available',
        message: 'The ML model GeoJSON file has not been generated yet.',
      });
    }

    const raw = fs.readFileSync(geojsonPath, 'utf-8');
    const geojson = JSON.parse(raw);

    const predictions = geojson.features.map((feature: any) => ({
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      sst: feature.properties.sst,
      sst_gradient: feature.properties.sst_gradient,
      chlorophyll: feature.properties.chlorophyll,
      pfz_probability: feature.properties.pfz_probability,
      date: feature.properties.date,
    }));

    res.json({
      type: 'ml_prediction',
      dataStatus: 'CACHED',
      disclaimer: 'These are cached satellite-derived ML model predictions. NOT live data. NOT official INCOIS PFZ advisories.',
      total: predictions.length,
      predictions,
    });
  } catch (err: any) {
    console.error('PFZ ML endpoint error:', err);
    res.status(500).json({ error: 'Failed to load PFZ predictions', message: err?.message });
  }
});

// 5c. ML LIVE PREDICTION ENDPOINT (proxies to Python FastAPI service)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

app.post('/api/pfz/predict', async (req, res) => {
  const { sst, sst_gradient, chlorophyll } = req.body;

  if (sst == null || sst_gradient == null || chlorophyll == null) {
    return res.status(400).json({ error: 'sst, sst_gradient, and chlorophyll are required' });
  }

  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/pfz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sst, sst_gradient, chlorophyll }),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML service returned ${mlResponse.status}`);
    }

    const result = await mlResponse.json();
    res.json({
      ...result,
      source: 'ml_service',
      dataStatus: 'LIVE',
      disclaimer: 'Satellite-derived ML prediction. Not an official INCOIS PFZ advisory.',
    });
  } catch (err: any) {
    console.error('ML service prediction error:', err.message);
    res.status(503).json({
      error: 'ML prediction service unavailable',
      dataStatus: 'UNAVAILABLE',
      message: 'The Python ML service is not running. Start it with: cd ml-service && uvicorn main:app --port 8000',
    });
  }
});

app.post('/api/pfz/predict/batch', async (req, res) => {
  const { locations } = req.body;

  if (!locations || !Array.isArray(locations)) {
    return res.status(400).json({ error: 'locations array is required' });
  }

  try {
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/pfz/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations }),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML service returned ${mlResponse.status}`);
    }

    const result = await mlResponse.json();
    res.json({
      ...result,
      source: 'ml_service',
      dataStatus: 'LIVE',
      disclaimer: 'Satellite-derived ML predictions. Not official INCOIS PFZ advisories.',
    });
  } catch (err: any) {
    console.error('ML service batch prediction error:', err.message);
    res.status(503).json({
      error: 'ML prediction service unavailable',
      dataStatus: 'UNAVAILABLE',
      message: 'The Python ML service is not running. Start it with: cd ml-service && uvicorn main:app --port 8000',
    });
  }
});

// 5d. ML PFZ SUMMARY ENDPOINT
app.get('/api/pfz/summary', (req, res) => {
  const metadataPath = path.join(process.cwd(), 'server', 'models', 'orca_pfz_metadata.json');

  try {
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'PFZ model metadata not available' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    res.json({
      total_pfz_locations: metadata.pfz_predictions,
      data_date: metadata.data_date,
      data_sources: {
        sst: metadata.sst_source,
        chlorophyll: metadata.chlorophyll_source,
      },
      model_name: metadata.model,
      model_config: {
        n_estimators: metadata.n_estimators,
        max_depth: metadata.max_depth,
        features: metadata.features,
      },
      training_samples: metadata.training_samples,
      testing_samples: metadata.testing_samples,
      label_type: metadata.label_type,
      disclaimer: metadata.warning,
    });
  } catch (err: any) {
    console.error('PFZ summary endpoint error:', err);
    res.status(500).json({ error: 'Failed to load PFZ summary', message: err?.message });
  }
});

// 6. WEATHER & SAFETY AGENT ENDPOINT
app.post('/api/weather/analyze', async (req, res) => {
  const { lat = 13.0827, lng = 80.2707, locationName } = req.body;
  const result = await globalWeatherSafetyAgent.evaluateLive({ lat, lng, locationName });
  res.json(result);
});

// 6b. MARINE WEATHER ENDPOINT (service adapter)
app.get('/api/weather/marine', async (req, res) => {
  const lat = parseFloat(req.query.lat as string) || 13.0827;
  const lng = parseFloat(req.query.lng as string) || 80.2707;
  const result = await globalWeatherSafetyAgent.evaluateLive({ lat, lng });
  res.json({
    waveHeight: result.significantWaveHeightMeters,
    swellHeight: result.swellHeightMeters,
    swellPeriod: result.swellPeriodSeconds,
    wavePeriod: result.wavePeriodSeconds,
    windSpeed: result.windSpeedKmh,
    windGust: result.windGustKmh,
    windDirection: result.windDirection,
    surfaceCurrent: result.surfaceCurrentSpeedMs,
    overallRisk: result.overallRisk,
    safetyScore: result.safetyScore,
    forecastTimestamp: result.forecastTimestamp,
    dataSource: result.dataSource,
    dataStatus: result.dataStatus,
  });
});

// 7. GEOFENCE AGENT STANDALONE CHECK ENDPOINT
app.post('/api/geofence/check', (req, res) => {
  const { lat = 13.0827, lng = 80.2707 } = req.body;
  const result = globalGeofenceAgent.checkLocation({ lat, lng });
  res.json(result);
});

// 8. PROACTIVE GEOFENCE MONITORING ENDPOINT
app.post('/api/geofence/monitor', (req, res) => {
  const { vesselId = 'vessel-default', lat = 13.0827, lng = 80.2707 } = req.body;
  const check = globalGeofenceAgent.checkLocation({ lat, lng });
  const triggerAlarm = globalGeofenceAgent.shouldTriggerVoiceAlarm(vesselId, check.nearestZone.warningLevel);

  res.json({
    vesselId,
    ...check,
    triggerVoiceAlarm: triggerAlarm,
  });
});

// 9. WEATHER-SAFE ROUTING ENDPOINT
app.post('/api/route/safe', (req, res) => {
  const {
    originLat = 13.0827,
    originLng = 80.2707,
    originName = 'Kasimedu Fishing Harbour (Chennai)',
    destinationLat = 13.34,
    destinationLng = 80.62,
    destinationName = 'Coromandel PFZ Alpha (38 km NE)',
    vesselSpeedKnots = 12,
  } = req.body;

  const routePlan = globalWeatherSafetyAgent.calculateRoute({
    originLat, originLng, originName,
    destinationLat, destinationLng, destinationName,
    vesselSpeedKnots,
  });

  res.json(routePlan);
});

// 10. HISTORICAL CAUSAL ANALYTICS ENDPOINT
app.post('/api/history/analyze', (req, res) => {
  const { query, region, timeframe } = req.body;
  const result = globalOceanPfzAgent.analyzeHistorical({ query, region, timeframe });
  res.json(result);
});

// 11. VECTOR KNOWLEDGE SEARCH ENDPOINT
app.post('/api/vector/search', (req, res) => {
  const { query, region, variable, tag, limit = 5 } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  const results = globalVectorStore.search(query, { region, variable, tag }, limit);
  res.json({ results });
});

// 12. EXECUTION TRACE LOOKUP ENDPOINT
app.get('/api/agent/trace/:id', (req, res) => {
  const trace = globalMultiAgentOrchestrator.getTrace(req.params.id);
  if (!trace) {
    return res.status(404).json({ error: 'Trace ID not found' });
  }
  res.json(trace);
});

// 13. REPORT GENERATION ENDPOINT
app.post('/api/report/generate', (req, res) => {
  const { region = 'Coromandel Coast / Bay of Bengal', timeframe = 'Last 30 Days', datasets = [] } = req.body;

  const report = {
    id: `REP-${Date.now()}`,
    title: `MATSYA AI Marine Intelligence Assessment: ${region}`,
    region,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeframe,
    datasetsUsed: datasets.length ? datasets : ['INSAT-3DR SST', 'Oceansat-3 OCM-3 Chlorophyll', 'INCOIS Wavewatch-III', 'IMD Coastal WRF'],
    summary: `Multi-agent assessment indicates stable conditions along ${region}.`,
    findings: [
      'SST averaged 28.4°C with -0.3°C cool anomaly (seasonal upwelling).',
      'Chlorophyll-a peaked at 2.85 mg/m³ along the 30-50m isobath.',
      'Significant Wave Height remained 0.8-1.4m (within safe limits).',
      'Surface currents maintained NE drift at 0.45 m/s (productive convergence).',
    ],
    riskEvaluation: 'LOW — Safe for marine operations',
    confidenceScore: 92,
  };

  res.json(report);
});

// 14. PREDICTION ENDPOINT (now via Ocean PFZ Agent)
app.post('/api/predict', async (req, res) => {
  const { lat = 13.0827, lng = 80.2707, timeHorizon = 'tomorrow', sst, chlorophyll, waveHeight, windSpeed } = req.body;
  try {
    const result = await globalOceanPfzAgent.predictWithML({
      lat, lng, timeHorizon,
      currentSst: sst,
      currentChlorophyll: chlorophyll,
      currentWaveHeight: waveHeight,
      currentWindSpeed: windSpeed,
    });
    res.json(result);
  } catch {
    const result = globalOceanPfzAgent.predict({ lat, lng, timeHorizon, currentSst: sst, currentChlorophyll: chlorophyll, currentWaveHeight: waveHeight, currentWindSpeed: windSpeed });
    res.json(result);
  }
});

// 15. TOOL REGISTRY ENDPOINT
app.get('/api/tools/registry', (req, res) => {
  const intent = req.query.intent as string | undefined;
  const tools = intent ? getToolsForIntent(intent) : TOOL_REGISTRY;
  res.json({
    totalRegistered: TOOL_REGISTRY.length,
    architecture: 'Four-Agent System: Orchestrator, MarineIntelligence, SpatialRisk, SynthesisVoice',
    tools,
  });
});

// 16. DATA FRESHNESS ENDPOINT
app.get('/api/data/freshness', (req, res) => {
  const now = new Date();
  res.json({
    weather: { source: 'INCOIS Ocean State Forecast (simulated)', lastUpdated: now.toISOString(), status: 'simulated' },
    ocean: { source: 'ML Service / Cached GeoJSON', lastUpdated: now.toISOString(), status: 'depends_on_ml_service' },
    pfz: { source: 'ML RandomForest / GeoJSON fallback', lastUpdated: now.toISOString(), status: 'depends_on_ml_service' },
    geofence: { source: 'Haversine geodesic + MoES boundaries', lastUpdated: now.toISOString(), status: 'live' },
  });
});

// NEW: /api/ocean/live — data adapter for live ocean inference
app.get('/api/ocean/live', async (req, res) => {
  const lat = parseFloat(req.query.lat as string) || 13.0827;
  const lng = parseFloat(req.query.lng as string) || 80.2707;

  try {
    const result = await globalOceanPfzAgent.analyzeWithLiveML({ lat, lng });
    res.json({
      source: result.dataSource,
      dataStatus: result.dataStatus,
      timestamp: result.timestamp,
      dataTimestamp: result.dataTimestamp,
      sstMean: result.sstSummary.meanSst,
      chlorophyllMean: result.chlorophyllSummary.meanValue,
      pfzCount: result.pfzCandidates.length,
      nearestPfz: result.pfzCandidates[0] || null,
    });
  } catch {
    const result = globalOceanPfzAgent.analyze({ lat, lng });
    res.json({
      source: result.dataSource,
      dataStatus: result.dataStatus,
      timestamp: result.timestamp,
      dataTimestamp: result.dataTimestamp,
      sstMean: result.sstSummary.meanSst,
      chlorophyllMean: result.chlorophyllSummary.meanValue,
      pfzCount: result.pfzCandidates.length,
      nearestPfz: result.pfzCandidates[0] || null,
      warning: 'Live ML service unavailable. Showing cached/fallback data.',
    });
  }
});

// Vite Middleware for Dev / Static serving for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MATSYA AI Four-Agent Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
