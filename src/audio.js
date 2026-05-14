// ═══════════════════════════════════════════════
// Gary's Life — Audio System
// Procedural sound effects using Web Audio API
// ═══════════════════════════════════════════════

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  ensureCtx() {
    if (!this.initialized) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ─── Gunshot ───────────────────────────────
  playGunshot(weaponType = 'rifle') {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Noise burst for the crack
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(weaponType === 'shotgun' ? 0.8 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.2);

    // Low thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // ─── Bird Hit (feather poof) ───────────────
  playBirdHit() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Short soft noise
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.1);
  }

  // ─── Cash Register ─────────────────────────
  playCashRegister() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Bright ding
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // Second ding (harmony)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3200, t + 0.05);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.15, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.35);
  }

  // ─── Ambient Bird Chirps ───────────────────
  playChirp(pitch = 1.0) {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const baseFreq = 3000 * pitch + Math.random() * 500;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.setValueAtTime(baseFreq * 1.2, t + 0.03);
    osc.frequency.setValueAtTime(baseFreq * 0.9, t + 0.06);
    osc.frequency.setValueAtTime(baseFreq * 1.1, t + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.06);
    gain.gain.linearRampToValueAtTime(0, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // ─── Reload Sound ──────────────────────────
  playReload() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Click
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.05);

    // Bolt action
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t + 0.2);
    osc.frequency.linearRampToValueAtTime(400, t + 0.25);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, t + 0.19);
    gain2.gain.linearRampToValueAtTime(0.12, t + 0.2);
    gain2.gain.linearRampToValueAtTime(0, t + 0.28);
    osc.connect(gain2);
    gain2.connect(this.masterGain);
    osc.start(t + 0.19);
    osc.stop(t + 0.3);
  }

  // ─── Empty Click ───────────────────────────
  playEmptyClick() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // ─── UI Click ──────────────────────────────
  playUIClick() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // ─── Ambient nature loop ───────────────────
  startAmbience() {
    if (this._ambientInterval) return;
    this._ambientInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        this.playChirp(0.7 + Math.random() * 0.6);
      }
    }, 2000 + Math.random() * 3000);
  }

  stopAmbience() {
    if (this._ambientInterval) {
      clearInterval(this._ambientInterval);
      this._ambientInterval = null;
    }
  }
}
