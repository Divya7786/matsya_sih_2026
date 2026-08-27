// ═══════════════════════════════════════════════════════════════════
// AGENT 3: SPATIAL & RISK AI
// Consolidates: Geofence, IMBL, MPA, restricted zones, route planning
// LLM calls: 0 (all deterministic: Haversine, point-in-polygon, A*)
// ═══════════════════════════════════════════════════════════════════

import { globalGeofenceAgent, calculateHaversineKm, calculateBearingDegrees, GEOFENCE_REGISTRY } from './geofenceAgent';
import { globalWeatherSafetyAgent } from './weatherSafetyAgent';
import type { GeofenceCheckResult } from './geofenceAgent';
import type { WeatherSafeRoutePlan } from './weatherSafetyAgent';

export interface SpatialRiskResult {
  geofence: GeofenceCheckResult;
  route?: WeatherSafeRoutePlan;
  riskLevel: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
  riskSummary: string;
  durationMs: number;
}

export class SpatialRiskAgent {
  public analyze(params: {
    lat: number;
    lng: number;
    needsRoute: boolean;
    destinationLat?: number;
    destinationLng?: number;
    destinationName?: string;
  }): SpatialRiskResult {
    const t0 = Date.now();
    const { lat, lng, needsRoute } = params;

    // --- Geofence Check (deterministic Haversine) ---
    const geofence = globalGeofenceAgent.checkLocation({ lat, lng });

    // --- Risk Level Classification ---
    let riskLevel: SpatialRiskResult['riskLevel'] = 'SAFE';
    const nearestDist = geofence.nearestZone.distanceKm;
    if (geofence.geofenceStatus === 'INSIDE_RESTRICTED_ZONE') {
      riskLevel = 'DANGER';
    } else if (nearestDist <= 5) {
      riskLevel = 'WARNING';
    } else if (nearestDist <= 10) {
      riskLevel = 'CAUTION';
    }

    // --- Route Planning (A* deterministic pathfinding) ---
    let route: WeatherSafeRoutePlan | undefined;
    if (needsRoute && params.destinationLat && params.destinationLng) {
      route = globalWeatherSafetyAgent.calculateRoute({
        originLat: lat,
        originLng: lng,
        originName: 'Current Position',
        destinationLat: params.destinationLat,
        destinationLng: params.destinationLng,
        destinationName: params.destinationName || 'Destination',
      });
    }

    const riskSummary = this.buildRiskSummary(geofence, riskLevel);

    return { geofence, route, riskLevel, riskSummary, durationMs: Date.now() - t0 };
  }

  private buildRiskSummary(geofence: GeofenceCheckResult, riskLevel: string): string {
    const z = geofence.nearestZone;
    if (riskLevel === 'DANGER') {
      return `DANGER: You are inside restricted zone (${z.name}). Leave immediately.`;
    }
    if (riskLevel === 'WARNING') {
      return `WARNING: ${z.distanceKm} km from ${z.name}. Maintain safe distance.`;
    }
    if (riskLevel === 'CAUTION') {
      return `CAUTION: ${z.distanceKm} km from ${z.name}. Monitor your position.`;
    }
    return `SAFE: ${z.distanceKm} km from nearest boundary (${z.name}).`;
  }
}

export const spatialRiskAgent = new SpatialRiskAgent();
export type { GeofenceCheckResult, WeatherSafeRoutePlan };
export { calculateHaversineKm, calculateBearingDegrees, GEOFENCE_REGISTRY };
