/* =========================================================
   AudioManager — isolated from the rest of the Zynox site.
   Sounds are synthesized with WebAudio, so there are no
   external sound files to 404. WebAudio failures are safe.
========================================================= */

export class AudioManager {
  constructor({ getSettings } = {}) {
    this.getSettings = getSettings || (() => ({ soundOn: true, sfxVolume: 0.5 }));
    this.ctx = null;
    this.unlocked = false;
  }

  _ensureContext() {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      return this.ctx;
    } catch (_) {
      return null;
    }
  }

  unlock() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      this.unlocked = true;
    } catch (_) {}
  }

  _play(build) {
    try {
      const settings = this.getSettings() || {};
      if (settings.soundOn === false) return;
      const ctx = this._ensureContext();
      if (!ctx || ctx.state === "closed") return;
      const volume = typeof settings.sfxVolume === "number" ? settings.sfxVolume : 0.5;
      if (volume <= 0) return;
      build(ctx, volume);
    } catch (_) {}
  }

  _tone(ctx, volume, { freq, duration, type = "sine", startGain = 0.28, freqEnd = null, delay = 0 }) {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(startGain * volume, 0.0001), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  _noise(ctx, volume, { duration, startGain = 0.22, delay = 0, filterFreq = 1200 }) {
    const now = ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(startGain * volume, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  uiClick() { this._play((ctx, v) => this._tone(ctx, v, { freq: 420, duration: 0.06, type: "square", startGain: 0.14 })); }
  countdownTick(isGo) { this._play((ctx, v) => this._tone(ctx, v, { freq: isGo ? 660 : 340, duration: isGo ? 0.24 : 0.12, type: "square", startGain: 0.22 })); }
  bucketReady() { this._play((ctx, v) => this._tone(ctx, v, { freq: 260, duration: 0.08, type: "triangle", startGain: 0.16 })); }
  waterPlace() { this._play((ctx, v) => { this._noise(ctx, v, { duration: 0.22, startGain: 0.3, filterFreq: 1800 }); this._tone(ctx, v, { freq: 520, freqEnd: 180, duration: 0.2, type: "sine", startGain: 0.18 }); }); }
  gradeGood() { this._play((ctx, v) => this._tone(ctx, v, { freq: 520, duration: 0.16, type: "sine", startGain: 0.22 })); }
  gradeMlg() { this._play((ctx, v) => { this._tone(ctx, v, { freq: 520, duration: 0.12, type: "sine", startGain: 0.24 }); this._tone(ctx, v, { freq: 780, duration: 0.16, type: "sine", startGain: 0.22, delay: 0.09 }); }); }
  gradePerfect() { this._play((ctx, v) => { this._tone(ctx, v, { freq: 620, duration: 0.1, type: "sine", startGain: 0.26 }); this._tone(ctx, v, { freq: 880, duration: 0.12, type: "sine", startGain: 0.26, delay: 0.08 }); this._tone(ctx, v, { freq: 1180, duration: 0.22, type: "sine", startGain: 0.24, delay: 0.16 }); }); }
  death() { this._play((ctx, v) => { this._tone(ctx, v, { freq: 220, freqEnd: 60, duration: 0.4, type: "sawtooth", startGain: 0.22 }); this._noise(ctx, v, { duration: 0.3, startGain: 0.2, filterFreq: 600 }); }); }
  newRecord() { this._play((ctx, v) => [520, 660, 780, 980].forEach((freq, i) => this._tone(ctx, v, { freq, duration: 0.18, type: "square", startGain: 0.18, delay: i * 0.09 }))); }
  comboTick() { this._play((ctx, v) => this._tone(ctx, v, { freq: 700, duration: 0.05, type: "square", startGain: 0.12 })); }
  achievementUnlock() { this._play((ctx, v) => { this._tone(ctx, v, { freq: 440, duration: 0.14, type: "triangle", startGain: 0.2 }); this._tone(ctx, v, { freq: 660, duration: 0.2, type: "triangle", startGain: 0.2, delay: 0.1 }); }); }
  button() { this._play((ctx, v) => this._tone(ctx, v, { freq: 340, duration: 0.05, type: "square", startGain: 0.14 })); }
}
