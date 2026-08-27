// ═══════════════════════════════════════════════════════════════════
// MATSYA AI — Four-Agent Multi-Agent Orchestration System
// ═══════════════════════════════════════════════════════════════════
// 1. Orchestrator AI        — intent + routing (0 LLM calls)
// 2. Marine Intelligence AI — ocean + weather + ML (0 LLM calls)
// 3. Spatial & Risk AI      — geofence + routing (0 LLM calls)
// 4. Synthesis & Voice AI   — final NL response (0-1 LLM calls)
// ═══════════════════════════════════════════════════════════════════

import { orchestratorAgent, OrchestratorPlan, Intent } from './orchestratorAgent';
import { marineIntelligenceAgent, MarineIntelligenceResult } from './marineIntelligenceAgent';
import { spatialRiskAgent, SpatialRiskResult } from './spatialRiskAgent';
import { synthesisVoiceAgent } from './synthesisVoiceAgent';
import type { WeatherSafeRoutePlan } from './weatherSafetyAgent';

export interface DataProvenanceEntry {
  agent: string;
  source: string;
  freshness: 'LIVE' | 'CACHED' | 'FALLBACK' | 'SIMULATED' | 'HISTORICAL';
  retrievedAt: string;
}

export interface MultiAgentOrchestrationResponse {
  traceId: string;
  query: string;
  detectedLanguage: string;
  detectedIntent: string;
  answer: string;
  spokenText: string;
  confidence: number;
  steps: {
    agentName: string;
    displayName: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
    durationMs: number;
    summary: string;
  }[];
  evidence: {
    dataset: string;
    source: string;
    resolution: string;
    observation: string;
    timestamp: string;
  }[];
  pfzRecommendations?: any[];
  route?: WeatherSafeRoutePlan;
  riskAssessment?: {
    overallRisk: 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'DANGEROUS' | 'MODERATE' | 'CRITICAL';
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
  causalAnalytics?: any;
  prediction?: any;
  dataProvenance: DataProvenanceEntry[];
  dataFreshness: { weather: string; ocean: string; pfz: string; geofence: string };
  warnings: string[];
  recommendations: string[];
  suggestedFollowUps: string[];
  llmCallCount: number;
  generatedAt: string;
}

const executionTraces = new Map<string, MultiAgentOrchestrationResponse>();

export class MultiAgentOrchestrator {
  public async orchestrate(
    query: string,
    language: string = 'en',
    locationContext?: { lat: number; lng: number; name?: string },
    memoryContext?: any
  ): Promise<MultiAgentOrchestrationResponse> {
    const traceId = `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const steps: MultiAgentOrchestrationResponse['steps'] = [];
    const now = new Date();

    // ═══ AGENT 1: ORCHESTRATOR AI ═══
    const t0 = Date.now();
    const plan = orchestratorAgent.plan(query, language, locationContext);
    const planDuration = Date.now() - t0;

    steps.push({
      agentName: 'orchestrator',
      displayName: 'Orchestrator AI',
      status: 'COMPLETED',
      durationMs: planDuration + 1,
      summary: `Intent: ${plan.intent}. Agents: [${plan.requiredAgents.join(', ')}]. ML: ${plan.needsML}. Route: ${plan.needsRoute}.`,
    });

    const { lat, lng, name: locName } = plan.location;
    const needsMarine = plan.requiredAgents.includes('marineIntelligence');
    const needsSpatial = plan.requiredAgents.includes('spatialRisk');

    // ═══ AGENT 2: MARINE INTELLIGENCE AI ═══
    let marineResult: MarineIntelligenceResult | undefined;

    if (needsMarine) {
      const needsPfz = ['FIND_PFZ', 'SAFE_FISHING', 'ROUTE_REQUEST', 'OCEAN_ANALYSIS', 'GENERAL_OCEAN_QUERY'].includes(plan.intent);
      const needsWeather = ['CHECK_WEATHER', 'CHECK_WEATHER_SAFETY', 'SAFE_FISHING', 'ROUTE_REQUEST', 'GENERAL_OCEAN_QUERY'].includes(plan.intent);
      const needsHistorical = plan.intent === 'PRODUCTIVITY_ANALYSIS';

      marineResult = await marineIntelligenceAgent.analyze({
        lat, lng,
        locationName: locName,
        timeHorizon: plan.timeHorizon,
        needsPfz,
        needsWeather,
        needsML: plan.needsML,
        needsHistorical,
      });

      steps.push({
        agentName: 'marineIntelligence',
        displayName: 'Marine Intelligence & Prediction AI',
        status: 'COMPLETED',
        durationMs: marineResult.durationMs,
        summary: this.buildMarineSummary(marineResult),
      });
    }

    // ═══ AGENT 3: SPATIAL & RISK AI ═══
    let spatialResult: SpatialRiskResult | undefined;

    if (needsSpatial) {
      const t1 = Date.now();
      const dest = marineResult?.pfz?.pfzCandidates[0];

      spatialResult = spatialRiskAgent.analyze({
        lat, lng,
        needsRoute: plan.needsRoute,
        destinationLat: dest?.latitude,
        destinationLng: dest?.longitude,
        destinationName: dest?.name,
      });

      steps.push({
        agentName: 'spatialRisk',
        displayName: 'Spatial & Risk AI',
        status: 'COMPLETED',
        durationMs: spatialResult.durationMs,
        summary: `Risk: ${spatialResult.riskLevel}. ${spatialResult.geofence.nearestZone.name}: ${spatialResult.geofence.nearestZone.distanceKm} km.${spatialResult.route ? ` Route: ${spatialResult.route.totalDistanceKm} km.` : ''}`,
      });
    }

    // ═══ AGENT 4: SYNTHESIS & VOICE AI ═══
    const t2 = Date.now();
    const synthesis = await synthesisVoiceAgent.synthesize({ plan, marine: marineResult, spatial: spatialResult });

    steps.push({
      agentName: 'synthesisVoice',
      displayName: 'Synthesis & Voice AI',
      status: 'COMPLETED',
      durationMs: Date.now() - t2,
      summary: `Generated response. LLM: ${synthesis.llmUsed ? 'yes (1 call)' : 'no'}. Confidence: ${synthesis.confidence}%.`,
    });

    // ═══ BUILD RESPONSE ═══
    const evidence = this.buildEvidence(marineResult, spatialResult);
    const dataProvenance = this.buildProvenance(plan, marineResult, spatialResult);

    const riskAssessment = marineResult?.weather ? {
      overallRisk: marineResult.weather.overallRisk as any,
      score: marineResult.weather.safetyScore,
      factors: marineResult.weather.factors.map(f => ({ factor: f.factor, risk: f.value, weight: f.weightPercent })),
      advisory: marineResult.weather.spokenAdvisory.en,
    } : undefined;

    const geofenceStatus = spatialResult ? {
      status: spatialResult.geofence.geofenceStatus,
      nearestZoneName: spatialResult.geofence.nearestZone.name,
      distanceKm: spatialResult.geofence.nearestZone.distanceKm,
      distanceNauticalMiles: spatialResult.geofence.nearestZone.distanceNauticalMiles,
      warningLevel: spatialResult.geofence.nearestZone.warningLevel,
    } : undefined;

    const result: MultiAgentOrchestrationResponse = {
      traceId,
      query,
      detectedLanguage: plan.language,
      detectedIntent: plan.intent,
      answer: synthesis.answer,
      spokenText: synthesis.spokenText,
      confidence: synthesis.confidence,
      steps,
      evidence,
      pfzRecommendations: marineResult?.pfz?.pfzCandidates,
      route: spatialResult?.route,
      riskAssessment,
      geofenceStatus,
      causalAnalytics: marineResult?.historical,
      prediction: marineResult?.prediction,
      dataProvenance,
      dataFreshness: {
        weather: marineResult?.weather ? `${marineResult.weather.dataStatus} — ${marineResult.weather.timestamp}` : 'Not retrieved',
        ocean: marineResult?.pfz ? `${marineResult.pfz.dataStatus} — ${marineResult.pfz.dataTimestamp}` : 'Not retrieved',
        pfz: marineResult?.pfz ? `${marineResult.pfz.dataStatus} — ${marineResult.pfz.dataTimestamp}` : 'Not retrieved',
        geofence: spatialResult ? 'LIVE — geodesic calculation' : 'Not retrieved',
      },
      warnings: synthesis.warnings,
      recommendations: synthesis.recommendations,
      suggestedFollowUps: this.getSuggestedFollowUps(plan.intent),
      llmCallCount: synthesis.llmUsed ? 1 : 0,
      generatedAt: now.toISOString(),
    };

    executionTraces.set(traceId, result);
    return result;
  }

  private buildMarineSummary(marine: MarineIntelligenceResult): string {
    const parts: string[] = [];
    if (marine.pfz) parts.push(`PFZ: ${marine.pfz.pfzCandidates.length} zones (${marine.pfz.dataStatus})`);
    if (marine.weather) parts.push(`Weather: ${marine.weather.overallRisk}, wave ${marine.weather.significantWaveHeightMeters}m`);
    if (marine.historical) parts.push(`Historical: analyzed`);
    return parts.join('. ') || 'Analysis complete.';
  }

  private buildEvidence(marine?: MarineIntelligenceResult, spatial?: SpatialRiskResult): MultiAgentOrchestrationResponse['evidence'] {
    const evidence: MultiAgentOrchestrationResponse['evidence'] = [];

    if (marine?.pfz && marine.pfz.pfzCandidates[0]) {
      const top = marine.pfz.pfzCandidates[0];
      evidence.push({
        dataset: 'Sea Surface Temperature',
        source: marine.pfz.dataStatus === 'LIVE' ? 'ML Service + Live Ocean Data' : marine.pfz.dataSource,
        resolution: '0.25° grid',
        observation: `${top.sst}°C, ${top.oceanographicEvidence.thermalGradient}`,
        timestamp: marine.pfz.dataTimestamp,
      });
      evidence.push({
        dataset: 'Chlorophyll-a',
        source: marine.pfz.dataStatus === 'LIVE' ? 'PIFSC ESA-CCI / INCOIS ERDDAP' : marine.pfz.dataSource,
        resolution: '0.04° (~4 km)',
        observation: `${top.chlorophyllValue} mg/m³ — ${top.chlorophyllLevel}`,
        timestamp: marine.pfz.dataTimestamp,
      });
    }

    if (marine?.weather) {
      evidence.push({
        dataset: 'Marine Weather (Wave/Wind/Swell)',
        source: marine.weather.dataSource,
        resolution: '~5 km hourly',
        observation: `Wave ${marine.weather.significantWaveHeightMeters}m, Wind ${marine.weather.windSpeedKmh} km/h, Risk ${marine.weather.overallRisk}`,
        timestamp: marine.weather.timestamp,
      });
    }

    if (spatial) {
      evidence.push({
        dataset: 'Maritime Geofence (IMBL/MPA)',
        source: 'Haversine Geodesic + MoES Boundaries',
        resolution: 'Vector polyline (deterministic)',
        observation: `${spatial.geofence.nearestZone.distanceKm} km from ${spatial.geofence.nearestZone.name} (${spatial.riskLevel})`,
        timestamp: new Date().toISOString(),
      });
    }

    return evidence;
  }

  private buildProvenance(plan: OrchestratorPlan, marine?: MarineIntelligenceResult, spatial?: SpatialRiskResult): DataProvenanceEntry[] {
    const now = new Date().toISOString();
    const provenance: DataProvenanceEntry[] = [
      { agent: 'orchestrator', source: 'Rule-based Intent Classifier', freshness: 'LIVE', retrievedAt: now },
    ];

    if (marine?.dataSources) {
      for (const ds of marine.dataSources) {
        provenance.push({ agent: 'marineIntelligence', source: ds.source, freshness: ds.status as any, retrievedAt: now });
      }
    }

    if (spatial) {
      provenance.push({ agent: 'spatialRisk', source: 'Haversine Geodesic + MoES Boundaries', freshness: 'LIVE', retrievedAt: now });
    }

    return provenance;
  }

  private getSuggestedFollowUps(intent: Intent): string[] {
    const map: Record<string, string[]> = {
      FIND_PFZ: ['What is the weather tomorrow?', 'Show safe route to the PFZ', 'Am I near any restricted zone?'],
      CHECK_WEATHER: ['Where is the nearest fishing zone?', 'Am I near the boundary?', 'Can I go fishing?'],
      CHECK_WEATHER_SAFETY: ['Where can I fish today?', 'Show safe route', 'Am I near the boundary?'],
      SAFE_FISHING: ['What about the waves?', 'Am I near the boundary?', 'Show safe route'],
      BOUNDARY_CHECK: ['Where can I fish today?', 'What is the sea weather?', 'Show safe route'],
      ROUTE_REQUEST: ['What is the weather along the route?', 'Am I near the boundary?', 'Where is the nearest PFZ?'],
      OCEAN_ANALYSIS: ['Where can I fish?', 'What is the weather?', 'Show fishing zones'],
      PRODUCTIVITY_ANALYSIS: ['Where can I fish today?', 'What is the weather?', 'Show fishing zones'],
      GENERAL_OCEAN_QUERY: ['Where can I fish?', 'What is the weather?', 'Am I near the boundary?'],
    };
    return map[intent] || map.GENERAL_OCEAN_QUERY;
  }

  public getTrace(traceId: string): MultiAgentOrchestrationResponse | undefined {
    return executionTraces.get(traceId);
  }
}

export const globalMultiAgentOrchestrator = new MultiAgentOrchestrator();
