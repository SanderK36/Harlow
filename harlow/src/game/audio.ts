"use client";

import type { AmbienceSlot } from "@/game/ambience";
import { RAIN_WEATHER } from "@/game/scene/weather";
import { getSettings, subscribeSettings } from "@/game/settings";

/**
 * Sound for Harlow. One master gain, then two buses: music (looping beds)
 * and SFX (one-shots). Volumes come from the settings screen. Nothing starts
 * until the player has clicked or pressed a key.
 *
 * Rain, when the rain file is missing, is still the filtered-noise bed from
 * before. Thunder falls back the same way. A missing file is ignored.
 *
 * Files live flat in public/sounds/, under the names the owner committed.
 * Outdoor rain is rainOutsideAlt.mp3. Indoor rain is rainInside.mp3.
 * Wet footsteps are footstepsWet.mp3 when the weather is rain.
 */

const RAIN_INSIDE_FILE = "/sounds/rainInside.mp3";
const FOOTSTEPS_WET_FILE = "/sounds/footstepsWet.mp3";
/** Indoor rain under a room bed (diner, house, sanatorium). Alone, it uses BED_LEVEL. */
const INDOOR_RAIN_UNDER_ROOM = 0.26;

function isRainWeather(weather: string) {
  return (RAIN_WEATHER as readonly string[]).includes(weather);
}

export type Ambience = {
  /** Outdoors the rain is bright and close; indoors it is muffled. */
  indoor: boolean;
  weather: string;
};

export type SfxName = "footsteps" | "door" | "page-turn" | "pen-scribble" | "thunder";

export const AMBIENCE_FILES: Record<AmbienceSlot, string> = {
  rain: "/sounds/rainOutsideAlt.mp3",
  night: "/sounds/nightOutdoors.mp3",
  "sanatorium-drone": "/sounds/sanatoriumDrone.mp3",
  diner: "/sounds/dinerAmbience.mp3",
  house: "/sounds/quietHouse.mp3",
};

export const SFX_FILES: Record<SfxName, string> = {
  footsteps: "/sounds/footsteps.mp3",
  door: "/sounds/door.mp3",
  "page-turn": "/sounds/pageTurn.mp3",
  "pen-scribble": "/sounds/pen.mp3",
  thunder: "/sounds/thunder.mp3",
};

const STORAGE_KEY = "harlow-sound";
const DOOR_LEVEL = 0.5;
const SFX_LEVEL: Record<SfxName, number> = {
  footsteps: 0.45,
  door: DOOR_LEVEL,
  "page-turn": 0.4,
  "pen-scribble": 0.35,
  thunder: 0.55,
};
const BED_LEVEL = 0.42;

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
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private indoorRainGain: GainNode | null = null;
  private indoorRainFileActive = false;
  private indoorRainToken = 0;
  private muted = false;
  private wanted: Ambience | null = null;
  private wantedSlot: AmbienceSlot | null = null;
  private rainFileActive = false;
  private slotToken = 0;
  private beds = new Map<AmbienceSlot, GainNode>();
  private listeners = new Set<Listener>();
  private lastHover = 0;
  private doorSource: AudioBufferSourceNode | null = null;
  private footSource: AudioBufferSourceNode | null = null;
  private footToken = 0;
  private receiverSource: AudioBufferSourceNode | null = null;
  private receiverToken = 0;
  private heartTimer: number | null = null;
  private musicBoxNodes: OscillatorNode[] = [];
  private clipCache = new Map<string, AudioBuffer>();
  private clipMiss = new Set<string>();
  private clipLoading = new Map<string, Promise<AudioBuffer | null>>();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = window.localStorage.getItem(STORAGE_KEY) === "off";
      } catch {
        this.muted = false;
      }
      subscribeSettings(() => this.applyGains());
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
    try {
      window.localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
    } catch {
      // Private mode can refuse the write. The button still mutes this session.
    }
    if (!muted) this.unlock();
    this.applyGains();
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

  /** Crossfade the generated rain to suit the weather. Null fades it out. */
  setAmbience(ambience: Ambience | null) {
    this.wanted = ambience;
    this.applyAmbience();
    if (!this.context) return;
    this.fadeBeds(this.audibleSlot(this.wantedSlot));
    void this.syncIndoorRain();
  }

  /** Crossfade the scene's looping file. A missing file stays silent. */
  setAmbienceSlot(slot: AmbienceSlot | null) {
    this.wantedSlot = slot;
    if (!this.context) return;
    void this.applySlot();
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

  /** A named one-shot. `door` and `thunder` keep their existing behavior. */
  playSfx(name: SfxName) {
    if (name === "door") {
      this.door();
      return;
    }
    if (name === "thunder") {
      this.thunder(0.45);
      return;
    }
    if (name === "footsteps") {
      const wet = this.wanted ? isRainWeather(this.wanted.weather) : false;
      this.playFile(wet ? FOOTSTEPS_WET_FILE : SFX_FILES.footsteps, SFX_LEVEL.footsteps);
      return;
    }
    this.playFile(SFX_FILES[name], SFX_LEVEL[name]);
  }

  /**
   * Rain heard in the phone, not the room. Quiet and low-passed.
   * A second call while it is already playing leaves it running.
   */
  playReceiverRain() {
    if (this.receiverSource) return;
    const token = ++this.receiverToken;
    const context = this.ready();
    if (!context || !this.sfx) return;
    void this.loadClip(AMBIENCE_FILES.rain).then((buffer) => {
      if (token !== this.receiverToken || !buffer || !this.sfx || !this.context) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 480;
      const gain = this.context.createGain();
      gain.gain.value = 0.08;
      source.connect(filter).connect(gain).connect(this.sfx);
      source.start();
      this.receiverSource = source;
    });
  }

  stopReceiverRain() {
    this.receiverToken += 1;
    const source = this.receiverSource;
    this.receiverSource = null;
    try {
      source?.stop();
    } catch {
      // Already stopped.
    }
  }

  /** Gravel behind Ethan. loops footsteps.mp3 until stopFootsteps. */
  loopFootsteps() {
    const token = ++this.footToken;
    const context = this.ready();
    if (!context || !this.sfx) return;
    void this.loadClip(SFX_FILES.footsteps).then((buffer) => {
      if (token !== this.footToken || !buffer || !this.sfx || !this.context) return;
      this.footSource?.stop();
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = this.context.createGain();
      gain.gain.value = SFX_LEVEL.footsteps;
      source.connect(gain).connect(this.sfx);
      source.start();
      this.footSource = source;
    });
  }

  /**
   * Faint music box in the receiver. No file has been delivered, so this
   * is a short sine phrase on the SFX bus. A later file can replace it.
   */
  playMusicBox() {
    this.stopMusicBox();
    const context = this.ready();
    if (!context || !this.sfx) return;
    const notes = [1046.5, 1174.7, 1318.5, 1568, 1318.5, 1174.7, 1046.5, 880];
    const start = context.currentTime + 0.05;
    const step = 0.48;
    for (const [index, freq] of notes.entries()) {
      const at = start + index * step;
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.03, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      osc.connect(gain).connect(this.sfx);
      osc.start(at);
      osc.stop(at + 0.42);
      this.musicBoxNodes.push(osc);
    }
  }

  stopMusicBox() {
    for (const osc of this.musicBoxNodes) {
      try {
        osc.stop();
      } catch {
        // Already stopped.
      }
    }
    this.musicBoxNodes = [];
  }

  /** Closet crack. Two quiet thumps, then a rest. No file. */
  loopHeartbeat() {
    this.stopHeartbeat();
    const beat = () => {
      this.blip(62, 0.045, 0.09);
      window.setTimeout(() => this.blip(48, 0.03, 0.07), 150);
    };
    beat();
    this.heartTimer = window.setInterval(beat, 920);
  }

  stopHeartbeat() {
    if (this.heartTimer != null) {
      window.clearInterval(this.heartTimer);
      this.heartTimer = null;
    }
  }

  stopFootsteps() {
    this.footToken += 1;
    const source = this.footSource;
    this.footSource = null;
    try {
      source?.stop();
    } catch {
      // Already stopped.
    }
  }

  /**
   * A door opening and swinging shut. A second door cuts the first one off
   * rather than playing over it, so quick clicks never stack.
   */
  door() {
    const context = this.ready();
    if (!context || !this.sfx) return;
    const requested = context.currentTime;
    void this.loadClip(SFX_FILES.door).then((buffer) => {
      if (!buffer || !this.sfx || this.muted || context.currentTime - requested > 0.35) return;
      this.doorSource?.stop();
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      gain.gain.value = DOOR_LEVEL;
      source.connect(gain).connect(this.sfx);
      source.onended = () => {
        if (this.doorSource === source) this.doorSource = null;
      };
      this.doorSource = source;
      source.start();
    });
  }

  /** A roll of thunder. Uses the file when it is there, otherwise noise. */
  thunder(distance = 0.5) {
    const context = this.ready();
    if (!context || !this.sfx) return;
    void this.loadClip(SFX_FILES.thunder).then((buffer) => {
      if (this.muted || !this.sfx) return;
      if (buffer) {
        this.playBuffer(buffer, SFX_LEVEL.thunder * (1 - distance * 0.35));
        return;
      }
      this.playGeneratedThunder(distance);
    });
  }

  private playFile(url: string, level: number) {
    const context = this.ready();
    if (!context || !this.sfx) return;
    void this.loadClip(url).then((buffer) => {
      if (!buffer || this.muted || !this.sfx) return;
      this.playBuffer(buffer, level);
    });
  }

  private playBuffer(buffer: AudioBuffer, level: number) {
    const context = this.context;
    if (!context || !this.sfx || this.muted) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = level;
    source.connect(gain).connect(this.sfx);
    source.start();
  }

  private loadClip(url: string): Promise<AudioBuffer | null> {
    const cached = this.clipCache.get(url);
    if (cached) return Promise.resolve(cached);
    if (this.clipMiss.has(url)) return Promise.resolve(null);
    const pending = this.clipLoading.get(url);
    if (pending) return pending;
    const context = this.context;
    if (!context) return Promise.resolve(null);
    const loading = fetch(url)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error("missing"))))
      .then((data) => context.decodeAudioData(data.slice(0)))
      .then((buffer) => {
        this.clipCache.set(url, buffer);
        return buffer;
      })
      .catch(() => {
        this.clipMiss.add(url);
        return null;
      })
      .finally(() => {
        this.clipLoading.delete(url);
      });
    this.clipLoading.set(url, loading);
    return loading;
  }

  private async applySlot() {
    const token = ++this.slotToken;
    const slot = this.wantedSlot;
    if (!this.context || !this.music) return;
    if (slot) {
      const buffer = await this.loadClip(AMBIENCE_FILES[slot]);
      if (token !== this.slotToken || !this.context || !this.music) return;
      if (buffer) this.ensureBed(slot, buffer);
      this.rainFileActive = slot === "rain" && Boolean(buffer);
    } else {
      this.rainFileActive = false;
    }
    this.fadeBeds(this.audibleSlot(slot));
    this.applyAmbience();
    void this.syncIndoorRain();
  }

  /** Outdoor rain file stays down while Ethan is inside; rainInside takes over. */
  private audibleSlot(slot: AmbienceSlot | null): AmbienceSlot | null {
    if (slot === "rain" && this.wanted?.indoor) return null;
    return slot;
  }

  private wantsIndoorRain() {
    return Boolean(this.wanted?.indoor && isRainWeather(this.wanted.weather));
  }

  private async syncIndoorRain() {
    const token = ++this.indoorRainToken;
    if (!this.context || !this.music) return;
    if (!this.wantsIndoorRain()) {
      this.indoorRainFileActive = false;
      this.fadeIndoorRain(0);
      this.applyAmbience();
      return;
    }
    const buffer = await this.loadClip(RAIN_INSIDE_FILE);
    if (token !== this.indoorRainToken || !this.context || !this.music) return;
    if (!this.wantsIndoorRain()) {
      this.indoorRainFileActive = false;
      this.fadeIndoorRain(0);
      this.applyAmbience();
      return;
    }
    if (buffer) this.ensureIndoorRain(buffer);
    this.indoorRainFileActive = Boolean(buffer);
    const layered = this.wantedSlot !== null && this.wantedSlot !== "rain";
    this.fadeIndoorRain(buffer ? (layered ? INDOOR_RAIN_UNDER_ROOM : BED_LEVEL) : 0);
    this.applyAmbience();
  }

  private ensureIndoorRain(buffer: AudioBuffer) {
    if (this.indoorRainGain || !this.context || !this.music) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(this.music);
    source.start();
    this.indoorRainGain = gain;
  }

  private fadeIndoorRain(level: number) {
    if (!this.context || !this.indoorRainGain) return;
    this.indoorRainGain.gain.setTargetAtTime(level, this.context.currentTime, 0.35);
  }

  private ensureBed(slot: AmbienceSlot, buffer: AudioBuffer) {
    if (this.beds.has(slot) || !this.context || !this.music) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(this.music);
    source.start();
    this.beds.set(slot, gain);
  }

  private fadeBeds(active: AmbienceSlot | null) {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const [slot, gain] of this.beds) {
      gain.gain.setTargetAtTime(slot === active ? BED_LEVEL : 0, now, 0.35);
    }
  }

  private ready() {
    if (this.muted) return null;
    if (!this.context && navigator.userActivation && !navigator.userActivation.hasBeenActive) {
      return null;
    }
    this.unlock();
    return this.context;
  }

  private applyGains() {
    const context = this.context;
    if (!context || !this.master || !this.music || !this.sfx) return;
    const settings = getSettings();
    const now = context.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : settings.masterVolume, now, 0.08);
    this.music.gain.setTargetAtTime(settings.musicVolume, now, 0.08);
    this.sfx.gain.setTargetAtTime(settings.sfxVolume, now, 0.08);
  }

  private build() {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    this.context = context;

    this.master = context.createGain();
    this.master.connect(context.destination);
    this.music = context.createGain();
    this.music.connect(this.master);
    this.sfx = context.createGain();
    this.sfx.connect(this.master);
    this.applyGains();

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
    rain.connect(rainHigh).connect(this.rainFilter).connect(this.rainGain).connect(this.music);
    rain.start();

    this.applyAmbience();
    void this.applySlot();
    void this.loadClip(SFX_FILES.door);
  }

  private applyAmbience() {
    const context = this.context;
    if (!context || !this.rainGain || !this.rainFilter) return;
    const now = context.currentTime;
    const ambience = this.wanted;
    const rain = ambience ? (RAIN_LEVEL[ambience.weather] ?? 0) : 0;
    const rainLevel = ambience ? rain * (ambience.indoor ? 0.22 : 0.34) : 0;
    const usingRainFile =
      this.indoorRainFileActive || (this.rainFileActive && !ambience?.indoor);
    this.rainGain.gain.setTargetAtTime(usingRainFile ? 0 : rainLevel, now, 0.8);
    this.rainFilter.frequency.setTargetAtTime(ambience?.indoor ? 900 : 3400, now, 0.5);
  }

  private playGeneratedThunder(distance: number) {
    const context = this.context;
    if (!context || !this.noise || !this.sfx) return;
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
    gain.gain.exponentialRampToValueAtTime(peak * 0.45, now + 0.9 + distance * 0.4);
    gain.gain.exponentialRampToValueAtTime(peak * 0.7, now + 1.5 + distance * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5);
    source.connect(filter).connect(gain).connect(this.sfx);
    source.start(now);
    source.stop(now + 5.2);
  }

  private blip(frequency: number, level: number, length: number) {
    const context = this.ready();
    if (!context || !this.sfx) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + length);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    oscillator.connect(gain).connect(this.sfx);
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
