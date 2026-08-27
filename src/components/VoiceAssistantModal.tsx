import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Bot, 
  Send, 
  Languages, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Radio, 
  Layers,
  ArrowRight,
  Loader2,
  Square
} from 'lucide-react';
import { MarineVoiceService } from '../services/voice';
import { runAgentOrchestration } from '../services/api';
import { AgentOrchestrationResult } from '../types/marine';
import { SUPPORTED_LANGUAGES } from '../data/mockMarineData';

export type AssistantTaskState = 
  | 'IDLE'
  | 'LISTENING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'SYNTHESIZING'
  | 'SPEAKING'
  | 'COMPLETED';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  defaultLanguage?: string;
  onViewTacticalMap?: () => void;
  onViewGlobalGlobe?: () => void;
  onSelectLanguage?: (lang: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  defaultLanguage = 'ta',
  onViewTacticalMap,
  onViewGlobalGlobe,
  onSelectLanguage,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [taskState, setTaskState] = useState<AssistantTaskState>('IDLE');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<AgentOrchestrationResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'matsya'; text: string; time: string; taskId?: string }[]>([]);

  // Ref tracking current running task ID to avoid race conditions or duplicate executions
  const currentTaskIdRef = useRef<string | null>(null);
  const isExecutingRef = useRef<boolean>(false);

  // Sync language selection if parent updates
  useEffect(() => {
    if (defaultLanguage && defaultLanguage !== selectedLanguage) {
      setSelectedLanguage(defaultLanguage);
    }
  }, [defaultLanguage]);

  // Detect whether browser supports SpeechRecognition (used to enable/disable mic)
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(false);

  useEffect(() => {
    setRecognitionSupported(MarineVoiceService.isSupported());
  }, []);

  // Handle initialQuery when modal opens
  useEffect(() => {
    if (initialQuery && isOpen) {
      startNewTask(initialQuery);
    }
  }, [initialQuery, isOpen]);

  // Clean up all audio and listeners when modal closes
  useEffect(() => {
    if (!isOpen) {
      MarineVoiceService.stopAll();
      currentTaskIdRef.current = null;
      isExecutingRef.current = false;
      setTaskState('IDLE');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    if (onSelectLanguage) {
      onSelectLanguage(newLang);
    }
  };

  /**
   * Starts a brand new task.
   * Cancels any prior task, stops previous TTS/speech recognition, generates a unique taskId,
   * and processes the query strictly through the task state machine.
   */
  const startNewTask = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isExecutingRef.current) return;

    // 1. Generate single unique taskId
    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    currentTaskIdRef.current = newTaskId;
    setActiveTaskId(newTaskId);
    isExecutingRef.current = true;

    // 2. Stop any previous speech recognition or audio playback
    MarineVoiceService.stopAll();

    // 3. Append user message to history
    const userMsg = {
      role: 'user' as const,
      text: cleanQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      taskId: newTaskId,
    };
    setConversationHistory((prev) => [...prev, userMsg]);
    setTranscript('');

    try {
      // 4. PLANNING STATE
      setTaskState('PLANNING');
      await new Promise((r) => setTimeout(r, 180)); // Brief state presentation

      // Check if task was cancelled
      if (currentTaskIdRef.current !== newTaskId) return;

      // 5. EXECUTING STATE (Specialized agents work silently in background)
      setTaskState('EXECUTING');

      const orchestrationResult = await runAgentOrchestration(cleanQuery, selectedLanguage);

      // Check if task was superseded
      if (currentTaskIdRef.current !== newTaskId) return;

      // 6. SYNTHESIZING STATE
      setTaskState('SYNTHESIZING');
      setResult(orchestrationResult);

      const matsyaMsg = {
        role: 'matsya' as const,
        text: orchestrationResult.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        taskId: newTaskId,
      };
      setConversationHistory((prev) => [...prev, matsyaMsg]);

      await new Promise((r) => setTimeout(r, 150));

      if (currentTaskIdRef.current !== newTaskId) return;

      // 7. SPEAKING STATE (Send to TTS exactly ONCE)
      setTaskState('SPEAKING');
      const textToSpeak = orchestrationResult.spokenText || orchestrationResult.answer;

      MarineVoiceService.speak(
        textToSpeak,
        selectedLanguage,
        newTaskId,
        () => {
          // 8. On audio completion: SPEAKING -> COMPLETED -> IDLE
          if (currentTaskIdRef.current === newTaskId) {
            setTaskState('COMPLETED');
            isExecutingRef.current = false;
            // Transition smoothly to IDLE after a short pause, waiting for next user action
            setTimeout(() => {
              if (currentTaskIdRef.current === newTaskId) {
                setTaskState('IDLE');
              }
            }, 600);
          }
        }
      );
    } catch (err) {
      console.error('[VoiceAssistantModal] Task execution failed:', err);
      isExecutingRef.current = false;
      setTaskState('IDLE');
    }
  };

  /**
   * User clicks the microphone to begin listening.
   */
  const handleStartListening = () => {
    // Stop any ongoing speech or task
    MarineVoiceService.stopAll();
    currentTaskIdRef.current = null;
    isExecutingRef.current = false;
    setTranscript('');
    setTaskState('LISTENING');

    MarineVoiceService.playBeep(600, 100);

    const started = MarineVoiceService.startListening(
      selectedLanguage,
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          // Immediately stop listening so mic is closed
          MarineVoiceService.stopListening();
          startNewTask(text.trim());
        }
      },
      (err) => {
        console.warn('[VoiceAssistantModal] Recognition error:', err);
        setTaskState('IDLE');
      },
      () => {
        // Recognition naturally ended
        setTaskState((prevState) => (prevState === 'LISTENING' ? 'IDLE' : prevState));
      }
    );

    if (!started) {
      setTaskState('IDLE');
    }
  };

  /**
   * User explicitly stops listening by clicking mic off.
   */
  const handleStopListening = () => {
    MarineVoiceService.stopListening();
    if (transcript.trim()) {
      startNewTask(transcript.trim());
    } else {
      setTaskState('IDLE');
    }
  };

  /**
   * Stop current speech playback immediately and transition to IDLE.
   */
  const handleStopSpeaking = () => {
    MarineVoiceService.stopSpeaking();
    isExecutingRef.current = false;
    setTaskState('IDLE');
  };

  // State Badge styling
  const getStateBadge = () => {
    switch (taskState) {
      case 'LISTENING':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
            <Radio className="w-3 h-3 text-rose-600 animate-ping" />
            LISTENING (MIC ACTIVE)
          </span>
        );
      case 'PLANNING':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
            PLANNING DAG
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            SUB-AGENTS EXECUTING
          </span>
        );
      case 'SYNTHESIZING':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            SYNTHESIZING XAI
          </span>
        );
      case 'SPEAKING':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-teal-600 animate-pulse" />
            SPEAKING (VOICE TTS)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            TASK COMPLETED
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#F0F0F0] text-[#555555] border border-[#E0E0E0]">
            IDLE (READY)
          </span>
        );
    }
  };

  const isBusy = taskState === 'PLANNING' || taskState === 'EXECUTING' || taskState === 'SYNTHESIZING';

  return (
    <div id="matsya-voice-assistant-modal" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="p-4 bg-[#F7F7F5] border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">MATSYA AI Voice Assistant</h3>
                {getStateBadge()}
              </div>
              <p className="text-[11px] text-[#555555]">Task-Based Autonomous Marine Intelligence Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-white rounded-lg border border-[#E5E5E5] px-2 py-1 text-xs shadow-xs">
              <Languages className="w-3.5 h-3.5 text-[#555555] mr-1.5" />
              <select
                id="voice-language-select"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isBusy}
                className="bg-transparent text-[#111111] focus:outline-hidden text-xs cursor-pointer font-medium disabled:opacity-50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white text-[#111111]">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                MarineVoiceService.stopAll();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white hover:bg-[#F7F7F5] border border-[#E5E5E5] text-[#555555] hover:text-[#111111] transition"
              title="Close Voice Assistant"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar bg-white">
          {conversationHistory.length === 0 && (
              <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] text-[#111111] mx-auto flex items-center justify-center shadow-xs">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#111111]">Tap the microphone and ask MATSYA AI</h4>
              <p className="text-xs text-[#555555] max-w-md mx-auto">
                Speak in Tamil, Hindi, Telugu, Malayalam, Kannada, or English. MATSYA AI executes silent domain sub-agents and provides a single synthesized spoken response.
              </p>

              {/* Sample Prompts */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  'Where is the nearest favourable fishing zone today?',
                  'Is it safe to venture into the sea tomorrow morning?',
                  'Show regions with high chlorophyll and favourable SST',
                  'Why has fish catch declined in this coastal zone?',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    disabled={isBusy}
                    onClick={() => startNewTask(sample)}
                    className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] hover:border-[#111111] text-left text-xs text-[#111111] hover:bg-white transition group flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{sample}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#111111] shrink-0 ml-1 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#111111] text-white rounded-br-none shadow-xs'
                    : 'bg-[#F7F7F5] border border-[#E5E5E5] text-[#111111] rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 opacity-75 text-[10px]">
                  <span className="font-bold uppercase tracking-wider">{msg.role === 'user' ? 'You' : 'MATSYA AI Synthesis'}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Active Processing Indicator */}
          {isBusy && (
            <div className="flex items-center gap-2.5 p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] text-xs text-[#111111] animate-pulse max-w-md">
              <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
              <span>
                {taskState === 'PLANNING' && 'Planner Agent: Resolving DAG task execution graph...'}
                {taskState === 'EXECUTING' && 'Silent Execution: Ingesting satellite SST, SWAN waves, and geofence...'}
                {taskState === 'SYNTHESIZING' && 'Synthesis Agent: Fusing evidence into a single concise advisory...'}
              </span>
            </div>
          )}

          {/* Active Result Action Card */}
          {result && !isBusy && (
            <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Corroborated Evidence (Confidence: {result.confidence}%)
                </span>
                <span className="text-[10px] font-mono text-[#555555]">
                  {result.steps.length} Sub-Agents Coordinated
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {taskState === 'SPEAKING' && (
                  <button
                    onClick={handleStopSpeaking}
                    className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-medium text-xs flex items-center gap-1.5"
                  >
                    <Square className="w-3 h-3 text-rose-700 fill-rose-700" />
                    <span>Stop Spoken Audio</span>
                  </button>
                )}

                {onViewTacticalMap && (
                  <button
                    onClick={() => {
                      MarineVoiceService.stopAll();
                      onViewTacticalMap();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md bg-[#111111] hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View on Coastal Map</span>
                  </button>
                )}
                {onViewGlobalGlobe && (
                  <button
                    onClick={() => {
                      MarineVoiceService.stopAll();
                      onViewGlobalGlobe();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E5E5E5] text-[#111111] font-medium text-xs flex items-center gap-1.5"
                  >
                    <span>Inspect 3D Earth Globe</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input & Voice Control Bar */}
        <div className="p-4 bg-[#F7F7F5] border-t border-[#E5E5E5] flex flex-col gap-2.5">
          {/* Active Transcript Feedback while Listening */}
          {taskState === 'LISTENING' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-pulse">
              <Radio className="w-4 h-4 text-rose-600 animate-ping" />
              <span className="font-medium">{transcript || 'Listening to your voice... Speak now.'}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              id="voice-chat-text-input"
              value={transcript}
              disabled={isBusy}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && transcript.trim() && !isBusy) {
                  startNewTask(transcript);
                }
              }}
              placeholder={
                isBusy 
                  ? 'Task in progress...' 
                  : `Ask in ${SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name}...`
              }
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] placeholder-[#777777] focus:outline-hidden focus:border-[#111111] disabled:bg-gray-100"
            />

            {/* Mic Button: Starts or Stops Listening */}
            <button
              id="voice-mic-record-btn"
              disabled={isBusy || !recognitionSupported}
              onClick={() => {
                if (taskState === 'LISTENING') {
                  handleStopListening();
                } else {
                  handleStartListening();
                }
              }}
              title={
                !recognitionSupported
                  ? 'Speech recognition not supported in this browser. Use Chrome/Edge on desktop or a Chromium-based browser.'
                  : taskState === 'LISTENING'
                  ? 'Stop Listening'
                  : 'Speak to MATSYA AI'
              }
              className={`p-2.5 rounded-lg font-semibold transition flex items-center justify-center shadow-xs disabled:opacity-40 ${
                taskState === 'LISTENING'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#111111] text-white hover:bg-black'
              }`}
            >
              {taskState === 'LISTENING' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button: Starts Task with Input Text */}
            <button
              id="voice-chat-send-btn"
              disabled={!transcript.trim() || isBusy}
              onClick={() => {
                if (transcript.trim()) {
                  startNewTask(transcript);
                }
              }}
              title="Submit Query to MATSYA AI"
              className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F5] disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
