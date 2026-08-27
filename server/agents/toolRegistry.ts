export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  executionType: 'SYNC' | 'ASYNC' | 'ML_INFERENCE';
  dataSource: string;
  isLive: boolean;
  agent: string;
}

export const TOOL_REGISTRY: RegisteredTool[] = [
  {
    id: 'pfz_ml_predict',
    name: 'PFZ ML Prediction',
    description: 'Runs RandomForest binary classifier to predict Potential Fishing Zone probability from SST, SST gradient, and chlorophyll-a',
    inputSchema: { sst: 'number', sst_gradient: 'number', chlorophyll: 'number' },
    outputSchema: { pfz_probability: 'number', is_pfz: 'boolean', confidence: 'number' },
    executionType: 'ML_INFERENCE',
    dataSource: 'FastAPI ML Service (sklearn RandomForestClassifier)',
    isLive: true,
    agent: 'oceanIntelligence',
  },
  {
    id: 'pfz_batch_predict',
    name: 'PFZ Batch ML Prediction',
    description: 'Batch ML inference across a grid to discover multiple PFZ candidates',
    inputSchema: { locations: 'Array<{sst, sst_gradient, chlorophyll}>' },
    outputSchema: { predictions: 'Array<{pfz_probability, is_pfz, lat, lng}>' },
    executionType: 'ML_INFERENCE',
    dataSource: 'FastAPI ML Service /predict/pfz/batch',
    isLive: true,
    agent: 'oceanIntelligence',
  },
  {
    id: 'ocean_historical_analysis',
    name: 'Historical Causal Analysis',
    description: 'Multi-temporal anomaly decomposition with vector store RAG retrieval',
    inputSchema: { query: 'string', region: 'string?' },
    outputSchema: { primaryFinding: 'string', evidenceTiers: 'Tier[]' },
    executionType: 'SYNC',
    dataSource: 'Vector Store + INCOIS records',
    isLive: true,
    agent: 'oceanIntelligence',
  },
  {
    id: 'weather_safety_eval',
    name: 'Weather Safety Evaluation',
    description: 'Evaluates marine safety from wave height, wind speed, swell, and current',
    inputSchema: { lat: 'number', lng: 'number', timeHorizon: 'string?' },
    outputSchema: { overallRisk: 'SAFE|CAUTION|HIGH_RISK|DANGEROUS', safetyScore: 'number', factors: 'Factor[]' },
    executionType: 'SYNC',
    dataSource: 'INCOIS Ocean State Forecast (simulated)',
    isLive: false,
    agent: 'weatherNavigation',
  },
  {
    id: 'weather_safe_routing',
    name: 'Weather-Safe Route Planning',
    description: 'A* pathfinding avoiding wave hazards, geofence boundaries, and shipping lanes',
    inputSchema: { originLat: 'number', originLng: 'number', destLat: 'number', destLng: 'number' },
    outputSchema: { waypoints: 'Waypoint[]', distanceKm: 'number', hazardsAvoided: 'string[]' },
    executionType: 'SYNC',
    dataSource: 'A* algorithm over weighted marine grid',
    isLive: true,
    agent: 'weatherNavigation',
  },
  {
    id: 'geofence_check',
    name: 'Geofence Boundary Check',
    description: 'Haversine geodesic distance from vessel to all known restricted zones (IMBL, MPA, Military)',
    inputSchema: { lat: 'number', lng: 'number' },
    outputSchema: { status: 'CLEAR|APPROACHING|VIOLATED', nearestZone: 'Zone', distanceKm: 'number' },
    executionType: 'SYNC',
    dataSource: 'MoES / Indian Coast Guard boundary polygons',
    isLive: true,
    agent: 'maritimeSafety',
  },
  {
    id: 'gemini_synthesis',
    name: 'Gemini LLM Synthesis',
    description: 'Google Gemini AI for natural language synthesis and multilingual explanation',
    inputSchema: { prompt: 'string' },
    outputSchema: { text: 'string' },
    executionType: 'ASYNC',
    dataSource: 'Google Gemini Flash',
    isLive: true,
    agent: 'plannerDecision',
  },
  {
    id: 'voice_stt',
    name: 'Speech-to-Text (STT)',
    description: 'Browser Web Speech API for voice input in Indian languages',
    inputSchema: { audioStream: 'MediaStream', languageCode: 'string' },
    outputSchema: { transcript: 'string', isFinal: 'boolean' },
    executionType: 'ASYNC',
    dataSource: 'Web Speech API (browser-native)',
    isLive: true,
    agent: 'plannerDecision',
  },
  {
    id: 'voice_tts',
    name: 'Text-to-Speech (TTS)',
    description: 'Browser SpeechSynthesis for spoken final response delivery',
    inputSchema: { text: 'string', languageCode: 'string' },
    outputSchema: { audioPlayed: 'boolean' },
    executionType: 'ASYNC',
    dataSource: 'Web Speech Synthesis API (browser-native)',
    isLive: true,
    agent: 'plannerDecision',
  },
];

export function getToolsForIntent(intent: string): RegisteredTool[] {
  const intentToolMap: Record<string, string[]> = {
    FIND_PFZ: ['pfz_ml_predict', 'pfz_batch_predict', 'weather_safety_eval', 'weather_safe_routing', 'geofence_check', 'gemini_synthesis', 'voice_tts'],
    CHECK_WEATHER_SAFETY: ['weather_safety_eval', 'geofence_check', 'gemini_synthesis', 'voice_tts'],
    GEOFENCE_BOUNDARY_VERIFICATION: ['geofence_check', 'gemini_synthesis', 'voice_tts'],
    NAVIGATE_SAFE_ROUTE: ['weather_safety_eval', 'geofence_check', 'weather_safe_routing', 'gemini_synthesis', 'voice_tts'],
    HISTORICAL_CAUSAL_ANALYSIS: ['ocean_historical_analysis', 'gemini_synthesis', 'voice_tts'],
    PREDICT_FUTURE_CONDITIONS: ['pfz_ml_predict', 'weather_safety_eval', 'gemini_synthesis', 'voice_tts'],
    COMPREHENSIVE_OCEAN_INTELLIGENCE: ['pfz_ml_predict', 'pfz_batch_predict', 'weather_safety_eval', 'geofence_check', 'weather_safe_routing', 'ocean_historical_analysis', 'gemini_synthesis', 'voice_tts'],
  };

  const toolIds = intentToolMap[intent] || intentToolMap['COMPREHENSIVE_OCEAN_INTELLIGENCE'];
  return TOOL_REGISTRY.filter(t => toolIds.includes(t.id));
}

export function getToolById(id: string): RegisteredTool | undefined {
  return TOOL_REGISTRY.find(t => t.id === id);
}
