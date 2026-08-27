// ═══════════════════════════════════════════════════════════════════
// AGENT 1: ORCHESTRATOR AI
// Purpose: Intent classification, agent routing, execution coordination
// LLM calls: 0 (fully deterministic rule-based)
// ═══════════════════════════════════════════════════════════════════

export type Intent =
  | 'FIND_PFZ'
  | 'CHECK_WEATHER'
  | 'CHECK_WEATHER_SAFETY'
  | 'SAFE_FISHING'
  | 'BOUNDARY_CHECK'
  | 'ROUTE_REQUEST'
  | 'OCEAN_ANALYSIS'
  | 'PRODUCTIVITY_ANALYSIS'
  | 'GENERAL_OCEAN_QUERY';

export type AgentName = 'orchestrator' | 'marineIntelligence' | 'spatialRisk' | 'synthesisVoice';

export interface OrchestratorPlan {
  query: string;
  language: string;
  intent: Intent;
  requiredAgents: AgentName[];
  location: { lat: number; lng: number; name: string };
  timeHorizon: 'current' | 'today' | 'tomorrow' | 'future';
  needsML: boolean;
  needsRoute: boolean;
  reasoning: string;
}

export class OrchestratorAgent {
  public plan(query: string, language: string = 'en', context?: { lat?: number; lng?: number; name?: string }): OrchestratorPlan {
    const q = (query || '').toLowerCase();

    // --- LANGUAGE DETECTION ---
    const lang = this.detectLanguage(q, language);

    // --- TIME HORIZON ---
    const timeHorizon = this.extractTimeHorizon(q);

    // --- INTENT CLASSIFICATION (rule-based, no LLM) ---
    const intent = this.classifyIntent(q, timeHorizon);

    // --- LOCATION ---
    const location = this.extractLocation(q, context);

    // --- AGENT ROUTING (deterministic) ---
    const { requiredAgents, needsML, needsRoute } = this.routeAgents(intent);

    return {
      query,
      language: lang,
      intent,
      requiredAgents,
      location,
      timeHorizon,
      needsML,
      needsRoute,
      reasoning: `Intent '${intent}' → agents [${requiredAgents.join(', ')}]. Time: ${timeHorizon}. ML: ${needsML}. Route: ${needsRoute}. No LLM used.`,
    };
  }

  private detectLanguage(q: string, provided: string): string {
    if (provided && provided !== 'en') return provided;
    if (/[அ-ஹ]/.test(q)) return 'ta';
    if (/[ऀ-ॿ]/.test(q)) return 'hi';
    if (/[ఀ-౿]/.test(q)) return 'te';
    if (/[മ-ഹ]/.test(q)) return 'ml';
    if (/[ಕ-ಹ]/.test(q)) return 'kn';
    return 'en';
  }

  private extractTimeHorizon(q: string): OrchestratorPlan['timeHorizon'] {
    const tomorrowKW = ['tomorrow', 'நாளை', 'कल', 'రేపు', 'നാളെ', 'ನಾಳೆ', 'আগামীকাল'];
    const todayKW = ['today', 'இன்று', 'आज', 'ఈరోజు', 'ഇന്ന്', 'ಇಂದು', 'আজ'];
    const futureKW = ['next', 'upcoming', 'forecast', 'predict', 'week'];

    if (tomorrowKW.some(kw => q.includes(kw))) return 'tomorrow';
    if (todayKW.some(kw => q.includes(kw))) return 'today';
    if (futureKW.some(kw => q.includes(kw))) return 'future';
    return 'current';
  }

  private classifyIntent(q: string, timeHorizon: string): Intent {
    const weatherKW = ['weather', 'wave', 'storm', 'wind', 'swell', 'cyclone', 'rain', 'forecast', 'sea condition', 'sea state', 'tide', 'வானிலை', 'அலை', 'புயல்', 'காற்று', 'मौसम', 'लहर', 'तूफान', 'हवा', 'వాతావరణం', 'കാലാവസ്ഥ'];
    const safetyKW = ['safe', 'risk', 'danger', 'can i go', 'should i go', 'is it ok', 'பாதுகாப்ப', 'போகலாமா', 'सुरक्षित', 'జాగ్రత్త', 'സുരക്ഷിത'];
    const pfzKW = ['where', 'nearest', 'zone', 'pfz', 'fishing zone', 'fishing area', 'எங்கே', 'कहाँ', 'ఎక్కడ', 'എവിടെ'];
    const fishKW = ['fish', 'மீன்', 'मछली', 'చేప', 'മീൻ', 'ಮೀನು', 'মাছ'];
    const boundaryKW = ['imbl', 'border', 'boundary', 'geofence', 'sri lanka', 'restricted', 'எல்லை', 'सीमा'];
    const routeKW = ['route', 'path', 'navigate', 'waypoint', 'வழி', 'रास्ता', 'మార్గం'];
    const historyKW = ['why', 'decline', 'productivity', 'anomaly', 'trend', 'history', 'குறைவு', 'कम', 'కారణం'];

    const hasWeather = weatherKW.some(kw => q.includes(kw));
    const hasSafety = safetyKW.some(kw => q.includes(kw));
    const hasPfz = pfzKW.some(kw => q.includes(kw));
    const hasFish = fishKW.some(kw => q.includes(kw));
    const hasBoundary = boundaryKW.some(kw => q.includes(kw));
    const hasRoute = routeKW.some(kw => q.includes(kw));
    const hasHistory = historyKW.some(kw => q.includes(kw));

    // Priority-ordered classification
    if (hasHistory) return 'PRODUCTIVITY_ANALYSIS';
    if (hasBoundary) return 'BOUNDARY_CHECK';
    if (hasRoute) return 'ROUTE_REQUEST';
    if (hasPfz && hasSafety) return 'SAFE_FISHING';
    if (hasFish && hasSafety) return 'SAFE_FISHING';
    if (hasPfz || (hasFish && !hasWeather && !hasSafety)) return 'FIND_PFZ';
    if (hasWeather && hasSafety) return 'CHECK_WEATHER_SAFETY';
    if (hasWeather) return 'CHECK_WEATHER';
    if (hasSafety && hasFish) return 'CHECK_WEATHER_SAFETY';
    if (hasSafety) return 'CHECK_WEATHER_SAFETY';
    if (hasFish && timeHorizon !== 'current') return 'SAFE_FISHING';
    if (hasFish) return 'FIND_PFZ';
    return 'GENERAL_OCEAN_QUERY';
  }

  private extractLocation(q: string, context?: { lat?: number; lng?: number; name?: string }): OrchestratorPlan['location'] {
    if (q.includes('kerala') || q.includes('kochi') || q.includes('cochin')) {
      return { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala' };
    }
    if (q.includes('veraval') || q.includes('gujarat') || q.includes('saurashtra')) {
      return { lat: 20.89, lng: 70.38, name: 'Veraval, Gujarat' };
    }
    if (q.includes('visakhapatnam') || q.includes('vizag')) {
      return { lat: 17.68, lng: 83.35, name: 'Visakhapatnam, Andhra Pradesh' };
    }
    if (q.includes('mannar') || q.includes('rameswaram') || q.includes('palk')) {
      return { lat: 9.15, lng: 79.25, name: 'Gulf of Mannar' };
    }
    return {
      lat: context?.lat || 13.0827,
      lng: context?.lng || 80.2707,
      name: context?.name || 'Kasimedu Fishing Harbour, Chennai',
    };
  }

  private routeAgents(intent: Intent): { requiredAgents: AgentName[]; needsML: boolean; needsRoute: boolean } {
    switch (intent) {
      case 'FIND_PFZ':
        return { requiredAgents: ['marineIntelligence', 'synthesisVoice'], needsML: true, needsRoute: false };
      case 'CHECK_WEATHER':
        return { requiredAgents: ['marineIntelligence', 'synthesisVoice'], needsML: false, needsRoute: false };
      case 'CHECK_WEATHER_SAFETY':
        return { requiredAgents: ['marineIntelligence', 'spatialRisk', 'synthesisVoice'], needsML: false, needsRoute: false };
      case 'SAFE_FISHING':
        return { requiredAgents: ['marineIntelligence', 'spatialRisk', 'synthesisVoice'], needsML: true, needsRoute: true };
      case 'BOUNDARY_CHECK':
        return { requiredAgents: ['spatialRisk', 'synthesisVoice'], needsML: false, needsRoute: false };
      case 'ROUTE_REQUEST':
        return { requiredAgents: ['marineIntelligence', 'spatialRisk', 'synthesisVoice'], needsML: true, needsRoute: true };
      case 'OCEAN_ANALYSIS':
        return { requiredAgents: ['marineIntelligence', 'synthesisVoice'], needsML: false, needsRoute: false };
      case 'PRODUCTIVITY_ANALYSIS':
        return { requiredAgents: ['marineIntelligence', 'synthesisVoice'], needsML: false, needsRoute: false };
      case 'GENERAL_OCEAN_QUERY':
        return { requiredAgents: ['marineIntelligence', 'synthesisVoice'], needsML: false, needsRoute: false };
    }
  }
}

export const orchestratorAgent = new OrchestratorAgent();
