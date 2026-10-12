// src/audio.js — Procedural Web Audio Sound Engine (Zero external assets needed)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // Default muted for respectful UX
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  toggleMute() {
    this.init();
    if (!this.ctx) return this.isMuted;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.startAmbientSpace();
      this.playTone(520, 'sine', 0.15, 0.1);
    } else {
      this.stopAmbientSpace();
    }
    return this.isMuted;
  }

  startAmbientSpace() {
    if (!this.ctx || this.isMuted) return;
    try {
      if (this.ambientOsc1) return;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.035, this.ctx.currentTime + 3.0);
      this.ambientGain.connect(this.ctx.destination);

      // Deep harmonic cosmic frequency (55Hz sub + 110Hz warm overtone)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch (e) {}
  }

  stopAmbientSpace() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        if (this.ambientOsc1) { this.ambientOsc1.stop(); this.ambientOsc1 = null; }
        if (this.ambientOsc2) { this.ambientOsc2.stop(); this.ambientOsc2 = null; }
      }, 1000);
    } catch (e) {}
  }

  // Crisp mechanical tactile UI click
  playClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // Melodic celebratory chime on correct answer with dynamic streak pitch
  playCorrect(streak = 1) {
    if (!this.ctx || this.isMuted) return;
    try {
      const baseFreq = 523.25; // C5
      const intervalMultiplier = Math.min(2.0, 1 + ((streak - 1) * 0.08));
      const root = baseFreq * intervalMultiplier;

      const freqs = [root, root * 1.25, root * 1.5, root * 2.0]; // Major chord arpeggio
      freqs.forEach((f, idx) => {
        setTimeout(() => {
          this.playTone(f, 'triangle', 0.22, 0.14);
        }, idx * 60);
      });
    } catch (e) {}
  }

  // Low dramatic buzz on wrong answer
  playWrong() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // Ultra-rewarding fanfare for high streak / combo
  playStreak(streak) {
    if (!this.ctx || this.isMuted) return;
    try {
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((f, idx) => {
        setTimeout(() => {
          this.playTone(f, 'sine', 0.28, 0.16);
        }, idx * 45);
      });
    } catch (e) {}
  }

  // Smooth cinematic planetary flyTo whoosh
  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.2);
      filter.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  playTone(freq, type = 'sine', duration = 0.2, volume = 0.1) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
}

export const sounds = new SoundEngine();
