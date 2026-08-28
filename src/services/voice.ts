// Voice service for MATSYA AI — supports Web Speech Recognition + TTS for 11 Indian languages.
//
// KEY DESIGN DECISIONS:
//  1. requestMicPermission() releases the getUserMedia stream IMMEDIATELY after verifying
//     the permission is granted. Holding it open causes webkitSpeechRecognition on Safari
//     to fire onerror:'not-allowed' because the mic is already "in use".
//  2. Safari never fires isFinal=true before onend, so we track bestTranscript and submit
//     it from the onend handler when no final result was received.
//  3. MediaRecorder fallback always requests a fresh stream and releases it when done.
//  4. Comprehensive [VOICE DEBUG] console logs are always active in development.

// ── Centralized language configuration ───────────────────────────────────────
export interface LangConfig {
  label: string;
  nativeName: string;
  stt: string;  // BCP-47 for SpeechRecognition
  tts: string;  // BCP-47 for SpeechSynthesis
}

export const LANGUAGE_CONFIG: Record<string, LangConfig> = {
  en: { label: 'English',    nativeName: 'English',    stt: 'en-IN', tts: 'en-IN' },
  ta: { label: 'Tamil',      nativeName: 'தமிழ்',      stt: 'ta-IN', tts: 'ta-IN' },
  hi: { label: 'Hindi',      nativeName: 'हिन्दी',     stt: 'hi-IN', tts: 'hi-IN' },
  te: { label: 'Telugu',     nativeName: 'తెలుగు',     stt: 'te-IN', tts: 'te-IN' },
  ml: { label: 'Malayalam',  nativeName: 'മലയാളം',     stt: 'ml-IN', tts: 'ml-IN' },
  kn: { label: 'Kannada',    nativeName: 'ಕನ್ನಡ',      stt: 'kn-IN', tts: 'kn-IN' },
  bn: { label: 'Bengali',    nativeName: 'বাংলা',      stt: 'bn-IN', tts: 'bn-IN' },
  mr: { label: 'Marathi',    nativeName: 'मराठी',      stt: 'mr-IN', tts: 'mr-IN' },
  gu: { label: 'Gujarati',   nativeName: 'ગુજરાતી',    stt: 'gu-IN', tts: 'gu-IN' },
  pa: { label: 'Punjabi',    nativeName: 'ਪੰਜਾਬੀ',     stt: 'pa-IN', tts: 'pa-IN' },
  or: { label: 'Odia',       nativeName: 'ଓଡ଼ିଆ',      stt: 'or-IN', tts: 'or-IN' },
};

export class MarineVoiceService {
  private static recognition: any = null;
  private static isListeningState = false;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static mediaRecorder: MediaRecorder | null = null;
  // Set to true by stopAll() so that an in-progress MediaRecorder onstop does not upload
  private static recordingAborted = false;

  // Kept for backwards compatibility — use LANGUAGE_CONFIG.*.stt going forward
  static readonly LANG_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(LANGUAGE_CONFIG).map(([k, v]) => [k, v.stt])
  );

  // ── Diagnostics ───────────────────────────────────────────────────────────

  static readonly diagnostics = {
    browserSupport: false,
    webkitSupport: false,
    stdSupport: false,
    micPermission: 'unknown' as 'unknown' | 'granted' | 'denied',
    voicesLoaded: 0,
    lastSttCode: '',
    lastTtsCode: '',
    lastSelectedVoice: '',
    lastError: '',
    lastTranscript: '',
    lastProvider: '',
  };

  static log(level: 'info' | 'warn' | 'error', tag: string, ...args: any[]) {
    const prefix = `[VOICE] ${tag}`;
    if (level === 'error') console.error(prefix, ...args);
    else if (level === 'warn') console.warn(prefix, ...args);
    else console.log(prefix, ...args);
  }

  // ── Capability checks ──────────────────────────────────────────────────────

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const std = !!(window as any).SpeechRecognition;
    const wk = !!(window as any).webkitSpeechRecognition;
    this.diagnostics.stdSupport = std;
    this.diagnostics.webkitSupport = wk;
    this.diagnostics.browserSupport = std || wk;
    console.log('[VOICE DEBUG] browser support — SpeechRecognition:', std, '| webkitSpeechRecognition:', wk);
    return std || wk;
  }

  static isListening(): boolean { return this.isListeningState; }
  static isSpeaking(): boolean { return !!(this.synth?.speaking); }

  // ── Pre-warm microphone permission ────────────────────────────────────────
  // FIX: Release the stream IMMEDIATELY after permission is confirmed.
  // Holding a getUserMedia stream open causes webkitSpeechRecognition on Safari
  // to fire onerror:'not-allowed' because the mic is treated as already in use.

  static async requestMicPermission(): Promise<boolean> {
    console.log('[VOICE DEBUG] requestMicPermission — checking mic access');
    this.log('info', 'Microphone permission requested');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[VOICE DEBUG] getUserMedia not available in this browser');
      return false;
    }

    // If already granted (checked via Permissions API), skip the stream request
    if (typeof navigator.permissions !== 'undefined') {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') {
          this.diagnostics.micPermission = 'granted';
          console.log('[VOICE DEBUG] Microphone permission already GRANTED (Permissions API)');
          return true;
        }
        if (status.state === 'denied') {
          this.diagnostics.micPermission = 'denied';
          console.warn('[VOICE DEBUG] Microphone permission DENIED (Permissions API)');
          return false;
        }
        // 'prompt' — fall through to getUserMedia to trigger the dialog
      } catch {
        // Permissions API not fully supported (Safari) — fall through
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // CRITICAL: Release the stream immediately. We only needed it to trigger the
      // browser permission dialog. Holding the stream open conflicts with
      // webkitSpeechRecognition on Safari — it causes 'not-allowed' errors when
      // SpeechRecognition.start() is called while a getUserMedia stream is active.
      stream.getTracks().forEach(t => t.stop());
      this.diagnostics.micPermission = 'granted';
      console.log('[VOICE DEBUG] Microphone permission: GRANTED (stream released)');
      this.log('info', 'Microphone permission: GRANTED (stream released immediately)');
      return true;
    } catch (err: any) {
      this.diagnostics.micPermission = 'denied';
      const name = err?.name || 'UnknownError';
      console.warn('[VOICE DEBUG] Microphone permission DENIED:', name, err?.message);
      this.log('warn', `Microphone permission DENIED — ${name}: ${err?.message}`);
      return false;
    }
  }

  // ── Pre-load TTS voices (Safari loads them async — call on mount) ──────────

  static async preloadVoices(): Promise<void> {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.cachedVoices = voices;
      this.diagnostics.voicesLoaded = voices.length;
      this.log('info', `Voices already available: ${voices.length}`);
      return;
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2500);
      if (typeof this.synth!.onvoiceschanged !== 'undefined') {
        this.synth!.onvoiceschanged = () => {
          clearTimeout(timer);
          this.cachedVoices = this.synth!.getVoices();
          this.diagnostics.voicesLoaded = this.cachedVoices.length;
          resolve();
        };
      } else {
        let tries = 0;
        const poll = setInterval(() => {
          const v = this.synth!.getVoices();
          if (v.length > 0 || ++tries > 25) {
            clearInterval(poll); clearTimeout(timer);
            this.cachedVoices = v;
            this.diagnostics.voicesLoaded = v.length;
            resolve();
          }
        }, 100);
      }
    });
    this.log('info', `Preloaded ${this.cachedVoices.length} TTS voices`);
  }

  // ── Speech Recognition ────────────────────────────────────────────────────

  static startListening(
    languageCode: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    console.log('[VOICE DEBUG] microphone clicked — startListening(', languageCode, ')');
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    console.log('[VOICE DEBUG] SpeechRecognition API:', SpeechRecognition ? 'AVAILABLE' : 'NOT AVAILABLE');

    if (!SpeechRecognition) {
      console.warn('[VOICE DEBUG] No SpeechRecognition API — will use cloud STT fallback');
      this.log('warn', 'SpeechRecognition not available in this browser');
      this.diagnostics.lastError = 'not_supported';
      onError('not_supported');
      return false;
    }

    // Stop any prior recognition or speech before creating a new instance
    this.stopSpeaking();
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }

    const langCfg = LANGUAGE_CONFIG[languageCode];
    const locale = langCfg ? langCfg.stt : (this.LANG_MAP[languageCode] || 'en-IN');
    this.diagnostics.lastSttCode = locale;
    console.log('[VOICE DEBUG] recognition language:', locale, '(input code:', languageCode + ')');
    this.log('info', `Starting recognition — lang=${locale} (code=${languageCode})`);

    try {
      const rec = new SpeechRecognition();
      this.recognition = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = locale;

      // bestTranscript tracks the most recent usable transcript across all events.
      // Safari typically fires multiple onresult events with isFinal=false and then
      // fires onend without ever setting isFinal=true. We capture the best interim
      // here so we can submit it in onend if no true final result arrives.
      let bestTranscript = '';
      let finalFired = false;
      let recognitionStarted = false; // set true in onstart

      rec.onstart = () => {
        recognitionStarted = true;
        this.isListeningState = true;
        console.log('[VOICE DEBUG] recognition started — actively listening for lang:', locale);
        this.log('info', 'Recognition onstart fired — mic is open');
      };

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
          this.diagnostics.lastTranscript = bestTranscript;
          console.log('[VOICE DEBUG] final transcript:', JSON.stringify(bestTranscript));
          this.log('info', `Final transcript: "${bestTranscript}"`);
          onResult(bestTranscript, true);
        } else if (interim.trim()) {
          bestTranscript = interim.trim();
          console.log('[VOICE DEBUG] interim transcript:', JSON.stringify(interim.trim()));
          this.log('info', `Interim: "${interim.trim()}"`);
          onResult(interim.trim(), false);
        }
      };

      rec.onerror = (event: any) => {
        const code: string = event.error || 'unknown';
        this.diagnostics.lastError = code;
        console.warn('[VOICE DEBUG] recognition error:', code, '| recognitionStarted:', recognitionStarted);
        this.log('warn', `Recognition error: ${code}`);
        this.isListeningState = false;
        const friendly: Record<string, string> = {
          'not-allowed':          'microphone_denied',
          'service-not-allowed':  'microphone_denied',
          'no-speech':            'no_speech',
          'network':              'network_error',
          'aborted':              'aborted',
          'audio-capture':        'mic_unavailable',
          'language-not-supported': 'language_not_supported',
        };
        const mapped = friendly[code] || code;
        console.log('[VOICE DEBUG] mapped error:', mapped);
        onError(mapped);
      };

      rec.onend = () => {
        console.log(
          '[VOICE DEBUG] recognition ended — finalFired:', finalFired,
          '| best:', JSON.stringify(bestTranscript),
          '| recognitionStarted:', recognitionStarted
        );
        this.log('info', `onend — finalFired=${finalFired}, best="${bestTranscript}"`);

        // Safari fallback: submit best interim as final if no isFinal=true ever fired
        if (!finalFired && bestTranscript.trim()) {
          console.log('[VOICE DEBUG] Safari fallback — submitting best interim as final:', JSON.stringify(bestTranscript));
          this.log('info', `Safari fallback: submitting "${bestTranscript}" as final`);
          this.diagnostics.lastTranscript = bestTranscript;
          onResult(bestTranscript.trim(), true);
          // Return here — onEnd callback will be called next and FishermanView checks
          // isExecutingRef to avoid showing "no speech" after a successful submission
        }

        this.isListeningState = false;
        this.recognition = null;
        console.log('[VOICE DEBUG] calling onEnd callback');
        onEnd();
      };

      console.log('[VOICE DEBUG] calling rec.start() — lang:', locale);
      rec.start();
      this.isListeningState = true;
      this.log('info', 'rec.start() called — recognition active');
      return true;

    } catch (e: any) {
      console.error('[VOICE DEBUG] EXCEPTION in rec.start():', e?.name, e?.message);
      this.log('error', `Failed to start recognition: ${e?.message}`);
      this.diagnostics.lastError = e?.message || 'start_failed';
      this.isListeningState = false;
      this.recognition = null;
      onError('start_failed');
      return false;
    }
  }

  static stopListening() {
    if (this.recognition) {
      try {
        // Use stop() not abort() — stop() lets final results come through before onend.
        // abort() fires onend synchronously and drops pending transcripts on Safari.
        this.recognition.stop();
      } catch {}
    }
    this.isListeningState = false;
  }

  // ── MediaRecorder fallback (Cloud STT via /api/voice/transcribe) ───────────
  // Used when webkitSpeechRecognition is unavailable or fires not_supported.
  // ALWAYS requests a fresh getUserMedia stream and releases it after recording.

  static async startRecordingFallback(
    languageCode: string,
    onTranscript: (transcript: string) => void,
    onError: (err: string) => void,
    onStateChange: (state: 'recording' | 'processing' | 'done') => void
  ): Promise<() => void> {
    const locale = LANGUAGE_CONFIG[languageCode]?.stt || 'en-IN';
    console.log('[VOICE DEBUG] startRecordingFallback — locale:', locale);
    this.recordingAborted = false;

    let stream: MediaStream | null = null;
    try {
      // Always request a fresh stream — never reuse a cached one
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4')              ? 'audio/mp4' : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      this.mediaRecorder = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = async () => {
        // Release mic tracks immediately when recording stops
        stream?.getTracks().forEach(t => t.stop());

        // If stopAll() was called (aborted), do not upload
        if (this.recordingAborted) {
          console.log('[VOICE DEBUG] recording aborted — skipping upload');
          onStateChange('done');
          return;
        }

        onStateChange('processing');
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        console.log('[VOICE DEBUG] MediaRecorder stopped — uploading', Math.round(blob.size / 1024), 'KB to /api/voice/transcribe');

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: blob.type, languageCode: locale }),
            });

            if (res.ok) {
              const data = await res.json();
              console.log('[VOICE DEBUG] cloud STT response — provider:', data.provider, '| transcript:', JSON.stringify(data.transcript));
              this.diagnostics.lastProvider = data.provider || 'cloud';
              const transcript = (data.transcript || '').trim();
              if (transcript) {
                this.diagnostics.lastTranscript = transcript;
                console.log('[VOICE DEBUG] sending transcript to agent:', JSON.stringify(transcript));
                onTranscript(transcript);
              } else {
                console.warn('[VOICE DEBUG] cloud STT returned empty transcript');
                onError('empty_transcript');
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              console.error('[VOICE DEBUG] cloud STT HTTP error:', res.status, errData.error || errData);
              if (res.status === 503) {
                onError('cloud_stt_not_configured');
              } else {
                onError('transcription_failed');
              }
            }
          } catch (fetchErr) {
            console.error('[VOICE DEBUG] cloud STT network error:', fetchErr);
            onError('transcription_failed');
          } finally {
            onStateChange('done');
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      onStateChange('recording');
      console.log('[VOICE DEBUG] MediaRecorder started — cloud STT fallback active');
      this.log('info', 'MediaRecorder started (cloud STT fallback)');

      // Return stop function (called when user taps mic again to end recording)
      return () => {
        if (recorder.state === 'recording') {
          recorder.stop(); // triggers onstop → upload
        } else {
          stream?.getTracks().forEach(t => t.stop());
        }
        this.mediaRecorder = null;
      };

    } catch (err: any) {
      stream?.getTracks().forEach(t => t.stop());
      const code = err?.name === 'NotAllowedError' ? 'microphone_denied' : 'mic_unavailable';
      console.warn('[VOICE DEBUG] MediaRecorder start failed:', err?.name, err?.message);
      this.log('warn', `MediaRecorder start failed: ${err?.message}`);
      onError(code);
      onStateChange('done');
      return () => {};
    }
  }

  static stopRecordingFallback() {
    this.recordingAborted = true; // Prevents onstop from uploading
    if (this.mediaRecorder?.state === 'recording') {
      try { this.mediaRecorder.stop(); } catch {}
    }
    this.mediaRecorder = null;
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

  // Select the best available TTS voice for the given BCP-47 locale.
  // Strategy: exact match → language-prefix match → en-IN → first available.
  private static selectVoice(locale: string): SpeechSynthesisVoice | null {
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : (this.synth?.getVoices() ?? []);
    if (!voices.length) return null;

    const norm = (s: string) => s.replace('_', '-').toLowerCase();
    const locLower = norm(locale);
    const langPrefix = locLower.split('-')[0];

    // 1. Exact locale match (e.g., ta-IN)
    let match = voices.find(v => norm(v.lang) === locLower);
    if (match) return match;

    // 2. Same language, any region (e.g., ta-SG when ta-IN unavailable)
    match = voices.find(v => norm(v.lang).startsWith(langPrefix + '-'));
    if (match) return match;

    // 3. en-IN fallback for non-Latin scripts where browser has no native voice
    if (langPrefix !== 'en') {
      match = voices.find(v => norm(v.lang) === 'en-in') ||
               voices.find(v => norm(v.lang).startsWith('en-'));
      if (match) return match;
    }

    // 4. Any voice as last resort
    return voices[0] ?? null;
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

    this.stopSpeaking();

    const cleanedText = this.cleanTextForSpeech(text);
    if (!cleanedText) { if (onComplete) onComplete(); return false; }

    const langCfg = LANGUAGE_CONFIG[languageCode];
    const locale = langCfg ? langCfg.tts : (this.LANG_MAP[languageCode] || 'en-IN');
    this.diagnostics.lastTtsCode = locale;
    this.log('info', `Speaking — lang=${locale} (code=${languageCode}), chars=${cleanedText.length}`);

    // Safari bug: calling speak() immediately after cancel() may silently fail.
    // An 80ms delay ensures the synthesis queue is flushed before enqueuing.
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        this.activeUtterance = utterance;
        utterance.lang = locale;
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voice = this.selectVoice(locale);
        if (voice) {
          utterance.voice = voice;
          this.diagnostics.lastSelectedVoice = `${voice.name} (${voice.lang})`;
          this.log('info', `TTS voice: ${voice.name} (${voice.lang})`);
        } else {
          this.diagnostics.lastSelectedVoice = 'browser default';
          this.log('info', 'TTS voice: browser default');
        }

        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            this.activeUtterance = null;
            this.log('info', 'TTS completed');
            if (onComplete) onComplete();
          }
        };

        utterance.onend = finish;
        utterance.onerror = (e) => {
          this.log('warn', `TTS onerror: ${e.error}`);
          this.diagnostics.lastError = `TTS:${e.error}`;
          finish();
        };

        this.synth!.speak(utterance);

        // Safety net: some Safari versions get stuck — fire onComplete after max duration
        const wordCount = cleanedText.split(' ').length;
        const maxMs = Math.max(8000, wordCount * 650);
        setTimeout(() => { if (!done && !this.synth!.speaking) finish(); }, maxMs);

      } catch (e: any) {
        this.log('error', `TTS error: ${e?.message}`);
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
