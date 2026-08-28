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
import { MarineLeafletMap } from '../components/MarineLeafletMap';
import { MarineVoiceService, LANGUAGE_CONFIG } from '../services/voice';
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
  | 'FALLBACK_RECORDING'  // MediaRecorder + cloud STT (auto-triggered when browser STT fails)
  | 'PLANNING'
  | 'EXECUTING'
  | 'SYNTHESIZING'
  | 'SPEAKING'
  | 'COMPLETED';

export const FishermanView: React.FC<FishermanViewProps> = ({ onOpenGlobalExplorer }) => {
  const [selectedLang, setSelectedLang] = useState<string>('ta');
  const [taskState, setTaskState] = useState<FishermanTaskState>('IDLE');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [selectedPFZ, setSelectedPFZ] = useState<PFZZone>(MOCK_PFZ_ZONES[0]);
  const [activeRoute, setActiveRoute] = useState<RoutePlan>(MOCK_SAMPLE_ROUTES.chennai_to_pfz1);
  const [lastAnswer, setLastAnswer] = useState<string>(() => {
    const n = localStorage.getItem('matsya_name');
    return n
      ? `வணக்கம் ${n}! இன்றைய கடல் நிலை பாதுகாப்பானது (அலை 0.8 மீ). 38 கி.மீ வடகிழக்கில் அதிக மீன் வளம் உள்ள மண்டலம் (PFZ) கண்டறியப்பட்டுள்ளது.`
      : 'வணக்கம்! இன்றைய கடல் நிலை பாதுகாப்பானது (அலை 0.8 மீ). 38 கி.மீ வடகிழக்கில் அதிக மீன் வளம் உள்ள மண்டலம் (PFZ) கண்டறியப்பட்டுள்ளது.';
  });
  const [livePfzZones, setLivePfzZones] = useState<PFZZone[]>([]);
  const [liveRisk, setLiveRisk] = useState<AgentOrchestrationResult['riskAssessment'] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [geoPos, setGeoPos] = useState<GeoPosition>(() => ({ ...getFallbackPosition(), status: 'loading' }));
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastTrip, setLastTrip] = useState<TripRecord | null>(null);

  const [fishermanName, setFishermanName] = useState<string>(() => localStorage.getItem('matsya_name') || '');
  const [nameInput, setNameInput] = useState('');
  const [showNameEntry, setShowNameEntry] = useState<boolean>(() => !localStorage.getItem('matsya_name'));

  // Voice error + diagnostics state
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [diagState, setDiagState] = useState({ micPermission: 'unknown', voicesLoaded: 0 });
  // Tracks which STT path was used: 'browser' | 'cloud' | null
  const [sttProvider, setSttProvider] = useState<'browser' | 'cloud' | null>(null);

  const currentTaskIdRef = useRef<string | null>(null);
  const isExecutingRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  // Ref tracks the latest voice query so stale-closure callbacks can read it
  const voiceQueryRef = useRef<string>('');
  // Ref to stop the MediaRecorder fallback when the user taps the mic button again
  const stopFallbackRef = useRef<(() => void) | null>(null);

  // ── GPS + Voice pre-warm on mount ─────────────────────────────────────────
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

    // Check voice support immediately
    const supported = MarineVoiceService.isSupported();
    setVoiceSupported(supported);
    if (!supported) {
      console.warn('[VOICE] SpeechRecognition not available in this browser');
    }

    // Pre-warm microphone so Safari doesn't pop a permission dialog mid-sentence
    MarineVoiceService.requestMicPermission().then((ok) => {
      setDiagState(prev => ({ ...prev, micPermission: ok ? 'granted' : 'denied' }));
    });

    // Pre-load TTS voices so they're ready before first use
    MarineVoiceService.preloadVoices().then(() => {
      setDiagState(prev => ({ ...prev, voicesLoaded: MarineVoiceService.diagnostics.voicesLoaded }));
    });

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

  // ── All original handlers ──────────────────────────────────────────────────
  const startFishermanTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      console.warn('[VOICE] Empty transcript — agent call skipped');
      return;
    }
    if (isExecutingRef.current) return;

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    isExecutingRef.current = true;

    // Reset voice query ref when a new task begins
    voiceQueryRef.current = '';
    MarineVoiceService.stopAll();
    console.log('[VOICE] Sending transcript to agent:', cleanQuery);

    try {
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 120));
      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('EXECUTING');
      setIsMapLoading(true);
      const result = await runAgentOrchestration(
        fishermanName ? `[Fisherman: ${fishermanName}] ${cleanQuery}` : cleanQuery,
        selectedLang,
        {
          lat: geoPos.latitude,
          lng: geoPos.longitude,
          name: formatLocationName(geoPos),
        }
      );

      if (currentTaskIdRef.current !== newTaskId) return;

      setTaskState('SYNTHESIZING');
      console.log('[VOICE] Agent response received:', result.answer?.slice(0, 80) + '...');
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

  // Friendly error messages per error code and language
  const getVoiceErrorMessage = (err: string, lang: string): string => {
    const isTamil = lang === 'ta';
    const isHindi = lang === 'hi';
    if (err === 'microphone_denied') {
      if (isTamil) return 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. Safari அமைவுகள் → Websites → Microphone இல் அனுமதி வழங்கவும்.';
      if (isHindi) return 'माइक्रोफोन की अनुमति नहीं है। Safari सेटिंग्स → Websites → Microphone में अनुमति दें।';
      return 'Microphone access denied. In Safari: Settings → Websites → Microphone → Allow for localhost.';
    }
    if (err === 'not_supported') {
      return 'Voice recognition is not supported in this browser. Please use Safari 14.1+ or Chrome/Edge.';
    }
    if (err === 'no_speech') {
      if (isTamil) return 'பேச்சு எதுவும் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.';
      if (isHindi) return 'कोई आवाज़ नहीं सुनाई दी। कृपया फिर से प्रयास करें।';
      return 'No speech detected. Please tap and speak clearly.';
    }
    if (err === 'network_error') {
      return 'Network error during speech recognition. Check your internet connection.';
    }
    if (err === 'mic_unavailable') {
      return 'Microphone not available. Please check your hardware.';
    }
    if (err === 'language_not_supported') {
      return `Language "${LANGUAGE_CONFIG[lang]?.label || lang}" may not be supported by this browser's speech engine.`;
    }
    return `Voice recognition error (${err}). Please try again.`;
  };

  const showVoiceError = (msg: string) => {
    setVoiceError(msg);
    setTimeout(() => setVoiceError(null), 6000);
  };

  // Start cloud STT fallback via MediaRecorder → /api/voice/transcribe
  const startFallbackRecording = async (lang: string) => {
    setVoiceError(null);
    voiceQueryRef.current = '';
    setVoiceQuery('');
    setTaskState('FALLBACK_RECORDING');
    setSttProvider('cloud');
    MarineVoiceService.playBeep(440, 120);

    const stopFn = await MarineVoiceService.startRecordingFallback(
      lang,
      (transcript) => {
        voiceQueryRef.current = transcript;
        setVoiceQuery(transcript);
        stopFallbackRef.current = null;
        startFishermanTask(transcript);
      },
      (err) => {
        stopFallbackRef.current = null;
        const msg = err === 'empty_transcript'
          ? getVoiceErrorMessage('no_speech', lang)
          : getVoiceErrorMessage(err, lang);
        showVoiceError(msg);
        setTaskState('IDLE');
        setSttProvider(null);
      },
      (state) => {
        if (state === 'processing') setTaskState('EXECUTING');
      }
    );
    stopFallbackRef.current = stopFn;
  };

  const handleVoiceToggle = () => {
    // If MediaRecorder fallback is running, stop it to trigger upload
    if (taskState === 'FALLBACK_RECORDING') {
      if (stopFallbackRef.current) {
        stopFallbackRef.current();
        stopFallbackRef.current = null;
      }
      return;
    }

    if (taskState === 'LISTENING') {
      MarineVoiceService.stopListening();
      if (voiceQueryRef.current.trim()) {
        startFishermanTask(voiceQueryRef.current.trim());
      } else {
        setTaskState('IDLE');
      }
      return;
    }

    // Browser doesn't support Web Speech → go straight to cloud STT
    if (!MarineVoiceService.isSupported()) {
      startFallbackRecording(selectedLang);
      return;
    }

    MarineVoiceService.stopAll();
    currentTaskIdRef.current = null;
    isExecutingRef.current = false;
    voiceQueryRef.current = '';
    setVoiceQuery('');
    setTaskState('LISTENING');
    setSttProvider('browser');
    MarineVoiceService.playBeep(600, 100);

    const started = MarineVoiceService.startListening(
      selectedLang,
      (text, isFinal) => {
        voiceQueryRef.current = text;
        setVoiceQuery(text);
        if (isFinal && text.trim()) {
          MarineVoiceService.stopListening();
          startFishermanTask(text.trim());
        }
      },
      (err) => {
        console.warn('[FishermanView] Recognition error:', err);
        // Auto-fallback to cloud STT when browser engine can't handle the language
        if (err === 'not_supported' || err === 'language_not_supported' || err === 'start_failed') {
          setTaskState('IDLE');
          setSttProvider(null);
          startFallbackRecording(selectedLang);
          return;
        }
        const msg = getVoiceErrorMessage(err, selectedLang);
        showVoiceError(msg);
        setTaskState('IDLE');
        setSttProvider(null);
      },
      () => {
        // Recognition ended — if no transcript captured, show "couldn't hear you"
        if (!voiceQueryRef.current.trim()) {
          const msg = getVoiceErrorMessage('no_speech', selectedLang);
          showVoiceError(msg);
        }
        setTaskState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      }
    );

    if (!started) {
      // startListening already called onError('not_supported') which triggers fallback above,
      // but guard here in case the flow changes
      setTaskState('IDLE');
      setSttProvider(null);
    }
  };

  const handleStopSpeaking = () => {
    MarineVoiceService.stopSpeaking();
    isExecutingRef.current = false;
    setTaskState('IDLE');
  };

  const handleStartNavigation = (pfz?: PFZZone) => {
    if (pfz) setSelectedPFZ(pfz);
    setIsNavigating(true);
  };

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

  const handleNameConfirm = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem('matsya_name', trimmed);
    setFishermanName(trimmed);
    setShowNameEntry(false);
    setLastAnswer(
      selectedLang === 'ta'
        ? `வணக்கம் ${trimmed}! இன்றைய கடல் நிலை பாதுகாப்பானது. 38 கி.மீ வடகிழக்கில் PFZ கண்டறியப்பட்டுள்ளது.`
        : selectedLang === 'hi'
        ? `नमस्ते ${trimmed}! समुद्र आज सुरक्षित है। 38 किमी NE में PFZ मिला है।`
        : `Welcome ${trimmed}! Sea conditions are safe today. PFZ detected 38 km NE.`
    );
  };

  const isBusy =
    taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  const recordingFallback = taskState === 'FALLBACK_RECORDING';

  const displayPfzZones = livePfzZones.length > 0 ? livePfzZones : MOCK_PFZ_ZONES;
  const nearestPfz = displayPfzZones[0] ?? selectedPFZ;

  // Safety status derived from live risk
  const waveInfo = liveRisk?.factors?.find((f) => f.factor.includes('Wave'))?.risk?.split(' ')[0];
  const windInfo = liveRisk?.factors?.find((f) => f.factor.includes('Wind'))?.risk?.split('(')[0]?.trim();
  const sstInfo = livePfzZones.length > 0 ? `${livePfzZones[0].sst}°C` : null;
  const safetyLevel = liveRisk?.overallRisk;

  // Language strings
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

  const recordingFallbackText =
    selectedLang === 'ta' ? '● பேசுங்கள் · நிறுத்த தட்டவும்' :
    selectedLang === 'hi' ? '● बोलें · रोकने के लिए टैप करें' : '● Recording · Tap to stop';

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    /* Page wrapper — transparent so App.tsx light background shows through */
    <div className="w-full flex justify-center px-3 py-2">

      {/* ═══ REALISTIC PHONE FRAME ═══ */}
      {/* width/height use CSS min() so the phone always fits in the viewport */}
      <div
        style={{ width: 'min(390px, 94vw)', height: 'min(844px, calc(100svh - 12rem))' }}
        className="relative flex flex-col overflow-hidden bg-[#06101e] rounded-[36px] sm:rounded-[44px] border border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.28),0_0_0_1.5px_rgba(255,255,255,0.06)]"
      >
        {/* ── PHONE TOP NOTCH (decorative) ────────────────────────────────── */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-24 h-6 bg-[#06101e] rounded-b-2xl" />

        {/* ── NAME ENTRY OVERLAY ───────────────────────────────────────────── */}
        {showNameEntry && (
          <div className="absolute inset-0 z-50 bg-[#06101e]/97 backdrop-blur-sm flex flex-col items-center justify-center p-8 gap-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center mb-2">
              <Anchor className="w-7 h-7 text-teal-400" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">வணக்கம்! Welcome</div>
              <div className="text-[11px] text-white/50 font-mono">Enter your name so MATSYA AI can greet you</div>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
              placeholder="உங்கள் பெயர் / Your name"
              autoFocus
              className="w-full max-w-[260px] px-4 py-3 rounded-xl bg-white/8 border border-white/20 text-white text-sm font-medium placeholder:text-white/30 outline-none focus:border-teal-500/60 text-center"
            />
            <button
              onClick={handleNameConfirm}
              disabled={!nameInput.trim()}
              className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition"
            >
              தொடரவும் / Continue
            </button>
            <button
              onClick={() => setShowNameEntry(false)}
              className="text-[10px] text-white/30 hover:text-white/60 font-mono transition"
            >
              Skip
            </button>
          </div>
        )}

        {/* ── APP HEADER ───────────────────────────────────────────────────── */}
        <div className="flex-none h-[58px] px-4 pt-2 flex items-center gap-3 bg-[#06101e] border-b border-white/8 z-20 shrink-0">
          {/* Brand */}
          <div className="w-7 h-7 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Anchor className="w-3.5 h-3.5 text-teal-400" />
          </div>

          {/* Title + GPS */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white tracking-widest uppercase font-mono leading-tight flex items-center gap-1.5">
              ⚓ MATSYA AI
              {fishermanName && (
                <span className="text-[9px] font-normal text-teal-400 normal-case tracking-normal">
                  · {fishermanName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {geoPos.status === 'success' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span className="text-[8.5px] text-emerald-400 font-mono font-bold">GPS ACTIVE</span>
                  <span className="text-[7.5px] text-white/30 font-mono truncate">
                    {geoPos.latitude.toFixed(3)}°N {geoPos.longitude.toFixed(3)}°E
                  </span>
                </>
              ) : geoPos.status === 'loading' ? (
                <span className="text-[8.5px] text-amber-400 font-mono animate-pulse">📡 Acquiring GPS...</span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/25 inline-block" />
                  <span className="text-[8.5px] text-white/35 font-mono">DEMO · Kasimedu, Chennai</span>
                  <button onClick={retryGps} className="text-[7.5px] text-teal-400/60 hover:text-teal-400 font-mono underline">Retry</button>
                </>
              )}
            </div>
          </div>

          {/* Language pills */}
          <div className="flex items-center gap-0.5 shrink-0">
            {SUPPORTED_LANGUAGES.slice(0, 5).map((lang) => (
              <button
                key={lang.code}
                disabled={isBusy}
                onClick={() => {
                  setSelectedLang(lang.code);
                  MarineVoiceService.stopAll();
                  setTaskState('IDLE');
                  voiceQueryRef.current = '';
                  setVoiceQuery('');
                  setVoiceError(null);
                }}
                className={[
                  'px-1.5 py-0.5 rounded text-[7.5px] font-bold transition disabled:opacity-40',
                  selectedLang === lang.code
                    ? 'bg-teal-600 text-white'
                    : 'text-white/35 hover:text-white/70',
                ].join(' ')}
              >
                {lang.nativeName.slice(0, 3)}
              </button>
            ))}
            {/* Diagnostics toggle */}
            <button
              onClick={() => setShowDiagnostics(v => !v)}
              className="ml-1 w-4 h-4 rounded text-[7px] font-bold text-white/20 hover:text-white/60 transition"
              title="Voice diagnostics"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* ── MAP SECTION — flex-1, Leaflet fills it ───────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Leaflet map fills this container */}
          <MarineLeafletMap
            lat={geoPos.latitude}
            lng={geoPos.longitude}
            isLiveGps={geoPos.isLive === true}
            pfzZones={displayPfzZones}
            activeRoute={activeRoute}
            selectedPFZId={selectedPFZ?.id}
            isLoading={isMapLoading}
            isNavigating={isNavigating}
            onSelectPFZ={(pfz) => {
              setSelectedPFZ(pfz);
            }}
            onNavigate={(pfz) => handleStartNavigation(pfz)}
          />

          {/* ── Floating status chips (bottom-left of map) ─────────────── */}
          {(waveInfo || windInfo || sstInfo || safetyLevel) && (
            <div className="absolute bottom-[110px] left-2 z-[500] flex gap-1 flex-wrap pointer-events-none">
              {safetyLevel && (
                <span className={[
                  'text-[7.5px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1',
                  safetyLevel === 'SAFE'
                    ? 'bg-emerald-900/70 border-emerald-500/30 text-emerald-300'
                    : safetyLevel === 'CAUTION'
                    ? 'bg-amber-900/70 border-amber-500/30 text-amber-300'
                    : 'bg-red-900/70 border-red-500/30 text-red-300',
                ].join(' ')}>
                  {safetyLevel === 'SAFE' ? '●' : safetyLevel === 'CAUTION' ? '◐' : '○'}{' '}
                  {safetyLevel.replace('_', ' ')}
                </span>
              )}
              {waveInfo && (
                <span className="bg-[#06101e]/75 backdrop-blur-sm text-teal-300 text-[7.5px] font-mono px-2 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
                  <Waves className="w-2 h-2" /> {waveInfo}
                </span>
              )}
              {sstInfo && (
                <span className="bg-[#06101e]/75 backdrop-blur-sm text-amber-300 text-[7.5px] font-mono px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Thermometer className="w-2 h-2" /> {sstInfo}
                </span>
              )}
            </div>
          )}

          {/* ── Navigation active banner ───────────────────────────────── */}
          {isNavigating && selectedPFZ && (
            <div className="absolute top-2 left-2 right-2 z-[600] flex items-center justify-between bg-[#06101e]/92 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-teal-500/30 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-tight">
                    {selectedPFZ.distanceKm} km · {selectedPFZ.direction}
                  </div>
                  <div className="text-teal-300/70 text-[9px] font-mono">
                    {selectedPFZ.name.split(' ').slice(0, 4).join(' ')}
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

          {/* ── Nearest PFZ floating card (bottom of map) ─────────────── */}
          {nearestPfz && !isNavigating && (
            <div className="absolute bottom-2 left-2 right-2 z-[600] bg-[#0c1a2e]/95 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Icon + title */}
                <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Fish className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                    Nearest PFZ
                  </div>
                  <div className="text-white font-bold text-sm leading-tight truncate">
                    {nearestPfz.name.split('(')[0].trim()}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white font-bold text-base leading-none">
                      {nearestPfz.distanceKm} km
                    </span>
                    <span className="text-white/40 text-[9px] font-mono">
                      ↗ {nearestPfz.direction.split('(').pop()?.replace(')', '') || nearestPfz.direction}
                    </span>
                    <span className={[
                      'text-[8px] px-1.5 py-0.5 rounded font-bold ml-auto',
                      nearestPfz.suitabilityScore >= 80
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : nearestPfz.suitabilityScore >= 60
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-orange-500/20 text-orange-300',
                    ].join(' ')}>
                      {nearestPfz.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Navigate button */}
                <button
                  onClick={() => handleStartNavigation(nearestPfz)}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  GO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── NAVIGATION PANEL (replaces copilot while navigating) ─────────── */}
        {isNavigating && (
          <div className="flex-none shrink-0">
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
          <div className="flex-none shrink-0 bg-[#06101e] border-t border-white/8 px-4 pt-3 pb-safe-area-inset-bottom pb-4">

            {/* Voice error banner */}
            {voiceError && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-rose-900/40 border border-rose-500/30 text-rose-300 text-[10px] leading-snug flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{voiceError}</span>
              </div>
            )}

            {/* Browser unsupported banner */}
            {!voiceSupported && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-500/30 text-amber-300 text-[10px] leading-snug">
                ⚠ Voice recognition is not supported in this browser. Use Safari 14.1+ or Chrome/Edge.
              </div>
            )}

            {/* Diagnostics panel */}
            {showDiagnostics && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-[#0c1a2e] border border-white/10 text-[9px] font-mono text-white/60 space-y-0.5">
                <div className="text-teal-400 font-bold text-[8px] uppercase mb-1">Voice Diagnostics</div>
                <div>Browser STT: {MarineVoiceService.diagnostics.stdSupport ? '✓ SpeechRecognition' : '—'} {MarineVoiceService.diagnostics.webkitSupport ? '✓ webkit' : ''}</div>
                <div>Cloud STT: {sttProvider === 'cloud' ? '✓ active' : '/api/voice/transcribe (on fallback)'}</div>
                <div>Active provider: {sttProvider ? <span className={sttProvider === 'cloud' ? 'text-amber-300' : 'text-emerald-300'}>{sttProvider.toUpperCase()}</span> : '—'}</div>
                <div>Microphone: {diagState.micPermission}</div>
                <div>Voices loaded: {diagState.voicesLoaded}</div>
                <div>Language: {LANGUAGE_CONFIG[selectedLang]?.label || selectedLang}</div>
                <div>STT code: {LANGUAGE_CONFIG[selectedLang]?.stt || selectedLang}</div>
                <div>TTS code: {LANGUAGE_CONFIG[selectedLang]?.tts || selectedLang}</div>
                <div>Selected voice: {MarineVoiceService.diagnostics.lastSelectedVoice || '—'}</div>
                <div>Last transcript: {MarineVoiceService.diagnostics.lastTranscript || '—'}</div>
                <div>Last error: {MarineVoiceService.diagnostics.lastError || '—'}</div>
                <div>Task state: {taskState}</div>
                <button onClick={() => setShowDiagnostics(false)} className="text-[8px] text-white/30 mt-1 hover:text-white/60">Close</button>
              </div>
            )}

            {/* AI response area */}
            <div className="flex items-start gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-teal-600/20 border border-teal-500/25 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8.5px] font-mono font-bold text-teal-400 uppercase tracking-wider mb-0.5">
                  ✨ MATSYA AI
                </div>
                <p className="text-[11px] text-white/70 leading-snug line-clamp-2">
                  {lastAnswer}
                </p>
              </div>
              {taskState !== 'SPEAKING' ? (
                <button
                  onClick={() => {
                    setTaskState('SPEAKING');
                    MarineVoiceService.speak(lastAnswer, selectedLang, undefined, () => {
                      setTaskState('COMPLETED');
                      setTimeout(() => setTaskState('IDLE'), 600);
                    });
                  }}
                  className="shrink-0 p-1.5 rounded-full text-teal-400/60 hover:text-teal-300 transition"
                  title="Replay voice"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleStopSpeaking}
                  className="shrink-0 p-1.5 rounded-full text-rose-400/70 hover:text-rose-300 transition"
                  title="Stop speaking"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Voice state indicator */}
            {(taskState === 'LISTENING' || recordingFallback || isBusy || taskState === 'SPEAKING') && (
              <div className={[
                'text-[10px] font-mono flex items-center gap-1.5 mb-2',
                taskState === 'LISTENING' ? 'text-rose-400'
                : recordingFallback ? 'text-amber-400 animate-pulse'
                : taskState === 'SPEAKING' ? 'text-teal-300'
                : 'text-teal-400 animate-pulse',
              ].join(' ')}>
                {taskState === 'LISTENING' && (
                  <><Radio className="w-3 h-3 animate-pulse" />{voiceQuery || listeningText}</>
                )}
                {recordingFallback && (
                  <><Radio className="w-3 h-3 animate-pulse" /> Cloud STT recording… tap to stop</>
                )}
                {isBusy && (
                  <><Sparkles className="w-3 h-3 animate-spin" />{thinkingText}</>
                )}
                {taskState === 'SPEAKING' && (
                  <><Volume2 className="w-3 h-3 animate-pulse" />{speakingText}</>
                )}
              </div>
            )}

            {/* Quick query chips */}
            <div className="overflow-x-auto mb-2.5" style={{ scrollbarWidth: 'none' }}>
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

            {/* Bottom row: Emergency | MIC | GPS retry */}
            <div className="flex items-center gap-2.5">
              {/* Emergency call */}
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

              {/* Main mic / voice button */}
              <button
                id="fisherman-main-mic-btn"
                disabled={isBusy}
                onClick={handleVoiceToggle}
                className={[
                  'flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50',
                  taskState === 'LISTENING'
                    ? 'bg-rose-600 ring-4 ring-rose-500/30 animate-pulse'
                    : recordingFallback
                    ? 'bg-amber-600 ring-4 ring-amber-500/30 animate-pulse'
                    : taskState === 'SPEAKING'
                    ? 'bg-teal-600 ring-4 ring-teal-500/20'
                    : 'bg-teal-700 hover:bg-teal-600 ring-2 ring-teal-600/20',
                ].join(' ')}
              >
                {taskState === 'LISTENING' ? (
                  <><MicOff className="w-5 h-5 text-white" /><span className="text-white">{listeningText}</span></>
                ) : recordingFallback ? (
                  <><Radio className="w-5 h-5 text-white" /><span className="text-white text-[11px]">{recordingFallbackText}</span></>
                ) : taskState === 'SPEAKING' ? (
                  <><Volume2 className="w-5 h-5 text-white" /><span className="text-white">{speakingText}</span></>
                ) : (
                  <><Mic className="w-5 h-5 text-white" /><span className="text-white">{tapSpeakText}</span></>
                )}
              </button>

              {/* GPS retry */}
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

            {/* Last trip summary */}
            {lastTrip && (
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/60 font-mono mt-2">
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
