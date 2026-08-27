import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Globe, 
  Cpu, 
  ShieldCheck, 
  Compass, 
  Leaf, 
  Waves, 
  Wind, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Activity,
  AlertTriangle,
  Radio,
  Loader2,
  Square
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/mockMarineData';
import { runAgentOrchestration } from '../services/api';
import { AgentOrchestrationResult } from '../types/marine';
import { MarineVoiceService } from '../services/voice';

export type TaskState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'PLANNING' 
  | 'EXECUTING' 
  | 'SYNTHESIZING' 
  | 'SPEAKING' 
  | 'COMPLETED';

interface AskOrcaViewProps {
  initialQuery?: string;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onNavigate: (view: string) => void;
}

export const AskOrcaView: React.FC<AskOrcaViewProps> = ({
  initialQuery = '',
  selectedLanguage,
  onSelectLanguage,
  onNavigate
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [taskState, setTaskState] = useState<TaskState>('IDLE');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<AgentOrchestrationResult | null>(null);

  const currentTaskIdRef = useRef<string | null>(null);
  const isExecutingRef = useRef<boolean>(false);

  const samplePrompts = [
    {
      title: 'PFZ & Upwelling Search',
      prompt: 'Where are the best potential fishing zones off Kasimedu with high chlorophyll and low risk?',
      lang: 'en'
    },
    {
      title: 'Coromandel 30-Day Catch Decline',
      prompt: 'Explain why fish catch has declined along the Coromandel coast over the past 30 days.',
      lang: 'en'
    },
    {
      title: 'Tamil Sea Swell & Safety',
      prompt: 'காசிமேடுக்கு வெளியே 25 கி.மீ தொலைவில் அலைகள் மற்றும் காற்று எப்படி உள்ளது?',
      lang: 'ta'
    },
    {
      title: 'Veraval & Palk Bay Geofence',
      prompt: 'Analyze wave risks, squall wind vectors, and distance to IMBL boundary for Palk Strait.',
      lang: 'en'
    }
  ];

  // Initialize with initialQuery if provided
  useEffect(() => {
    if (initialQuery && !result && taskState === 'IDLE') {
      startNewTask(initialQuery);
    }
  }, [initialQuery]);

  // Clean up voice on unmount
  useEffect(() => {
    return () => {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
    };
  }, []);

  /**
   * Starts a brand new task.
   * Cancels prior TTS/listening, enforces single task lifecycle, speaks final text once.
   */
  const startNewTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isExecutingRef.current) return;

    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    setActiveTaskId(newTaskId);
    isExecutingRef.current = true;

    // Stop any previous speech or recording
    MarineVoiceService.stopAll();
    setResult(null);

    try {
      // 1. PLANNING
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 150));
      if (currentTaskIdRef.current !== newTaskId) return;

      // 2. EXECUTING (Specialized agents execute in background)
      setTaskState('EXECUTING');
      const res = await runAgentOrchestration(cleanQuery, selectedLanguage, {
        lat: 13.0827,
        lng: 80.2707,
        name: 'Kasimedu, Chennai'
      });

      if (currentTaskIdRef.current !== newTaskId) return;

      // 3. SYNTHESIZING
      setTaskState('SYNTHESIZING');
      setResult(res);
      await new Promise((r) => setTimeout(r, 150));
      if (currentTaskIdRef.current !== newTaskId) return;

      // 4. SPEAKING (Play TTS ONCE)
      setTaskState('SPEAKING');
      const textToSpeak = res.spokenText || res.answer;

      MarineVoiceService.speak(
        textToSpeak,
        selectedLanguage,
        newTaskId,
        () => {
          // 5. SPEAKING -> COMPLETED -> IDLE
          if (currentTaskIdRef.current === newTaskId) {
            setTaskState('COMPLETED');
            isExecutingRef.current = false;
            setTimeout(() => {
              if (currentTaskIdRef.current === newTaskId) {
                setTaskState('IDLE');
              }
            }, 600);
          }
        }
      );
    } catch (err) {
      console.error('[AskOrcaView] Agent orchestration error:', err);
      isExecutingRef.current = false;
      setTaskState('IDLE');
    }
  };

  /**
   * Starts microphone recording
   */
  const handleStartListening = () => {
    MarineVoiceService.stopAll();
    currentTaskIdRef.current = null;
    isExecutingRef.current = false;
    setTaskState('LISTENING');

    MarineVoiceService.playBeep(600, 100);

    const started = MarineVoiceService.startListening(
      selectedLanguage,
      (transcript, isFinal) => {
        setQuery(transcript);
        if (isFinal && transcript.trim()) {
          MarineVoiceService.stopListening();
          startNewTask(transcript.trim());
        }
      },
      (err) => {
        console.warn('[AskOrcaView] Voice recognition error:', err);
        setTaskState('IDLE');
      },
      () => {
        setTaskState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      }
    );

    if (!started) {
      setTaskState('IDLE');
    }
  };

  const handleStopListening = () => {
    MarineVoiceService.stopListening();
    if (query.trim()) {
      startNewTask(query.trim());
    } else {
      setTaskState('IDLE');
    }
  };

  const handleStopSpeaking = () => {
    MarineVoiceService.stopSpeaking();
    isExecutingRef.current = false;
    setTaskState('IDLE');
  };

  const isBusy = taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  const getStateBadge = () => {
    switch (taskState) {
      case 'LISTENING':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 animate-pulse">
            <Radio className="w-3 h-3 text-rose-600 animate-ping" />
            LISTENING (MIC ACTIVE)
          </span>
        );
      case 'PLANNING':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
            PLANNING DAG
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            SUB-AGENTS EXECUTING
          </span>
        );
      case 'SYNTHESIZING':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-600" />
            SYNTHESIZING XAI
          </span>
        );
      case 'SPEAKING':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
            <Volume2 className="w-3 h-3 text-teal-600 animate-pulse" />
            SPEAKING ADVISORY
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            TASK COMPLETED
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-[#F7F7F5] text-[#555555] border border-[#E5E5E5]">
            TASK ENGINE READY
          </span>
        );
    }
  };

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
              <Cpu className="w-3.5 h-3.5 text-teal-700" />
              <span>Autonomous Task-Based Multi-Agent Marine Assistant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Ask MATSYA AI Marine Intelligence
            </h1>
            <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
              Submit oceanographic queries in natural text or spoken native dialect. 
              MATSYA AI executes a discrete single task, coordinates required specialized agents silently, and delivers a single synthesized spoken response.
            </p>
          </div>

          <div>{getStateBadge()}</div>
        </div>

        {/* Query Input Box & Language Selector */}
        <div className="p-6 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F5] space-y-4 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111111]">Response Language:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    disabled={isBusy}
                    onClick={() => onSelectLanguage(l.code)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition disabled:opacity-50 ${
                      selectedLanguage === l.code
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-white text-[#555555] border border-[#E5E5E5] hover:text-black'
                    }`}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-mono text-teal-800 font-bold">
              10 Domain Sub-Agents Standby
            </span>
          </div>

          {/* Active Listening Indicator */}
          {taskState === 'LISTENING' && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-pulse">
              <Radio className="w-4 h-4 text-rose-600 animate-ping" />
              <span className="font-semibold">Microphone Active: Listening to your voice... Speak now.</span>
            </div>
          )}

          {/* Text Input Row */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              disabled={isBusy}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim() && !isBusy) {
                  startNewTask(query);
                }
              }}
              placeholder={isBusy ? 'Processing query...' : "Ask anything (e.g. 'Is it safe to fish off Kochi tonight?', 'Where are high chlorophyll upwelling zones?')..."}
              className="w-full pl-4 pr-32 py-3.5 bg-white border border-[#CCCCCC] rounded-xl text-xs text-[#111111] focus:outline-hidden focus:border-black transition font-medium disabled:bg-gray-100"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {/* Mic Toggle Button */}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  if (taskState === 'LISTENING') {
                    handleStopListening();
                  } else {
                    handleStartListening();
                  }
                }}
                className={`p-2 rounded-lg transition flex items-center justify-center shadow-xs disabled:opacity-40 ${
                  taskState === 'LISTENING'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#F0F0F0] text-[#333333] hover:bg-[#E5E5E5]'
                }`}
                title={taskState === 'LISTENING' ? 'Stop Listening' : 'Speak to MATSYA AI'}
              >
                {taskState === 'LISTENING' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Ask Button */}
              <button
                type="button"
                onClick={() => {
                  if (query.trim()) {
                    startNewTask(query);
                  }
                }}
                disabled={!query.trim() || isBusy}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                {isBusy ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-teal-400" />
                )}
                <span className="hidden sm:inline">{isBusy ? 'Reasoning...' : 'Ask'}</span>
              </button>
            </div>
          </div>

          {/* Quick Benchmark Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#666666] block">Benchmark Questions:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  disabled={isBusy}
                  onClick={() => {
                    setQuery(sample.prompt);
                    onSelectLanguage(sample.lang);
                    startNewTask(sample.prompt);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#333333] hover:border-black hover:bg-[#FAF9F5] transition text-left disabled:opacity-50"
                >
                  <span className="font-bold mr-1.5">[{sample.title}]</span>
                  <span>"{sample.prompt.slice(0, 45)}..."</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {isBusy && (
          <div className="p-12 rounded-2xl border border-[#E5E5E5] bg-white text-center space-y-4 shadow-xs animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[#111111] text-teal-400 flex items-center justify-center mx-auto">
              <Cpu className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="font-bold text-sm text-[#111111]">
              {taskState === 'PLANNING' && 'Planner Agent: Resolving DAG Task Graph...'}
              {taskState === 'EXECUTING' && 'Silent Execution: Querying SST, SWAN Waves & IMBL Boundaries...'}
              {taskState === 'SYNTHESIZING' && 'Synthesis & XAI Agent: Generating Unified Advisory...'}
            </h3>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              Domain agents work silently in the background without intermediate voice narration.
            </p>
          </div>
        )}

        {result && !isBusy && (
          <div className="space-y-6">
            
            {/* Top Result Banner */}
            <div className="p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs font-bold text-[#111111]">MATSYA AI SYNTHESIZED MARINE INTELLIGENCE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                    {result.confidence}% Confidence
                  </span>
                </div>

                {/* Voice Playback Toggle */}
                {taskState === 'SPEAKING' ? (
                  <button
                    onClick={handleStopSpeaking}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg transition flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Square className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
                    <span>Stop Spoken Audio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (result.spokenText) {
                        setTaskState('SPEAKING');
                        MarineVoiceService.speak(result.spokenText, selectedLanguage, activeTaskId || undefined, () => {
                          setTaskState('COMPLETED');
                          setTimeout(() => setTaskState('IDLE'), 600);
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] text-[#111111] text-xs font-semibold rounded-lg transition flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Replay Voice Advisory</span>
                  </button>
                )}
              </div>

              {/* Main Text Response */}
              <div className="text-xs text-[#222222] leading-relaxed space-y-3">
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] text-xs whitespace-pre-line font-medium leading-relaxed">
                  {result.answer}
                </div>
              </div>
            </div>

            {/* Agent Execution Chain Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#111111]">Multi-Agent Collaborative Execution Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111111]">{step.displayName}</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">✓ {step.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-[#666666] leading-snug">{step.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Fusion Table */}
            {result.evidence && result.evidence.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#111111]">Evidence Fusion Matrix & Satellite Sensors</h3>
                <div className="rounded-xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F7F5] border-b border-[#E5E5E5] text-[10px] font-mono text-[#666666] uppercase">
                      <tr>
                        <th className="p-3">Dataset / Payload</th>
                        <th className="p-3">Source Agency</th>
                        <th className="p-3">Resolution</th>
                        <th className="p-3">Observation Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] text-xs">
                      {result.evidence.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF9F5]">
                          <td className="p-3 font-bold text-[#111111]">{ev.dataset}</td>
                          <td className="p-3 text-[#555555] font-mono">{ev.source}</td>
                          <td className="p-3 text-[#555555] font-mono">{ev.resolution}</td>
                          <td className="p-3 text-[#333333]">{ev.observation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Suggested Follow-Ups */}
            {result.suggestedFollowUps && result.suggestedFollowUps.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[#111111] block">Suggested Investigation Paths:</span>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedFollowUps.map((fUp, i) => (
                    <button
                      key={i}
                      disabled={isBusy}
                      onClick={() => {
                        setQuery(fUp);
                        startNewTask(fUp);
                      }}
                      className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs text-[#333333] hover:border-black hover:bg-[#F7F7F5] transition disabled:opacity-50"
                    >
                      {fUp} →
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
