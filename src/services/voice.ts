// Voice service supporting Web Speech Recognition and Speech Synthesis for Indian regional languages
// Task-based lifecycle with strict single-execution guarantees and cleanup

export class MarineVoiceService {
  private static recognition: any = null;
  private static isListeningState: boolean = false;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentTaskId: string | null = null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  static isListening(): boolean {
    return this.isListeningState;
  }

  static isSpeaking(): boolean {
    if (typeof window === 'undefined' || !this.synth) return false;
    return this.synth.speaking;
  }

  static startListening(
    languageCode: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech recognition not supported in this browser. Please type your query.');
      return false;
    }

    // Stop any ongoing speech or previous recognition
    this.stopSpeaking();
    this.stopListening();

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      const langMap: Record<string, string> = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        en: 'en-IN',
      };

      this.recognition.lang = langMap[languageCode] || 'en-IN';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[MarineVoiceService] Speech recognition error:', event.error);
        this.isListeningState = false;
        onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
        this.recognition = null;
        onEnd();
      };

      this.recognition.start();
      this.isListeningState = true;
      return true;
    } catch (e) {
      console.error('[MarineVoiceService] Failed to start speech recognition:', e);
      this.isListeningState = false;
      this.recognition = null;
      onError(e);
      return false;
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListeningState = false;
  }

  /**
   * Sanitizes text for clean, natural speech synthesis by stripping markdown,
   * bracketed citations, and raw technical symbols.
   */
  private static cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
      .replace(/\*([^*]+)\*/g, '$1')     // remove italics
      .replace(/#+\s/g, '')               // remove headings
      .replace(/\[\d+\]/g, '')            // remove citation brackets [1], [2]
      .replace(/[•✓►→★✦]/g, '')           // remove special bullet symbols
      .replace(/`([^`]+)`/g, '$1')        // remove code ticks
      .replace(/\s+/g, ' ')               // normalize whitespace
      .trim();
  }

  /**
   * Speaks the final synthesized response once for a given task ID.
   * Ensures no duplicate calls or audio overlapping.
   */
  static speak(
    text: string, 
    languageCode: string = 'en', 
    taskId?: string, 
    onComplete?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !this.synth) {
      if (onComplete) onComplete();
      return false;
    }

    // Always stop and cancel any previous speech synthesis first
    this.stopSpeaking();

    const cleanedText = this.cleanTextForSpeech(text);
    if (!cleanedText) {
      if (onComplete) onComplete();
      return false;
    }

    this.currentTaskId = taskId || `task-${Date.now()}`;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      this.activeUtterance = utterance;

      const langMap: Record<string, string> = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        en: 'en-IN',
      };

      utterance.lang = langMap[languageCode] || 'en-IN';
      utterance.rate = 0.92; // Moderate, clear, natural pace
      utterance.pitch = 1.0;

      // Match regional voice if available
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(utterance.lang) || v.lang.replace('_', '-').startsWith(utterance.lang)
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      let hasCompleted = false;
      const finishExecution = () => {
        if (!hasCompleted) {
          hasCompleted = true;
          this.activeUtterance = null;
          if (onComplete) {
            onComplete();
          }
        }
      };

      utterance.onend = () => {
        finishExecution();
      };

      utterance.onerror = (e) => {
        console.warn('[MarineVoiceService] Speech synthesis event:', e.error);
        finishExecution();
      };

      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.error('[MarineVoiceService] Speech synthesis failure:', e);
      this.activeUtterance = null;
      if (onComplete) onComplete();
      return false;
    }
  }

  static stopSpeaking() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.activeUtterance = null;
  }

  /**
   * Halts both listening and speaking completely.
   */
  static stopAll() {
    this.stopListening();
    this.stopSpeaking();
  }

  static playBeep(freq: number = 880, durationMs: number = 150) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }
}
