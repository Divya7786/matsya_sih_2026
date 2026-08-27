import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Waves,
  Wind,
  Thermometer,
  Navigation,
  Fish,
  LocateFixed,
  Sparkles,
  Square,
  Radio,
  CheckCircle2,
  PhoneCall,
  Anchor,
} from 'lucide-react';
import { PFZZone, RoutePlan, AgentOrchestrationResult } from '../types/marine';
import { MOCK_PFZ_ZONES, MOCK_SAMPLE_ROUTES, SUPPORTED_LANGUAGES } from '../data/mockMarineData';
import { TacticalMap } from '../components/TacticalMap';
import { MarineVoiceService } from '../services/voice';
import { runAgentOrchestration } from '../services/api';
import { GeoPosition, requestPosition, getFallbackPosition, formatLocationName } from '../services/geolocation';
import { NavigationPanel } from '../components/NavigationPanel';
import { TripRecord } from '../services/tripHistory';

interface FishermanViewProps {
  onOpenGlobalExplorer?: () => void;
}

export type FishermanTaskState =
  | 'IDLE'
  | 'LISTENING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'SYNTHESIZING'
  | 'SPEAKING'
  | 'COMPLETED';

export const FishermanView: React.FC<FishermanViewProps> = ({ onOpenGlobalExplorer }) => {
  // ── All original state preserved ──────────────────────────────────────────
  const [selectedLang, setSelectedLang] = useState<string>('ta');
  const [taskState, setTaskState] = useState<FishermanTaskState>('IDLE');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [selectedPFZ, setSelectedPFZ] = useState<PFZZone>(MOCK_PFZ_ZONES[0]);
  const [activeRoute, setActiveRoute] = useState<RoutePlan>(MOCK_SAMPLE_ROUTES.chennai_to_pfz1);
  const [lastAnswer, setLastAnswer] = useState<string>(
    'வணக்கம்! இன்றைய கடல் நிலை பாதுகாப்பானது (அலை 0.8 மீ). 38 கி.மீ வடகிழக்கில் அதிக மீன் வளம் உள்ள மண்டலம் (PFZ) கண்டறியப்பட்டுள்ளது.'
  );
  const [livePfzZones, setLivePfzZones] = useState<PFZZone[]>([]);
  const [liveRisk, setLiveRisk] = useState<AgentOrchestrationResult['riskAssessment'] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [geoPos, setGeoPos] = useState<GeoPosition>(() => ({ ...getFallbackPosition(), status: 'loading' }));
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastTrip, setLastTrip] = useState<TripRecord | null>(null);

  const currentTaskIdRef = useRef<string | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  // ── GPS: initial fix + continuous watchPosition ────────────────────────────
  useEffect(() => {
    requestPosition().then(setGeoPos);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGeoPos({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            status: 'success',
            isLive: true,
          });
        },
        (err) => {
          console.warn('[FishermanView] watchPosition error:', err.code, err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
    };
  }, []);

  const retryGps = () => {
    setGeoPos((prev) => ({ ...prev, status: 'loading' }));
    requestPosition().then(setGeoPos);
  };

  // ── Quick queries per language ─────────────────────────────────────────────
  const localQuickQueries: Record<string, string[]> = {
    ta: [
      'இன்று கடலுக்கு செல்வது பாதுகாப்பானதா?',
      'அருகிலுள்ள மீன்பிடி மண்டலம் எங்கே?',
      'இன்றைய அலை உயரம் என்ன?',
      'எல்லைக்கோடு எவ்வளவு தூரம்?',
    ],
    hi: [
      'क्या आज समुद्र में जाना सुरक्षित है?',
      'निकटतम PFZ कहाँ है?',
      'आज लहरों की ऊँचाई क्या है?',
      'प्रतिबंधित सीमा कितनी दूर है?',
    ],
    te: [
      'ఈరోజు సముద్రం సురక్షితమేనా?',
      'సమీప PFZ ఎక్కడ ఉంది?',
      'ఈరోజు అలల ఎత్తు ఎంత?',
    ],
    en: [
      'Is it safe to go to sea today?',
      'Where is the nearest fishing zone?',
      'Wave heights and wind speed?',
      'Distance to maritime boundary?',
    ],
  };

  // ── All original handlers preserved ───────────────────────────────────────
  const startFishermanTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isExecutingRef.current) return;

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    isExecutingRef.current = true;

    MarineVoiceService.stopAll();

    try {
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 120));
      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('EXECUTING');
      setIsMapLoading(true);
      const result = await runAgentOrchestration(cleanQuery, selectedLang, {
        lat: geoPos.latitude,
        lng: geoPos.longitude,
        name: formatLocationName(geoPos),
      });

      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('SYNTHESIZING');
      setLastAnswer(result.answer);
      setIsMapLoading(false);

      if (result.pfzRecommendations && result.pfzRecommendations.length > 0) {
        setLivePfzZones(result.pfzRecommendations);
        setSelectedPFZ(result.pfzRecommendations[0]);
      }
      if (result.riskAssessment) {
        setLiveRisk(result.riskAssessment);
      }

      await new Promise((r) => setTimeout(r, 120));
      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('SPEAKING');
      const textToSpeak = result.spokenText || result.answer;
      MarineVoiceService.speak(textToSpeak, selectedLang, newTaskId, () => {
        if (currentTaskIdRef.current === newTaskId) {
          setTaskState('COMPLETED');
          isExecutingRef.current = false;
          setTimeout(() => {
            if (currentTaskIdRef.current === newTaskId) setTaskState('IDLE');
          }, 600);
        }
      });
    } catch (err) {
      console.error('[FishermanView] Task execution failed:', err);
      isExecutingRef.current = false;
      setIsMapLoading(false);
      setTaskState('IDLE');
    }
  };

  const handleVoiceToggle = () => {
    if (taskState === 'LISTENING') {
      MarineVoiceService.stopListening();
      if (voiceQuery.trim()) {
        startFishermanTask(voiceQuery);
      } else {
        setTaskState('IDLE');
      }
    } else {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
      setVoiceQuery('');
      setTaskState('LISTENING');
      MarineVoiceService.playBeep(600, 100);

      const started = MarineVoiceService.startListening(
        selectedLang,
        (text, isFinal) => {
          setVoiceQuery(text);
          if (isFinal && text.trim()) {
            MarineVoiceService.stopListening();
            startFishermanTask(text.trim());
          }
        },
        (err) => {
          console.warn('[FishermanView] Recognition error:', err);
          setTaskState('IDLE');
        },
        () => {
          setTaskState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
        }
      );

      if (!started) setTaskState('IDLE');
    }
  };

  const handleStopSpeaking = () => {
    MarineVoiceService.stopSpeaking();
    isExecutingRef.current = false;
    setTaskState('IDLE');
  };

  const handleStartNavigation = () => setIsNavigating(true);

  const handleEndTrip = (trip: TripRecord) => {
    setLastTrip(trip);
    setIsNavigating(false);
    const msg =
      selectedLang === 'ta'
        ? `பயணம் முடிந்தது. ${trip.distanceKm.toFixed(1)} கிலோமீட்டர் பயணித்தீர்கள்.`
        : selectedLang === 'hi'
        ? `यात्रा समाप्त। आपने ${trip.distanceKm.toFixed(1)} किलोमीटर की यात्रा की।`
        : `Trip ended. You travelled ${trip.distanceKm.toFixed(1)} kilometres.`;
    MarineVoiceService.speak(msg, selectedLang);
  };

  const handleContinueAfterArrival = () => setIsNavigating(false);
  const handleCancelNavigation = () => setIsNavigating(false);

  const isBusy =
    taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  // ── Derived status for floating chips ─────────────────────────────────────
  const waveInfo = liveRisk?.factors?.find((f) => f.factor.includes('Wave'))?.risk?.split(' ')[0];
  const windInfo = liveRisk?.factors?.find((f) => f.factor.includes('Wind'))?.risk?.split('(')[0]?.trim();
  const sstInfo = livePfzZones.length > 0 ? `${livePfzZones[0].sst}°C` : null;
  const safetyLevel = liveRisk?.overallRisk;

  // Language-specific UI strings
  const listeningText =
    selectedLang === 'ta' ? 'கேட்கிறேன்...' :
    selectedLang === 'hi' ? 'सुन रहा हूं...' :
    selectedLang === 'te' ? 'వింటున్నాను...' :
    selectedLang === 'ml' ? 'കേൾക്കുന്നു...' : 'Listening...';

  const thinkingText =
    selectedLang === 'ta' ? 'தகவலை தேடுகிறேன்...' :
    selectedLang === 'hi' ? 'खोज रहा हूं...' : 'Searching data...';

  const speakingText =
    selectedLang === 'ta' ? 'பதில் சொல்கிறேன்...' :
    selectedLang === 'hi' ? 'बोल रहा हूं...' : 'Speaking...';

  const tapSpeakText =
    selectedLang === 'ta' ? 'தட்டி பேசுங்கள்' :
    selectedLang === 'hi' ? 'टैप करें और बोलें' :
    selectedLang === 'te' ? 'నొక్కి మాట్లాడండి' :
    selectedLang === 'ml' ? 'ടാപ്പ് ചെയ്ത് സംസാരിക്കൂ' : 'Tap & Speak';

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    /* Outer: dark background — shows phone frame on desktop, full-screen on mobile */
    <div className="w-full bg-slate-950 flex items-start justify-center min-h-[calc(100vh-4rem)]">

      {/* ═══ PHONE FRAME CONTAINER ═══ */}
      <div
        className={[
          'relative w-full bg-[#06101e] flex flex-col overflow-hidden',
          // Desktop: center as phone frame
          'md:max-w-[390px] md:my-4 md:rounded-[40px] md:shadow-2xl md:border md:border-slate-700/40',
          // Mobile: fill remaining viewport
          'h-[calc(100vh-4rem)] md:h-[760px]',
        ].join(' ')}
      >

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div className="flex-none h-14 px-4 flex items-center gap-3 bg-[#06101e] border-b border-white/8 z-10">

          {/* Brand mark */}
          <div className="w-8 h-8 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Anchor className="w-4 h-4 text-teal-400" />
          </div>

          {/* Name + GPS status */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white tracking-widest uppercase font-mono leading-tight">
              MATSYA AI
            </div>
            <div className="flex items-center gap-1.5">
              {geoPos.status === 'success' ? (
                <>
                  <LocateFixed className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 font-mono">
                    GPS ±{geoPos.accuracy}m
                  </span>
                  <span className="text-[8px] text-white/30 font-mono truncate">
                    {geoPos.latitude.toFixed(3)}°N {geoPos.longitude.toFixed(3)}°E
                  </span>
                </>
              ) : geoPos.status === 'loading' ? (
                <span className="text-[9px] text-amber-400 font-mono animate-pulse">GPS...</span>
              ) : (
                <>
                  <span className="text-[9px] text-white/35 font-mono">Demo — Kasimedu, Chennai</span>
                  <button
                    onClick={retryGps}
                    className="text-[8px] text-teal-400/60 hover:text-teal-400 font-mono underline"
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Language selector — compact pill strip */}
          <div className="flex items-center gap-0.5 shrink-0">
            {SUPPORTED_LANGUAGES.slice(0, 5).map((lang) => (
              <button
                key={lang.code}
                disabled={isBusy}
                onClick={() => {
                  setSelectedLang(lang.code);
                  MarineVoiceService.stopAll();
                  setTaskState('IDLE');
                }}
                className={[
                  'px-1.5 py-0.5 rounded text-[8px] font-bold transition disabled:opacity-40',
                  selectedLang === lang.code
                    ? 'bg-teal-600 text-white'
                    : 'text-white/35 hover:text-white/70',
                ].join(' ')}
              >
                {lang.nativeName.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAP AREA (flex-1 with overflow-hidden) ──────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden">

          {/* TacticalMap — fills this container, bottom is clipped if needed */}
          <div className="absolute inset-0 overflow-hidden">
            <TacticalMap
              selectedPFZId={selectedPFZ?.id}
              activeRoute={activeRoute}
              onSelectPFZ={(pfz) => setSelectedPFZ(pfz)}
              onAskOrcaPFZ={(pfz) =>
                startFishermanTask(`Why is ${pfz.name} recommended today?`)
              }
              pfzZones={livePfzZones.length > 0 ? livePfzZones : undefined}
              isLoading={isMapLoading}
              centerLat={geoPos.latitude}
              centerLng={geoPos.longitude}
            />
          </div>

          {/* Navigation active overlay (top of map) */}
          {isNavigating && selectedPFZ && (
            <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between bg-[#06101e]/92 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-teal-500/30 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-tight">
                    {selectedPFZ.distanceKm} km · {selectedPFZ.direction}
                  </div>
                  <div className="text-teal-300/70 text-[9px] font-mono">
                    {selectedPFZ.name.split(' ').slice(0, 3).join(' ')}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelNavigation}
                className="text-white/40 hover:text-rose-400 text-[9px] font-mono px-2.5 py-1 rounded-lg border border-white/10 hover:border-rose-500/30 transition"
              >
                END
              </button>
            </div>
          )}

          {/* Selected PFZ info card (top-right, when not navigating) */}
          {selectedPFZ && !isNavigating && (
            <div className="absolute top-2 right-2 z-20 w-36 bg-[#06101e]/90 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/25 shadow-xl">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Fish className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                  Nearest PFZ
                </span>
              </div>
              <div
                className={[
                  'inline-block text-[8px] px-1.5 py-0.5 rounded font-bold mb-2',
                  selectedPFZ.suitabilityScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedPFZ.suitabilityScore >= 60
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-orange-500/20 text-orange-300',
                ].join(' ')}
              >
                {selectedPFZ.suitabilityScore >= 80
                  ? 'High'
                  : selectedPFZ.suitabilityScore >= 60
                  ? 'Medium'
                  : 'Low'}{' '}
                Potential
              </div>
              <div className="text-white font-bold text-lg leading-none">
                {selectedPFZ.distanceKm} km
              </div>
              <div className="text-white/50 text-[9px] font-mono mb-1">
                {selectedPFZ.direction}
              </div>
              <div className="text-[8px] text-white/30 font-mono">
                Conf: {selectedPFZ.confidenceScore}%
              </div>
              <button
                onClick={handleStartNavigation}
                className="mt-2.5 w-full py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-md"
              >
                <Navigation className="w-3 h-3" /> NAVIGATE
              </button>
            </div>
          )}

          {/* Status chips (bottom-left of map) */}
          {(waveInfo || windInfo || sstInfo || safetyLevel) && (
            <div className="absolute bottom-2 left-2 z-10 flex gap-1 flex-wrap">
              {waveInfo && (
                <span className="bg-[#06101e]/80 backdrop-blur-sm text-teal-300 text-[8px] font-mono px-2 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
                  <Waves className="w-2.5 h-2.5" /> {waveInfo}
                </span>
              )}
              {windInfo && (
                <span className="bg-[#06101e]/80 backdrop-blur-sm text-sky-300 text-[8px] font-mono px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5" /> {windInfo}
                </span>
              )}
              {sstInfo && (
                <span className="bg-[#06101e]/80 backdrop-blur-sm text-amber-300 text-[8px] font-mono px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Thermometer className="w-2.5 h-2.5" /> {sstInfo}
                </span>
              )}
              {safetyLevel && (
                <span
                  className={[
                    'text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1',
                    safetyLevel === 'SAFE'
                      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                      : safetyLevel === 'CAUTION'
                      ? 'bg-amber-500/15 border-amber-500/25 text-amber-300'
                      : 'bg-red-500/15 border-red-500/25 text-red-300',
                  ].join(' ')}
                >
                  {safetyLevel === 'SAFE' ? '●' : safetyLevel === 'CAUTION' ? '◐' : '○'}{' '}
                  {safetyLevel.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── NAVIGATION PANEL (replaces copilot while navigating) ─────────── */}
        {isNavigating && (
          <div className="flex-none">
            <NavigationPanel
              isActive={isNavigating}
              destination={
                selectedPFZ
                  ? { lat: selectedPFZ.latitude, lng: selectedPFZ.longitude, name: selectedPFZ.name }
                  : null
              }
              origin={{
                lat: geoPos.latitude,
                lng: geoPos.longitude,
                name: formatLocationName(geoPos),
              }}
              route={activeRoute}
              selectedPFZ={selectedPFZ}
              language={selectedLang}
              onEndTrip={handleEndTrip}
              onContinue={handleContinueAfterArrival}
              onClose={handleCancelNavigation}
            />
          </div>
        )}

        {/* ── BOTTOM AI COPILOT ─────────────────────────────────────────────── */}
        {!isNavigating && (
          <div className="flex-none bg-[#06101e] border-t border-white/8 px-4 pt-3 pb-4 space-y-2.5">

            {/* AI response text + replay/stop */}
            {lastAnswer && (
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <p className="flex-1 text-[11px] text-white/65 leading-snug line-clamp-2">
                  {lastAnswer}
                </p>
                {taskState !== 'SPEAKING' ? (
                  <button
                    onClick={() => {
                      setTaskState('SPEAKING');
                      MarineVoiceService.speak(lastAnswer, selectedLang, undefined, () => {
                        setTaskState('COMPLETED');
                        setTimeout(() => setTaskState('IDLE'), 600);
                      });
                    }}
                    className="shrink-0 p-1 rounded-full text-teal-400/60 hover:text-teal-300 transition"
                    title="Replay voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopSpeaking}
                    className="shrink-0 p-1 rounded-full text-rose-400/70 hover:text-rose-300 transition"
                    title="Stop speaking"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Voice state indicator */}
            {(taskState === 'LISTENING' || isBusy || taskState === 'SPEAKING') && (
              <div
                className={[
                  'text-[10px] font-mono flex items-center gap-1.5',
                  taskState === 'LISTENING'
                    ? 'text-rose-400'
                    : taskState === 'SPEAKING'
                    ? 'text-teal-300'
                    : 'text-teal-400 animate-pulse',
                ].join(' ')}
              >
                {taskState === 'LISTENING' && (
                  <><Radio className="w-3 h-3 animate-pulse" />{voiceQuery || listeningText}</>
                )}
                {isBusy && (
                  <><Sparkles className="w-3 h-3 animate-spin" />{thinkingText}</>
                )}
                {taskState === 'SPEAKING' && (
                  <><Volume2 className="w-3 h-3 animate-pulse" />{speakingText}</>
                )}
              </div>
            )}

            {/* Quick query chips — horizontal scroll */}
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex gap-1.5 pb-0.5" style={{ width: 'max-content' }}>
                {(localQuickQueries[selectedLang] || localQuickQueries.en).map((q, i) => (
                  <button
                    key={i}
                    disabled={isBusy}
                    onClick={() => startFishermanTask(q)}
                    className="px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-[10px] text-white/55 hover:text-white hover:bg-white/12 active:scale-95 transition disabled:opacity-40 whitespace-nowrap"
                  >
                    {q.length > 22 ? q.slice(0, 22) + '…' : q}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom row: Emergency | MIC | GPS */}
            <div className="flex items-center gap-2.5">

              {/* Emergency call button */}
              <button
                className="w-12 h-12 rounded-2xl bg-rose-900/25 border border-rose-500/30 flex flex-col items-center justify-center gap-0.5 text-rose-400 hover:bg-rose-900/40 active:scale-95 transition shrink-0"
                title="Indian Coast Guard Emergency: 1554"
                onClick={() => {
                  if (window.confirm('Call Indian Coast Guard Emergency: 1554?')) {
                    window.location.href = 'tel:1554';
                  }
                }}
              >
                <PhoneCall className="w-4 h-4" />
                <span className="text-[7px] font-bold font-mono">1554</span>
              </button>

              {/* Main mic button */}
              <button
                id="fisherman-main-mic-btn"
                disabled={isBusy}
                onClick={handleVoiceToggle}
                className={[
                  'flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50',
                  taskState === 'LISTENING'
                    ? 'bg-rose-600 ring-4 ring-rose-500/30 animate-pulse'
                    : taskState === 'SPEAKING'
                    ? 'bg-teal-600 ring-4 ring-teal-500/20'
                    : 'bg-teal-700 hover:bg-teal-600 ring-2 ring-teal-600/20',
                ].join(' ')}
              >
                {taskState === 'LISTENING' ? (
                  <><MicOff className="w-5 h-5 text-white" /><span className="text-white">{listeningText}</span></>
                ) : taskState === 'SPEAKING' ? (
                  <><Volume2 className="w-5 h-5 text-white" /><span className="text-white">{speakingText}</span></>
                ) : (
                  <><Mic className="w-5 h-5 text-white" /><span className="text-white">{tapSpeakText}</span></>
                )}
              </button>

              {/* GPS status / retry button */}
              <button
                onClick={retryGps}
                className={[
                  'w-12 h-12 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition shrink-0 active:scale-95',
                  geoPos.status === 'success'
                    ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-400'
                    : geoPos.status === 'loading'
                    ? 'border-amber-500/30 bg-amber-900/20 text-amber-400 animate-pulse'
                    : 'border-white/15 bg-white/5 text-white/40 hover:text-white/70',
                ].join(' ')}
                title={geoPos.isLive ? `GPS Active ±${geoPos.accuracy}m — tap to refresh` : 'Tap to retry GPS'}
              >
                <LocateFixed className="w-4 h-4" />
                <span className="text-[7px] font-bold font-mono">
                  {geoPos.status === 'success' ? 'LIVE' : geoPos.status === 'loading' ? '···' : 'GPS'}
                </span>
              </button>
            </div>

            {/* Last trip summary (compact) */}
            {lastTrip && (
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/60 font-mono">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>
                  Last: {lastTrip.pfzName} — {lastTrip.distanceKm.toFixed(1)} km,{' '}
                  {lastTrip.durationMinutes} min
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
