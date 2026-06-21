// ═══════════════════════════════════════════════
// Gary's Life — Audio System
// Procedural sound effects using Web Audio API
// ═══════════════════════════════════════════════

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
    this._volume = 0.4;
    this._splatBuffer = null;   // decoded splat.mp3
    this._splatLoading = false;
    this._railBuffer = null;    // decoded railgun.mp3
    this._railLoading = false;
    this._railSource = null;    // active looping beam source
    this._railGain = null;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
    this._loadSplat();    // preload the poop splat sound
    this._loadRailgun();  // preload the rail gun beam sound
  }

  // Load + decode the uploaded splat.mp3 once (fire-and-forget).
  _loadSplat() {
    if (this._splatBuffer || this._splatLoading || !this.ctx) return;
    this._splatLoading = true;
    fetch('sounds/splat.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => this.ctx.decodeAudioData(buf))
      .then(decoded => { this._splatBuffer = decoded; })
      .catch(e => console.warn('splat.mp3 load failed:', e))
      .finally(() => { this._splatLoading = false; });
  }

  // Load + decode the uploaded railgun.mp3 once (fire-and-forget).
  _loadRailgun() {
    if (this._railBuffer || this._railLoading || !this.ctx) return;
    this._railLoading = true;
    fetch('sounds/railgun.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => this.ctx.decodeAudioData(buf))
      .then(decoded => { this._railBuffer = decoded; })
      .catch(e => console.warn('railgun.mp3 load failed:', e))
      .finally(() => { this._railLoading = false; });
  }

  // Start the looping rail-gun beam sound (no-op if already playing).
  startRailgun() {
    this.ensureCtx();
    if (this._railSource) return;            // already firing
    if (!this._railBuffer) { this._loadRailgun(); return; } // not ready yet
    const src = this.ctx.createBufferSource();
    src.buffer = this._railBuffer;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0.7;
    src.connect(g);
    g.connect(this.masterGain);
    src.start();
    this._railSource = src;
    this._railGain = g;
  }

  // Stop the rail-gun beam sound with a tiny fade to avoid a click.
  stopRailgun() {
    if (!this._railSource) return;
    const src = this._railSource, g = this._railGain;
    this._railSource = null;
    this._railGain = null;
    try {
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      src.stop(t + 0.1);
    } catch (e) {
      try { src.stop(); } catch (_) {}
    }
  }

  // ─── Master Volume ──────────────────────────
  setMasterVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
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

  // ─── Bird Hit (feather poof + soft body thwack) ───────────────
  playBirdHit() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Airy feather poof (high-pass noise)
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
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.1);

    // Soft mid "thwack" so a hit feels like impact, not just hiss
    const thwack = this.ctx.createOscillator();
    thwack.type = 'triangle';
    thwack.frequency.setValueAtTime(420, t);
    thwack.frequency.exponentialRampToValueAtTime(180, t + 0.06);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.18, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    thwack.connect(tg);
    tg.connect(this.masterGain);
    thwack.start(t);
    thwack.stop(t + 0.08);
  }

  // ─── Poop Splat — plays the uploaded splat.mp3 (classic splat). ───────
  // Falls back to a synth squelch only if the file hasn't loaded yet.
  playPoopSplat() {
    this.ensureCtx();
    if (this._splatBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this._splatBuffer;
      const g = this.ctx.createGain();
      g.gain.value = 1.0;
      src.connect(g);
      g.connect(this.masterGain);
      src.start();
      return;
    }
    // Not decoded yet — kick off the load and use the synth splat just this once.
    this._loadSplat();
    this._playSynthSplat();
  }

  // Procedural fallback splat (used only until splat.mp3 has loaded).
  _playSynthSplat() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // 1) Wet noise smear — resonant low-pass that closes down (the "splat")
    const dur = 0.3;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1900, t);
    lp.frequency.exponentialRampToValueAtTime(240, t + dur);
    lp.Q.value = 7; // resonance gives it a squelchy character
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.55, t + 0.025);
    ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(lp);
    lp.connect(ng);
    ng.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + dur);

    // 2) Low wet "plop" — a fast descending sine (the mass landing)
    const plop = this.ctx.createOscillator();
    plop.type = 'sine';
    plop.frequency.setValueAtTime(230, t);
    plop.frequency.exponentialRampToValueAtTime(65, t + 0.18);
    const pg = this.ctx.createGain();
    pg.gain.setValueAtTime(0.5, t);
    pg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    plop.connect(pg);
    pg.connect(this.masterGain);
    plop.start(t);
    plop.stop(t + 0.2);

    // 3) Squelch texture — band-passed saw wobble
    const sq = this.ctx.createOscillator();
    sq.type = 'sawtooth';
    sq.frequency.setValueAtTime(170, t);
    sq.frequency.exponentialRampToValueAtTime(55, t + 0.13);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 480;
    bp.Q.value = 3.5;
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.22, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    sq.connect(bp);
    bp.connect(sg);
    sg.connect(this.masterGain);
    sq.start(t);
    sq.stop(t + 0.15);
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
