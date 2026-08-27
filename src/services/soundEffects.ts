// UI Sound Effects Service (Web Audio API Synthesizer)
// Provides clean, realistic marine-themed acoustic feedback for UI interactions without external audio file dependencies.

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private storageKey = 'matsya_ui_sound_effects_enabled';

  constructor() {
    // Check localStorage preference
    const saved = localStorage.getItem(this.storageKey);
    if (saved !== null) {
      this.isEnabled = saved === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleSound(): boolean {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem(this.storageKey, String(this.isEnabled));
    if (this.isEnabled) {
      this.play('toggle');
    }
    return this.isEnabled;
  }

  public play(type: 'click' | 'sonar' | 'toggle' | 'nav' | 'alert' | 'modal') {
    if (!this.isEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'click') {
        // Subtle clean UI click pulse (1800Hz -> 600Hz, 35ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'sonar') {
        // Marine Hydrophone Sonar Ping (1050Hz crystal chime with gentle decay)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6 Note
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'toggle') {
        // Double blip for toggle action
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain1.gain.setValueAtTime(0.05, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.09);
      } else if (type === 'nav') {
        // Soft acoustic tab switch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'modal') {
        // Harmonic chord open
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          gain.gain.setValueAtTime(0.025, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 0.22);
        });
      }
    } catch (e) {
      console.warn('Sound effect execution:', e);
    }
  }
}

export const soundEffects = new SoundEffectsService();
