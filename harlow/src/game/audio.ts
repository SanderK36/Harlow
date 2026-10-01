"use client";

/**
 * Harlow's sound, generated in the browser with the Web Audio API: no sound
 * files, so there is nothing to license. A rain bed (filtered noise), a low
 * unsettled drone, and short effects (hotspot tick, footsteps between scenes,
 * thunder). Everything goes through one master gain that the mute toggle
 * controls; the choice is remembered in localStorage.
 */

export type Ambience = {
  /** Outdoors the rain is bright and close; indoors it is muffled. */
  indoor: boolean;
  night: boolean;
  weather: string;
};

const STORAGE_KEY = "harlow-sound";
const MASTER_LEVEL = 0.8;

const RAIN_LEVEL: Record<string, number> = {
  Sunny: 0,
  Cloudy: 0,
  Rainy: 0.45,
  "Heavy rain": 0.75,
  Thunderstorm: 0.9,
};

type Listener = (muted: boolean) => void;

class HarlowAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private muted = false;
  private wanted: Ambience | null = null;
  private listeners = new Set<Listener>();
  private lastHover = 0;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(STORAGE_KEY) === "off";
    }
  }

  isMuted() {
    return this.muted;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    window.localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
    if (!muted) this.unlock();
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER_LEVEL, this.context.currentTime, 0.12);
    }
    this.listeners.forEach((listener) => listener(muted));
  }

  /**
   * Browsers only allow sound after a user gesture, so this is called from
   * clicks and key presses; the first one builds the audio graph.
   */
  unlock() {
    if (this.muted) return;
    if (!this.context) this.build();
    if (this.context?.state === "suspended") void this.context.resume();
  }

  /** Crossfade the beds to suit the scene; null fades them out (e.g. intro). */
  setAmbience(ambience: Ambience | null) {
    this.wanted = ambience;
    this.applyAmbience();
  }

  hover() {
    const now = performance.now();
    if (now - this.lastHover < 70) return;
    this.lastHover = now;
    this.blip(1800, 0.035, 0.05);
  }

  click() {
    this.blip(420, 0.06, 0.09);
  }

  /** A few muffled steps on old floorboards when moving between scenes. */
  footsteps() {
    const context = this.ready();
    if (!context) return;
    const start = context.currentTime + 0.02;
    for (let step = 0; step < 3; step++) {
      this.thud(start + step * 0.27 + Math.random() * 0.03, 0.12 - step * 0.02);
    }
  }

  /** A roll of thunder; `distance` 0 is overhead, 1 is far off. */
  thunder(distance = 0.5) {
    const context = this.ready();
    if (!context || !this.noise || !this.master) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.playbackRate.value = 0.5;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420 - distance * 260, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 4.5);
    const gain = context.createGain();
    const peak = 0.55 * (1 - distance * 0.6);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.08 + distance * 0.5);
    // A second swell, the way a roll rumbles on after the crack.
    gain.gain.exponentialRampToValueAtTime(peak * 0.45, now + 0.9 + distance * 0.4);
    gain.gain.exponentialRampToValueAtTime(peak * 0.7, now + 1.5 + distance * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + 5.2);
  }

  // ---------- internals ----------

  private ready() {
    if (this.muted) return null;
    this.unlock();
    return this.context;
  }

  private build() {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    this.context = context;

    this.master = context.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER_LEVEL;
    this.master.connect(context.destination);

    // Two seconds of pink-ish noise, looped, for rain and thunder.
    const length = context.sampleRate * 2;
    this.noise = context.createBuffer(1, length, context.sampleRate);
    const data = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.97 * last + 0.03 * white;
      data[i] = white * 0.55 + last * 3;
    }

    // Rain: noise through a band, with a slow wobble so it doesn't sound static.
    const rain = context.createBufferSource();
    rain.buffer = this.noise;
    rain.loop = true;
    this.rainFilter = context.createBiquadFilter();
    this.rainFilter.type = "lowpass";
    this.rainFilter.frequency.value = 3200;
    const rainHigh = context.createBiquadFilter();
    rainHigh.type = "highpass";
    rainHigh.frequency.value = 320;
    this.rainGain = context.createGain();
    this.rainGain.gain.value = 0;
    const wobble = context.createOscillator();
    wobble.frequency.value = 0.13;
    const wobbleDepth = context.createGain();
    wobbleDepth.gain.value = 0.04;
    wobble.connect(wobbleDepth).connect(this.rainGain.gain);
    rain.connect(rainHigh).connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    rain.start();
    wobble.start();

    // Drone: two slightly detuned low tones and a fifth, breathing slowly.
    this.droneFilter = context.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 260;
    this.droneGain = context.createGain();
    this.droneGain.gain.value = 0;
    for (const [frequency, type, level] of [
      [55, "sine", 0.5],
      [55.6, "sine", 0.5],
      [82.4, "triangle", 0.18],
      [110.3, "sine", 0.08],
    ] as const) {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      const level_ = context.createGain();
      level_.gain.value = level;
      oscillator.connect(level_).connect(this.droneFilter);
      oscillator.start();
    }
    const breath = context.createOscillator();
    breath.frequency.value = 0.07;
    const breathDepth = context.createGain();
    breathDepth.gain.value = 90;
    breath.connect(breathDepth).connect(this.droneFilter.frequency);
    breath.start();
    this.droneFilter.connect(this.droneGain).connect(this.master);

    this.applyAmbience();
  }

  private applyAmbience() {
    const context = this.context;
    if (!context || !this.rainGain || !this.rainFilter || !this.droneGain) return;
    const now = context.currentTime;
    const ambience = this.wanted;
    const rain = ambience ? (RAIN_LEVEL[ambience.weather] ?? 0) : 0;
    const rainLevel = ambience ? rain * (ambience.indoor ? 0.22 : 0.34) : 0;
    const droneLevel = ambience ? (ambience.night ? 0.16 : 0.08) : 0;
    this.rainGain.gain.setTargetAtTime(rainLevel, now, 0.8);
    this.rainFilter.frequency.setTargetAtTime(ambience?.indoor ? 900 : 3400, now, 0.5);
    this.droneGain.gain.setTargetAtTime(droneLevel, now, 1.2);
  }

  private blip(frequency: number, level: number, length: number) {
    const context = this.ready();
    if (!context || !this.master) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + length);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + length + 0.02);
  }

  private thud(at: number, level: number) {
    const context = this.context;
    if (!context || !this.noise || !this.master) return;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(at, Math.random());
    source.stop(at + 0.2);
  }
}

let instance: HarlowAudio | null = null;

/** The shared audio engine (created on first use in the browser). */
export function harlowAudio() {
  instance ??= new HarlowAudio();
  return instance;
}
