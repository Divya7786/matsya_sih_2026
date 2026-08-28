// Voice service for MATSYA AI — supports Web Speech Recognition + TTS for Indian regional languages.
// Safari-safe: uses stop() not abort(), tracks bestTranscript for isFinal=false fallback,
// adds 80ms delay between cancel() and speak(), and provides a MediaRecorder+Gemini fallback.

export class MarineVoiceService {
  private static recognition: any = null;
  private static isListeningState = false;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static mediaStream: MediaStream | null = null;
  private static mediaRecorder: MediaRecorder | null = null;

  static readonly LANG_MAP: Record<string, string> = {
    ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', ml: 'ml-IN',
    kn: 'kn-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN',
    pa: 'pa-IN', or: 'or-IN', en: 'en-IN',
  };

  // ── Capability checks ──────────────────────────────────────────────────────

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  static isListening(): boolean { return this.isListeningState; }

  static isSpeaking(): boolean { return !!(this.synth?.speaking); }

  // ── Pre-warm microphone (call on component mount, before first listen) ─────

  static async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      console.log('[VOICE] Microphone permission granted');
      return true;
    } catch (err: any) {
      console.warn('[VOICE] Microphone permission denied:', err?.message);
      return false;
    }
  }

  // ── Pre-load TTS voices (Safari loads them async — call on mount) ──────────

  static async preloadVoices(): Promise<void> {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) { this.cachedVoices = voices; return; }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000);
      if (typeof this.synth!.onvoiceschanged !== 'undefined') {
        this.synth!.onvoiceschanged = () => {
          clearTimeout(timer);
          this.cachedVoices = this.synth!.getVoices();
          resolve();
        };
      } else {
        let tries = 0;
        const poll = setInterval(() => {
          const v = this.synth!.getVoices();
          if (v.length > 0 || ++tries > 20) {
            clearInterval(poll); clearTimeout(timer);
            this.cachedVoices = v; resolve();
          }
        }, 100);
      }
    });
    console.log(`[VOICE] Preloaded ${this.cachedVoices.length} TTS voices`);
  }

  // ── Speech Recognition ────────────────────────────────────────────────────

  static startListening(
    languageCode: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VOICE] webkitSpeechRecognition not available');
      onError('not_supported');
      return false;
    }

    // Stop any prior recognition or speech
    this.stopSpeaking();
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }

    const locale = this.LANG_MAP[languageCode] || 'en-IN';
    console.log(`[VOICE] Starting recognition — lang=${locale}`);

    try {
      const rec = new SpeechRecognition();
      this.recognition = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = locale;

      // Track best transcript across all result events.
      // Safari often fires onresult with isFinal=false and then fires onend
      // without ever firing isFinal=true. We capture the best interim so we
      // can submit it in onend if no final ever arrives.
      let bestTranscript = '';
      let finalFired = false;

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final.trim()) {
          bestTranscript = final.trim();
          finalFired = true;
          console.log(`[VOICE] Final: "${bestTranscript}"`);
          onResult(bestTranscript, true);
        } else if (interim.trim()) {
          bestTranscript = interim.trim();
          console.log(`[VOICE] Interim: "${interim.trim()}"`);
          onResult(interim.trim(), false);
        }
      };

      rec.onerror = (event: any) => {
        const code: string = event.error || 'unknown';
        console.warn('[VOICE] Recognition error:', code);
        this.isListeningState = false;
        const friendly: Record<string, string> = {
          'not-allowed': 'microphone_denied',
          'service-not-allowed': 'microphone_denied',
          'no-speech': 'no_speech',
          'network': 'network_error',
          'aborted': 'aborted',
          'audio-capture': 'mic_unavailable',
        };
        onError(friendly[code] || code);
      };

      rec.onend = () => {
        console.log(`[VOICE] onend — finalFired=${finalFired}, best="${bestTranscript}"`);
        // Safari fallback: submit best interim as final if no isFinal=true ever fired
        if (!finalFired && bestTranscript.trim()) {
          console.log('[VOICE] Safari fallback: submitting best interim as final');
          onResult(bestTranscript.trim(), true);
        }
        this.isListeningState = false;
        this.recognition = null;
        onEnd();
      };

      rec.start();
      this.isListeningState = true;
      console.log('[VOICE] Recognition started');
      return true;

    } catch (e: any) {
      console.error('[VOICE] Failed to start recognition:', e?.message);
      this.isListeningState = false;
      this.recognition = null;
      onError('start_failed');
      return false;
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        // Use stop() not abort() — stop() allows final results through before onend fires.
        // abort() fires onend synchronously and drops pending transcripts on Safari.
        this.recognition.stop();
        // Don't null recognition here — onend handler cleans up after final results arrive
      } catch {}
    }
    this.isListeningState = false;
  }

  // ── MediaRecorder fallback (Gemini STT) ────────────────────────────────────
  // Used when webkitSpeechRecognition is unavailable or unreliable.
  // Returned Promise resolves to a stop function; call it to end recording.

  static async startRecordingFallback(
    languageCode: string,
    onTranscript: (transcript: string) => void,
    onError: (err: string) => void,
    onStateChange: (state: 'recording' | 'processing' | 'done') => void
  ): Promise<() => void> {
    try {
      const stream = this.mediaStream || await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      this.mediaRecorder = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = async () => {
        onStateChange('processing');
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: blob.type, languageCode: this.LANG_MAP[languageCode] || 'en-IN' }),
            });
            if (res.ok) {
              const { transcript } = await res.json();
              if (transcript?.trim()) { onTranscript(transcript.trim()); }
              else { onError('empty_transcript'); }
            } else {
              onError('transcription_failed');
            }
          } catch {
            onError('transcription_failed');
          } finally {
            onStateChange('done');
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      onStateChange('recording');
      console.log('[VOICE] MediaRecorder started (Gemini fallback)');

      return () => {
        if (recorder.state === 'recording') recorder.stop();
        this.mediaRecorder = null;
      };
    } catch (err: any) {
      const code = err?.name === 'NotAllowedError' ? 'microphone_denied' : 'mic_unavailable';
      console.warn('[VOICE] MediaRecorder start failed:', err?.message);
      onError(code);
      onStateChange('done');
      return () => {};
    }
  }

  static stopRecordingFallback() {
    if (this.mediaRecorder?.state === 'recording') {
      try { this.mediaRecorder.stop(); } catch {}
    }
  }

  // ── Text-to-Speech ────────────────────────────────────────────────────────

  private static cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/[•✓►→★✦]/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

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

    // Cancel any in-progress speech first
    this.stopSpeaking();

    const cleanedText = this.cleanTextForSpeech(text);
    if (!cleanedText) { if (onComplete) onComplete(); return false; }

    const locale = this.LANG_MAP[languageCode] || 'en-IN';
    console.log(`[VOICE] Speaking — lang=${locale}, chars=${cleanedText.length}`);

    // Safari bug: calling speak() immediately after cancel() may silently fail.
    // A short delay (80ms) ensures the synthesis queue is flushed before enqueuing.
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        this.activeUtterance = utterance;
        utterance.lang = locale;
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Pick a matching voice using cached list (avoids empty-array on first call)
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.synth!.getVoices();
        const match = voices.find(v => {
          const vl = v.lang.replace('_', '-');
          return vl === locale || vl.startsWith(locale.split('-')[0] + '-');
        });
        if (match) {
          utterance.voice = match;
          console.log(`[VOICE] Using voice: ${match.name} (${match.lang})`);
        }

        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            this.activeUtterance = null;
            if (onComplete) onComplete();
          }
        };

        utterance.onend = finish;
        utterance.onerror = (e) => {
          console.warn('[VOICE] TTS onerror:', e.error);
          finish();
        };

        this.synth!.speak(utterance);

        // Safety net: some Safari versions get stuck — fire onComplete after max duration
        const wordCount = cleanedText.split(' ').length;
        const maxMs = Math.max(8000, wordCount * 650);
        setTimeout(() => { if (!done && !this.synth!.speaking) finish(); }, maxMs);

      } catch (e) {
        console.error('[VOICE] TTS error:', e);
        if (onComplete) onComplete();
      }
    }, 80);

    return true;
  }

  static stopSpeaking() {
    if (this.synth) { try { this.synth.cancel(); } catch {} }
    this.activeUtterance = null;
  }

  static stopAll() {
    this.stopListening();
    this.stopSpeaking();
    this.stopRecordingFallback();
  }

  // ── Audio beep ────────────────────────────────────────────────────────────

  static playBeep(freq = 880, durationMs = 150) {
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
    } catch {}
  }
}
