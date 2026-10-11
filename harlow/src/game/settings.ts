/**
 * Display and audio preferences. Stored under their own localStorage key so
 * a game save never carries them, and an old save still loads unchanged.
 * `reducedMotion: null` means "follow the system" until the player picks.
 */

export const SETTINGS_STORAGE_KEY = "harlow-settings";

export type TextSize = "S" | "M" | "L";
export type TextSpeed = "slow" | "normal" | "instant";

export type GameSettings = {
  textSize: TextSize;
  textSpeed: TextSpeed;
  /** 0–1. Multiplies every channel. */
  masterVolume: number;
  /** 0–1. Music and the looping scene beds. */
  musicVolume: number;
  /** 0–1. Doors, footsteps, thunder, and the other one-shots. */
  sfxVolume: number;
  reducedMotion: boolean | null;
  highContrast: boolean;
  skipSeenText: boolean;
};

/** Root size for in-game reading text. */
export const TEXT_SIZE_PX: Record<TextSize, number> = {
  S: 16,
  M: 18,
  L: 20,
};

export const DEFAULT_SETTINGS: GameSettings = {
  textSize: "M",
  textSpeed: "normal",
  masterVolume: 0.8,
  musicVolume: 1,
  sfxVolume: 1,
  reducedMotion: null,
  highContrast: false,
  skipSeenText: false,
};

export type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const TEXT_SIZES = new Set<TextSize>(["S", "M", "L"]);
const TEXT_SPEEDS = new Set<TextSpeed>(["slow", "normal", "instant"]);

function clamp01(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function readSettings(storage: SettingsStorage): GameSettings {
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };
    const data = parsed as Partial<GameSettings>;
    return {
      textSize: TEXT_SIZES.has(data.textSize as TextSize)
        ? (data.textSize as TextSize)
        : DEFAULT_SETTINGS.textSize,
      textSpeed: TEXT_SPEEDS.has(data.textSpeed as TextSpeed)
        ? (data.textSpeed as TextSpeed)
        : DEFAULT_SETTINGS.textSpeed,
      masterVolume: clamp01(data.masterVolume, DEFAULT_SETTINGS.masterVolume),
      musicVolume: clamp01(data.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp01(data.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      reducedMotion: typeof data.reducedMotion === "boolean" ? data.reducedMotion : null,
      highContrast: data.highContrast === true,
      skipSeenText: data.skipSeenText === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: GameSettings, storage: SettingsStorage) {
  const next: GameSettings = {
    textSize: TEXT_SIZES.has(settings.textSize) ? settings.textSize : DEFAULT_SETTINGS.textSize,
    textSpeed: TEXT_SPEEDS.has(settings.textSpeed) ? settings.textSpeed : DEFAULT_SETTINGS.textSpeed,
    masterVolume: clamp01(settings.masterVolume, DEFAULT_SETTINGS.masterVolume),
    musicVolume: clamp01(settings.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clamp01(settings.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    reducedMotion: typeof settings.reducedMotion === "boolean" ? settings.reducedMotion : null,
    highContrast: settings.highContrast === true,
    skipSeenText: settings.skipSeenText === true,
  };
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
}

/** Below 1 is faster. Slow is the only pace that stretches the typewriter. */
export function textSpeedScale(speed: TextSpeed) {
  return speed === "slow" ? 1.85 : 1;
}

/** Reduced motion, Instant, or a line the player has already read. */
export function textRevealsInstantly(
  settings: Pick<GameSettings, "textSpeed" | "skipSeenText">,
  reducedMotion: boolean,
  alreadySeen: boolean,
) {
  if (reducedMotion) return true;
  if (settings.textSpeed === "instant") return true;
  return settings.skipSeenText && alreadySeen;
}

let cached: GameSettings | null = null;
const listeners = new Set<() => void>();

function browserStorage(): SettingsStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSettings(): GameSettings {
  if (cached) return cached;
  const storage = browserStorage();
  cached = storage ? readSettings(storage) : { ...DEFAULT_SETTINGS };
  return cached;
}

export function updateSettings(patch: Partial<GameSettings>): GameSettings {
  const next = { ...getSettings(), ...patch };
  const storage = browserStorage();
  if (storage) {
    writeSettings(next, storage);
    cached = readSettings(storage);
  } else {
    cached = next;
  }
  listeners.forEach((listener) => listener());
  return getSettings();
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The player's choice, or the OS preference when they have not chosen. */
export function isReducedMotionNow() {
  const choice = getSettings().reducedMotion;
  if (choice !== null) return choice;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
