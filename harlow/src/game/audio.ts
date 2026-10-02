"use client";

/**
 * Harlow's sound, mostly generated in the browser with the Web Audio API: a
 * steady rain bed (filtered noise), the rare roll of thunder, and a soft
 * hotspot tick. The one recorded sound is the door (public/sounds/door.mp3,
 * CC0, see public/sounds/CREDITS.md). Everything goes through one master gain
 * that the mute toggle controls; the choice is remembered in localStorage.
 *
 * There used to be a low drone too: two sines at 55 and 55.6 Hz beat against
 * each other 0.6 times a second, which came through as a thumping behind the
 * rain. It, the rain's slow volume wobble and the footstep thuds are gone.
 */

export type Ambience = {
  /** Outdoors the rain is bright and close; indoors it is muffled. */
  indoor: boolean;
  weather: string;
};

const STORAGE_KEY = "harlow-sound";
const MASTER_LEVEL = 0.8;
const DOOR_SOUND_URL = "./sounds/door.mp3";
const DOOR_LEVEL = 0.5;

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
  private muted = false;
  private wanted: Ambience | null = null;
  private listeners = new Set<Listener>();
  private lastHover = 0;
  private doorBuffer: AudioBuffer | null = null;
  private doorLoading: Promise<AudioBuffer | null> | null = null;
  private doorSource: AudioBufferSourceNode | null = null;

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

  /**
   * A door opening and swinging shut. A second door cuts the first one off
   * rather than playing over it, so quick clicks never stack.
   */
  door() {
    const context = this.ready();
    if (!context || !this.master) return;
    const requested = context.currentTime;
    void this.loadDoor().then((buffer) => {
      // Still loading after a beat: the moment has passed, so skip it.
      if (!buffer || !this.master || this.muted || context.currentTime - requested > 0.35) return;
      this.doorSource?.stop();
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      gain.gain.value = DOOR_LEVEL;
      source.connect(gain).connect(this.master);
      source.onended = () => {
        if (this.doorSource === source) this.doorSource = null;
      };
      this.doorSource = source;
      source.start();
    });
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

  private loadDoor() {
    if (this.doorBuffer) return Promise.resolve(this.doorBuffer);
    const context = this.context;
    if (!context) return Promise.resolve(null);
    this.doorLoading ??= fetch(DOOR_SOUND_URL)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject()))
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        this.doorBuffer = buffer;
        return buffer;
      })
      .catch(() => {
        // Let a later door try again (e.g. after a dropped connection).
        this.doorLoading = null;
        return null;
      });
    return this.doorLoading;
  }

  private ready() {
    if (this.muted) return null;
    // Never start sound before the player has interacted with the page.
    if (!this.context && navigator.userActivation && !navigator.userActivation.hasBeenActive) {
      return null;
    }
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

    // Eight seconds of pink-ish noise for rain and thunder. A short loop is
    // heard as a repeating pattern, so it is long, and its tail is crossfaded
    // into its head so the loop point has no seam.
    const rate = context.sampleRate;
    const fade = Math.floor(rate * 0.5);
    const length = rate * 8;
    const raw = new Float32Array(length + fade);
    let last = 0;
    for (let i = 0; i < raw.length; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.97 * last + 0.03 * white;
      raw[i] = white * 0.55 + last * 3;
    }
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      raw[i] = raw[i] * Math.sqrt(t) + raw[length + i] * Math.sqrt(1 - t);
    }
    this.noise = context.createBuffer(1, length, rate);
    this.noise.getChannelData(0).set(raw.subarray(0, length));

    // Rain: noise through a band at a steady level (no pulsing).
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
    rain.connect(rainHigh).connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    rain.start();

    this.applyAmbience();
    // Fetch the door sound now, so the first door already has it.
    void this.loadDoor();
  }

  private applyAmbience() {
    const context = this.context;
    if (!context || !this.rainGain || !this.rainFilter) return;
    const now = context.currentTime;
    const ambience = this.wanted;
    const rain = ambience ? (RAIN_LEVEL[ambience.weather] ?? 0) : 0;
    const rainLevel = ambience ? rain * (ambience.indoor ? 0.22 : 0.34) : 0;
    this.rainGain.gain.setTargetAtTime(rainLevel, now, 0.8);
    this.rainFilter.frequency.setTargetAtTime(ambience?.indoor ? 900 : 3400, now, 0.5);
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
}

let instance: HarlowAudio | null = null;

/** The shared audio engine (created on first use in the browser). */
export function harlowAudio() {
  instance ??= new HarlowAudio();
  return instance;
}
