export type OceanVariable = 
  | 'seaIce'
  | 'temperature'
  | 'salinity'
  | 'chlorophyll'
  | 'currents'
  | 'waveHeight'
  | 'wind'
  | 'precipitation'
  | 'seaLevel'
  | 'marineWeather';

export interface MarineLocationData {
  locationName: string;
  latitude: number;
  longitude: number;
  temperature: number; // in °C
  salinity: number; // in PSU
  chlorophyll: number; // in mg/m³
  waveHeight: number; // in meters
  windSpeed: number; // in km/h
  windDirection: string;
  currentSpeed: number; // in m/s
  currentDirection: string;
  precipitation: number; // in mm/h
  seaLevelAnomaly: number; // in cm
  weatherCondition: string;
  marineRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  fishingSuitability: 'FAVOURABLE' | 'MODERATE' | 'UNFAVOURABLE' | 'RESTRICTED';
  productivityIndicator: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
  lastUpdated: string;
  geofenceStatus: 'CLEAR' | 'APPROACHING_BOUNDARY' | 'INSIDE_RESTRICTED_ZONE';
  nearestRestrictedDistanceKm?: number;
  nearestZoneName?: string;
}

export interface PFZZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  direction: string;
  suitabilityScore: number; // 0-100%
  confidenceScore: number; // 0-100%
  sst: number;
  chlorophyllLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  chlorophyllValue?: number;
  waveHeight: number;
  windSpeed: number;
  marineRisk: 'LOW' | 'MODERATE' | 'HIGH';
  speciesLikelihood: string[];
  reasoning: string;
  depthMeters: number;
  validUntil: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name?: string;
  distanceToNextKm?: number;
  bearing?: number;
  bearingDegrees?: number;
  waveRisk?: 'SAFE' | 'CAUTION' | 'DANGER';
  estimatedMinutes?: number;
}

export interface RoutePlan {
  id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  waypoints?: RouteWaypoint[];
  primaryRouteWaypoints?: RouteWaypoint[];
  alternativeWaypoints?: RouteWaypoint[];
  alternativeRouteWaypoints?: RouteWaypoint[];
  distanceKm?: number;
  totalDistanceKm?: number;
  totalDistanceNauticalMiles?: number;
  estimatedTravelTimeHours: number;
  averageSpeedKnots?: number;
  averageRiskScore?: number;
  riskScore?: number;
  hazardsAvoided: string[];
  recommendedBearing?: number;
  departureRecommendation?: string;
  departureWindowRecommendation?: string;
  routingAlgorithmUsed?: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'IMBL' | 'RESTRICTED_MILITARY' | 'MARINE_PROTECTED_AREA' | 'SHIPPING_LANE';
  coordinates: [number, number][]; // [lat, lng] pairs
  bufferDistanceKm: number;
  description: string;
  warningLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
}

export interface AgentExecutionStep {
  agentName: string;
  displayName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
  durationMs: number;
  summary: string;
  details?: Record<string, any>;
  confidence?: number;
}

export interface CausalEvidenceTier {
  category: 'OBSERVED_DATA' | 'CORRELATION' | 'POSSIBLE_CONTRIBUTING_FACTORS' | 'MODEL_AI_INTERPRETATION';
  title: string;
  badgeColor: string;
  items: {
    title: string;
    statement: string;
    metricValue?: string;
    confidencePercent: number;
    dataSource: string;
  }[];
}

export interface HistoricalCausalReport {
  id: string;
  query: string;
  targetRegion: string;
  timeframe: string;
  primaryFinding: string;
  evidenceTiers: CausalEvidenceTier[];
  spatialTemporalMetrics: {
    sstAnomalyMeanDegC: number;
    chlorophyllChangePercent: number;
    salinityShiftPsu: number;
    thermalFrontOffshoreMigrationKm: number;
    upwellingIndexTrend: string;
  };
  retrievedScientificLiterature: {
    title: string;
    source: string;
    relevanceScore: number;
    excerpt: string;
  }[];
  mitigationAndFisheryAdvice: string[];
  generatedAt: string;
}

export interface PredictionResult {
  predictedSuitability: 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number;
  confidenceLabel: string;
  expectedTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  timeHorizon: string;
  factors: { factor: string; value: string; trend: string; weight: number }[];
  methodology: string;
  dataTimestamp: string;
}

export interface AgentOrchestrationResult {
  traceId?: string;
  query: string;
  detectedLanguage: string;
  detectedIntent: string;
  answer: string;
  spokenText: string;
  voiceAudioBase64?: string;
  confidence: number;
  steps: AgentExecutionStep[];
  evidence: {
    dataset: string;
    source: string;
    resolution: string;
    observation: string;
    timestamp: string;
  }[];
  pfzRecommendations?: PFZZone[];
  route?: RoutePlan;
  riskAssessment?: {
    overallRisk: 'SAFE' | 'CAUTION' | 'MODERATE' | 'HIGH' | 'HIGH_RISK' | 'DANGEROUS' | 'CRITICAL';
    score: number;
    factors: { factor: string; risk: string; weight: number }[];
    advisory: string;
  };
  geofenceStatus?: {
    status: string;
    nearestZoneName: string;
    distanceKm: number;
    distanceNauticalMiles: number;
    warningLevel: string;
  };
  causalAnalytics?: HistoricalCausalReport;
  prediction?: PredictionResult;
  dataFreshness?: {
    weather: string;
    ocean: string;
    pfz: string;
    geofence: string;
  };
  warnings?: string[];
  recommendations?: string[];
  suggestedFollowUps: string[];
  generatedAt: string;
}

export interface MarineAdvisory {
  id: string;
  title: string;
  severity: 'WARNING' | 'ALERT' | 'INFO';
  category: 'CYCLONE' | 'HIGH_WAVES' | 'LIGHTNING' | 'GEOFENCE' | 'WEATHER';
  region: string;
  issuedAt: string;
  validThrough: string;
  message: string;
  spokenAudioText?: string;
  affectedCoordinates?: { lat: number; lng: number }[];
}

export interface MarineIntelligenceReport {
  id: string;
  title: string;
  region: string;
  date: string;
  timeframe: string;
  datasetsUsed: string[];
  summary: string;
  findings: string[];
  spatialTemporalInsights: string;
  sstAnomalyAvg: number;
  chlorophyllTrend: string;
  riskEvaluation: string;
  fisheriesImplication: string;
  confidenceScore: number;
  satelliteSensors: string[];
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}
