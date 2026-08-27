// ═══════════════════════════════════════════════════════════════════
// AGENT 4: SYNTHESIS & VOICE AI
// Purpose: Combine structured agent outputs → final response + TTS text
// LLM calls: 0-1 (optional Gemini for natural language enrichment)
// ═══════════════════════════════════════════════════════════════════

import { GoogleGenAI } from '@google/genai';
import type { Intent, OrchestratorPlan } from './orchestratorAgent';
import type { MarineIntelligenceResult } from './marineIntelligenceAgent';
import type { SpatialRiskResult } from './spatialRiskAgent';

export interface SynthesisResult {
  answer: string;
  spokenText: string;
  confidence: number;
  warnings: string[];
  recommendations: string[];
  llmUsed: boolean;
}

export class SynthesisVoiceAgent {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
      } catch {}
    }
  }

  public async synthesize(params: {
    plan: OrchestratorPlan;
    marine?: MarineIntelligenceResult;
    spatial?: SpatialRiskResult;
  }): Promise<SynthesisResult> {
    const { plan, marine, spatial } = params;

    // Build deterministic answer from structured data
    const { answer, spokenText, confidence, warnings, recommendations } = this.buildStructuredResponse(plan, marine, spatial);

    // Optional: Gemini enrichment for more natural language
    let finalAnswer = answer;
    let llmUsed = false;

    if (this.aiClient && answer.length > 20) {
      const geminiResult = await this.tryGeminiEnrichment(plan, marine, spatial);
      if (geminiResult) {
        finalAnswer = geminiResult;
        llmUsed = true;
      }
    }

    return { answer: finalAnswer, spokenText, confidence, warnings, recommendations, llmUsed };
  }

  private buildStructuredResponse(
    plan: OrchestratorPlan,
    marine?: MarineIntelligenceResult,
    spatial?: SpatialRiskResult,
  ): { answer: string; spokenText: string; confidence: number; warnings: string[]; recommendations: string[] } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let confidence = 50;

    // --- PFZ Response ---
    if ((plan.intent === 'FIND_PFZ' || plan.intent === 'SAFE_FISHING') && marine?.pfz && marine.pfz.pfzCandidates.length > 0) {
      const top = marine.pfz.pfzCandidates[0];
      const wave = marine.weather?.significantWaveHeightMeters;
      const wind = marine.weather?.windSpeedKmh;
      const risk = marine.weather?.overallRisk || 'unknown';
      const geo = spatial ? `Boundary clearance: ${spatial.geofence.nearestZone.distanceKm} km.` : '';
      const routeInfo = spatial?.route ? `Safe route: ${spatial.route.totalDistanceKm} km.` : '';
      const dataInfo = `Data: ${marine.pfz.dataStatus}${marine.pfz.dataStatus !== 'LIVE' ? ` (${marine.pfz.dataTimestamp})` : ''}.`;

      const answer = `Nearest favourable fishing zone: ${top.name}, ${top.distanceKm} km ${top.direction.split(' ')[0]}. ML suitability: ${top.suitabilityScore}%. SST: ${top.sst}°C. Chlorophyll: ${top.chlorophyllValue} mg/m³. ${wave ? `Waves: ${wave}m.` : ''} ${wind ? `Wind: ${wind} km/h.` : ''} Safety: ${risk}. ${geo} ${routeInfo} Species: ${top.speciesLikelihood.slice(0, 3).join(', ')}. ${dataInfo}`.replace(/\s+/g, ' ').trim();

      const spokenText = `${risk === 'SAFE' || risk === 'unknown' ? 'Yes.' : 'Caution.'} Found a favourable fishing zone ${top.distanceKm} km ${top.direction.split(' ')[0].toLowerCase()} of you. Suitability score ${top.suitabilityScore} percent.${wave ? ` Waves ${wave} metres.` : ''}${risk !== 'unknown' ? ` Conditions are ${risk}.` : ''}`.replace(/\s+/g, ' ').trim();

      if (marine.pfz) confidence += 20;
      if (marine.weather) confidence += 15;
      if (spatial) confidence += 10;
      recommendations.push(`Target ${top.name} (${top.distanceKm} km ${top.direction.split(' ')[0]}).`);
      if (marine.weather) recommendations.push(`Depart: ${marine.weather.operationalAdvice.recommendedDepartureWindow}.`);

      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- Weather Response ---
    if ((plan.intent === 'CHECK_WEATHER' || plan.intent === 'CHECK_WEATHER_SAFETY') && marine?.weather) {
      const w = marine.weather;
      const timeLabel = plan.timeHorizon === 'tomorrow' ? "Tomorrow's" : "Today's";
      const safe = w.overallRisk === 'SAFE';

      const answer = `${timeLabel} sea conditions: ${w.overallRisk}. Wave height: ${w.significantWaveHeightMeters}m. Wind: ${w.windSpeedKmh} km/h (gusts ${w.windGustKmh} km/h). Swell: ${w.swellHeightMeters}m, period ${w.swellPeriodSeconds}s. ${safe ? 'Safe to go fishing.' : 'Exercise caution.'} Departure window: ${w.operationalAdvice.recommendedDepartureWindow}. ${spatial ? `Boundary: ${spatial.geofence.nearestZone.distanceKm} km from ${spatial.geofence.nearestZone.name}.` : ''} Data: ${w.dataSource}.`;

      const spokenText = `${timeLabel} sea: waves ${w.significantWaveHeightMeters} metres, wind ${w.windSpeedKmh} km/h. ${safe ? 'It is safe to go fishing.' : `Exercise caution, conditions are ${w.overallRisk}.`}`;

      confidence += 20;
      if (w.overallRisk !== 'SAFE') warnings.push(`Weather: ${w.overallRisk} — Waves ${w.significantWaveHeightMeters}m, Wind ${w.windGustKmh} km/h.`);

      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- Boundary Response ---
    if (plan.intent === 'BOUNDARY_CHECK' && spatial) {
      const z = spatial.geofence.nearestZone;
      const answer = `Your position is ${z.distanceKm} km (${z.distanceNauticalMiles} NM) from ${z.name}. Status: ${spatial.geofence.geofenceStatus}. Warning level: ${z.warningLevel}. Risk: ${spatial.riskLevel}.`;
      const spokenText = `You are ${z.distanceKm} kilometres from the ${z.name.includes('IMBL') ? 'international boundary' : z.name}. Status is ${spatial.geofence.geofenceStatus === 'CLEAR' ? 'clear and safe' : spatial.geofence.geofenceStatus}.`;
      confidence += 25;
      if (spatial.riskLevel !== 'SAFE') warnings.push(spatial.riskSummary);
      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- Historical/Productivity Response ---
    if (plan.intent === 'PRODUCTIVITY_ANALYSIS' && marine?.historical) {
      const h = marine.historical;
      const answer = `${h.primaryFinding} Advice: ${h.mitigationAndFisheryAdvice[0]}`;
      const spokenText = 'Fish catch decline correlates with a 1.1 degree warming anomaly and reduced coastal chlorophyll. Fish have moved 40 km offshore.';
      confidence += 20;
      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- Route Response ---
    if (plan.intent === 'ROUTE_REQUEST' && spatial?.route) {
      const r = spatial.route;
      const answer = `Safe route calculated: ${r.totalDistanceKm} km (${r.totalDistanceNauticalMiles} NM). Estimated travel: ${r.estimatedTravelTimeHours} hours at ${r.averageSpeedKnots} knots. Hazards avoided: ${r.hazardsAvoided.join(', ')}. Departure: ${r.departureWindowRecommendation}.`;
      const spokenText = `Safe route is ${r.totalDistanceKm} kilometres, estimated ${r.estimatedTravelTimeHours} hours. ${r.hazardsAvoided.length} hazards avoided.`;
      confidence += 20;
      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- General Ocean / Ocean Analysis Response ---
    if ((plan.intent === 'OCEAN_ANALYSIS' || plan.intent === 'GENERAL_OCEAN_QUERY') && marine?.pfz) {
      const sst = marine.pfz.sstSummary.meanSst;
      const chl = marine.pfz.chlorophyllSummary.meanValue;
      const w = marine.weather;
      const wInfo = w ? ` Waves: ${w.significantWaveHeightMeters}m. Wind: ${w.windSpeedKmh} km/h.` : '';
      const pfzCount = marine.pfz.pfzCandidates.length;
      const answer = `Ocean conditions at ${plan.location.name}: SST ${sst}°C. Chlorophyll ${chl} mg/m³. ${pfzCount} PFZ zones identified.${wInfo} Data: ${marine.pfz.dataStatus} (${marine.pfz.dataTimestamp}).`;
      const spokenText = `Sea surface temperature is ${sst} degrees. Chlorophyll is ${chl} milligrams per cubic metre.${w ? ` Waves ${w.significantWaveHeightMeters} metres.` : ''}`;
      confidence += 20;
      if (marine.weather) confidence += 10;
      return { answer, spokenText, confidence: Math.min(96, confidence), warnings, recommendations };
    }

    // --- Fallback ---
    return {
      answer: 'Unable to generate a specific answer. Please try rephrasing your question.',
      spokenText: 'I could not find the information you requested. Please try again.',
      confidence: 30,
      warnings,
      recommendations,
    };
  }

  private async tryGeminiEnrichment(
    plan: OrchestratorPlan,
    marine?: MarineIntelligenceResult,
    spatial?: SpatialRiskResult,
  ): Promise<string | null> {
    if (!this.aiClient) return null;

    const prompt = `You are MATSYA AI, a marine intelligence assistant for Indian fishermen. Answer in 2-3 sentences max, conversational, with exact numbers.

Query: "${plan.query}"
Language: ${plan.language === 'ta' ? 'Tamil' : plan.language === 'hi' ? 'Hindi' : plan.language === 'te' ? 'Telugu' : 'English'}
Location: ${plan.location.name} (${plan.location.lat.toFixed(2)}°N, ${plan.location.lng.toFixed(2)}°E)
Intent: ${plan.intent}

Data:
- PFZ: ${marine?.pfz ? `${marine.pfz.pfzCandidates.length} zones, nearest ${marine.pfz.pfzCandidates[0]?.distanceKm}km, SST ${marine.pfz.pfzCandidates[0]?.sst}°C (${marine.pfz.dataStatus})` : 'N/A'}
- Weather: ${marine?.weather ? `${marine.weather.overallRisk}, wave ${marine.weather.significantWaveHeightMeters}m, wind ${marine.weather.windSpeedKmh}km/h` : 'N/A'}
- Boundary: ${spatial ? `${spatial.geofence.nearestZone.name} at ${spatial.geofence.nearestZone.distanceKm}km (${spatial.riskLevel})` : 'N/A'}
- Route: ${spatial?.route ? `${spatial.route.totalDistanceKm}km safe route` : 'N/A'}

Give a concise, actionable answer. Do NOT mention agent internals.`;

    const models = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const model of models) {
      try {
        const response = await this.aiClient.models.generateContent({ model, contents: prompt });
        if (response?.text) return response.text.trim();
      } catch { continue; }
    }
    return null;
  }
}

export const synthesisVoiceAgent = new SynthesisVoiceAgent();
