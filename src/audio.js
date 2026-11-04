/**
 * Audio Engine
 * Uses Web Audio API for zero-latency, zero-dependency sound effects,
 * with fallbacks and support for external audio clips.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    return this.muted;
  }

  // Synthesize procedural retro sound effects
  play(soundName, param = 1) {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (soundName) {
      case 'hit_stone': {
        // Crunchy short crack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);

        gain.gain.setValueAtTime(0.4 * Math.min(1.5, param), t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }

      case 'hit_ore': {
        // High crystalline chime
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        const baseFreq = 950 + Math.random() * 200;
        osc1.frequency.setValueAtTime(baseFreq, t);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, t);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.22);
        osc2.stop(t + 0.22);
        break;
      }

      case 'bounce': {
        // Springy pitch rise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(540, t + 0.14);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }

      case 'explode': {
        // Deep explosive boom with buffer noise
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.45);

        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(90, t);
        subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

        noise.connect(filter);
        subOsc.connect(gain);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        subOsc.start(t);
        noise.stop(t + 0.45);
        subOsc.stop(t + 0.45);
        break;
      }

      case 'upgrade': {
        // Ascending triumphant chime
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = t + idx * 0.07;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(start);
          osc.stop(start + 0.18);
        });
        break;
      }

      case 'repair': {
        // Healing warm double pulse
        [400, 600].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = t + idx * 0.09;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.14);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(start);
          osc.stop(start + 0.14);
        });
        break;
      }

      case 'spin': {
        // Mechanical click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.025);
        break;
      }

      case 'gameover': {
        // Descending dull bell
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.4);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }
    }
  }
}

