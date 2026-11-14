/**
 * Zero-dependency Web Audio synthesizer for Atelier OS:
 * - Ambient soundscapes (Night Rain, Lo-Fi Rhodes, Deep Orbit, Warm Hearth)
 * - Tactile Detent Dial ticks + UI feedback chimes
 */

export const TRACKS = [
  {
    id: 'rain',
    title: 'Gece Yağmuru & Cam',
    artist: 'Atelier Ambient · 432 Hz',
    bpm: '72 BPM',
    av: 6,
    mood: 'Yağmur yoğunluğu',
  },
  {
    id: 'lofi',
    title: 'Obsidian Lo-Fi Akorlar',
    artist: 'Rhodes + Plak Çıtırtısı',
    bpm: '84 BPM',
    av: 4,
    mood: 'Filtre sıcaklığı',
  },
  {
    id: 'orbit',
    title: 'Derin Yörünge Drone',
    artist: 'Sub Harmonik · Uzay',
    bpm: '60 BPM',
    av: 10,
    mood: 'Harmonik parlaklık',
  },
  {
    id: 'hearth',
    title: 'Atölye Şöminesi',
    artist: 'Odun Çıtırtısı & Pad',
    bpm: '68 BPM',
    av: 5,
    mood: 'Ortam derinliği',
  },
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.nodes = [];
    this.timers = [];
    this.playing = false;
    this.trackIdx = 0;
    this.mix = 0.44;
    this.analyser = null;
    this.freqData = null;
  }

  ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 600 + this.mix * 2800;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      this.filter.connect(this.master);
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tickSound(strength = 1) {
    try {
      this.ensureCtx();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100 + strength * 350, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.022);
      g.gain.setValueAtTime(0.06 * strength, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.026);
    } catch {
      /* ignore audio autoplay blocks before gesture */
    }
  }

  chime(freq = 587.33) {
    try {
      this.ensureCtx();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.14);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    } catch {
      /* ignore */
    }
  }

  setMix(normalized) {
    this.mix = Math.max(0, Math.min(1, normalized));
    if (this.filter && this.ctx) {
      this.filter.frequency.setTargetAtTime(420 + this.mix * 3600, this.ctx.currentTime, 0.05);
    }
    if (this.master && this.ctx && this.playing) {
      this.master.gain.setTargetAtTime(0.18 + this.mix * 0.34, this.ctx.currentTime, 0.06);
    }
  }

  stop() {
    this.playing = false;
    this.timers.forEach(id => clearInterval(id));
    this.timers = [];
    this.nodes.forEach(n => {
      try {
        n.stop?.();
        n.disconnect?.();
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
  }

  createNoiseBuffer(seconds = 3, pink = true) {
    const sr = this.ctx.sampleRate;
    const len = sr * seconds;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (!pink) {
        data[i] = white * 0.35;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;
      }
    }
    return buf;
  }

  play(idx = this.trackIdx) {
    this.stop();
    this.trackIdx = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
    this.ensureCtx();
    this.playing = true;
    const track = TRACKS[this.trackIdx];

    if (track.id === 'rain' || track.id === 'hearth') {
      const src = this.ctx.createBufferSource();
      src.buffer = this.createNoiseBuffer(4, true);
      src.loop = true;
      const g = this.ctx.createGain();
      g.gain.value = track.id === 'rain' ? 0.75 : 0.52;
      src.connect(g);
      g.connect(this.filter);
      src.start();
      this.nodes.push(src, g);

      const pad = this.ctx.createOscillator();
      pad.type = 'sine';
      pad.frequency.value = track.id === 'rain' ? 146.83 : 110;
      const pg = this.ctx.createGain();
      pg.gain.value = 0.06;
      pad.connect(pg);
      pg.connect(this.filter);
      pad.start();
      this.nodes.push(pad, pg);

      const timer = setInterval(() => {
        if (!this.playing || !this.ctx) return;
        if (Math.random() > 0.45) {
          const t = this.ctx.currentTime;
          const o = this.ctx.createOscillator();
          const dg = this.ctx.createGain();
          o.type = track.id === 'rain' ? 'sine' : 'triangle';
          const baseF = track.id === 'rain' ? 900 + Math.random() * 1400 : 180 + Math.random() * 420;
          o.frequency.setValueAtTime(baseF, t);
          o.frequency.exponentialRampToValueAtTime(baseF * 0.6, t + 0.08);
          dg.gain.setValueAtTime(0.035, t);
          dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
          o.connect(dg);
          dg.connect(this.filter);
          o.start(t);
          o.stop(t + 0.1);
        }
      }, 280);
      this.timers.push(timer);
    } else if (track.id === 'lofi') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(3, true);
      noise.loop = true;
      const ng = this.ctx.createGain();
      ng.gain.value = 0.18;
      noise.connect(ng);
      ng.connect(this.filter);
      noise.start();
      this.nodes.push(noise, ng);

      const chords = [
        [261.63, 329.63, 392.0, 493.88],
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 349.23],
      ];
      let step = 0;
      const playChord = () => {
        if (!this.playing || !this.ctx) return;
        const chord = chords[step % chords.length];
        step++;
        const t = this.ctx.currentTime;
        chord.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = f * 0.5;
          osc.detune.value = (i - 1.5) * 4;
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.06, t + 0.25);
          g.gain.exponentialRampToValueAtTime(0.001, t + 2.3);
          osc.connect(g);
          g.connect(this.filter);
          osc.start(t);
          osc.stop(t + 2.4);
        });
      };
      playChord();
      this.timers.push(setInterval(playChord, 2500));
    } else {
      const freqs = [65.41, 98.0, 130.81, 196.0];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        osc.detune.value = (i - 1.5) * 7;
        g.gain.value = 0.065 / (i * 0.35 + 1);
        osc.connect(g);
        g.connect(this.filter);
        osc.start();
        this.nodes.push(osc, g);
      });
    }
    this.setMix(this.mix);
  }

  toggle(idx) {
    if (this.playing && (idx === undefined || idx === this.trackIdx)) {
      this.stop();
      return false;
    }
    this.play(idx ?? this.trackIdx);
    return true;
  }

  getLevels(bars = 12) {
    const out = new Array(bars).fill(0.15);
    if (!this.playing) return out;
    if (this.analyser && this.freqData) {
      this.analyser.getByteFrequencyData(this.freqData);
      for (let i = 0; i < bars; i++) {
        const idx = Math.min(this.freqData.length - 1, Math.floor((i / bars) * 20));
        out[i] = Math.max(0.16, this.freqData[idx] / 255);
      }
    }
    return out;
  }
}

export const sound = new SoundEngine();
