// ═══════════════════════════════════════════════════════════════════
// AGENT 2: MARINE INTELLIGENCE & PREDICTION AI
// Consolidates: SST, chlorophyll, PFZ detection, ML inference,
//               marine weather, ocean productivity, historical analysis
// LLM calls: 0 (all deterministic computation + ML model)
// ═══════════════════════════════════════════════════════════════════

import { globalOceanPfzAgent } from './oceanPfzAgent';
import { globalWeatherSafetyAgent } from './weatherSafetyAgent';
import type { OceanPfzAnalysisResult, HistoricalCausalReport, PredictionResult } from './oceanPfzAgent';
import type { WeatherSafetyAssessment } from './weatherSafetyAgent';

export interface MarineIntelligenceResult {
  pfz?: OceanPfzAnalysisResult;
  weather?: WeatherSafetyAssessment;
  historical?: HistoricalCausalReport;
  prediction?: PredictionResult;
  dataSources: { name: string; source: string; timestamp: string; status: 'LIVE' | 'CACHED' | 'FALLBACK' | 'SIMULATED' | 'HISTORICAL' }[];
  durationMs: number;
}

export class MarineIntelligenceAgent {
  public async analyze(params: {
    lat: number;
    lng: number;
    locationName?: string;
    timeHorizon?: string;
    needsPfz: boolean;
    needsWeather: boolean;
    needsML: boolean;
    needsHistorical: boolean;
  }): Promise<MarineIntelligenceResult> {
    const t0 = Date.now();
    const { lat, lng, locationName, timeHorizon, needsPfz, needsWeather, needsML, needsHistorical } = params;
    const dataSources: MarineIntelligenceResult['dataSources'] = [];

    let pfz: OceanPfzAnalysisResult | undefined;
    let weather: WeatherSafetyAssessment | undefined;
    let historical: HistoricalCausalReport | undefined;
    let prediction: PredictionResult | undefined;

    // --- PFZ / Ocean Analysis ---
    if (needsPfz) {
      try {
        pfz = await globalOceanPfzAgent.analyzeWithLiveML({ lat, lng, locationName });
      } catch {
        pfz = globalOceanPfzAgent.analyze({ lat, lng, locationName });
      }
      dataSources.push({
        name: 'Ocean/PFZ',
        source: pfz.dataSource === 'ml_live_inference' ? 'ML Service + Live Ocean Data' : pfz.dataSource,
        timestamp: pfz.dataTimestamp,
        status: pfz.dataStatus === 'LIVE' ? 'LIVE' : pfz.dataStatus === 'CACHED' ? 'CACHED' : 'FALLBACK',
      });

      // Prediction for future time horizons
      if (needsML && (timeHorizon === 'tomorrow' || timeHorizon === 'future')) {
        try {
          prediction = await globalOceanPfzAgent.predictWithML({
            lat, lng, timeHorizon,
            currentSst: pfz.sstSummary.meanSst,
            currentChlorophyll: pfz.chlorophyllSummary.meanValue,
          });
        } catch {
          prediction = globalOceanPfzAgent.predict({ lat, lng, timeHorizon });
        }
      }
    }

    // --- Marine Weather ---
    if (needsWeather) {
      try {
        weather = await globalWeatherSafetyAgent.evaluateLive({ lat, lng, locationName, timeHorizon });
      } catch {
        weather = globalWeatherSafetyAgent.evaluate({ lat, lng, locationName, timeHorizon });
      }
      dataSources.push({
        name: 'Marine Weather',
        source: weather.dataSource,
        timestamp: weather.timestamp,
        status: weather.dataStatus === 'LIVE' ? 'LIVE' : weather.dataStatus === 'CACHED' ? 'CACHED' : 'SIMULATED',
      });
    }

    // --- Historical Causal Analysis ---
    if (needsHistorical) {
      historical = globalOceanPfzAgent.analyzeHistorical({ query: params.locationName || '', region: locationName });
      dataSources.push({
        name: 'Historical Analysis',
        source: 'Vector Store + INCOIS Historical Records',
        timestamp: new Date().toISOString(),
        status: 'CACHED',
      });
    }

    return { pfz, weather, historical, prediction, dataSources, durationMs: Date.now() - t0 };
  }
}

export const marineIntelligenceAgent = new MarineIntelligenceAgent();
export type { OceanPfzAnalysisResult, HistoricalCausalReport, PredictionResult, WeatherSafetyAssessment };
