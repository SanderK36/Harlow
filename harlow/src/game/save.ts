import type { GameState, Player } from "@/game/types";
import type { JobId, QuestProgress, StoryFlag } from "@/game/quests";
import type { TrustMap, TrustPerson } from "@/game/trust";

const LEGACY_SAVE_KEY = "harlow-save";
const SAVE_SLOTS_KEY = "harlow-save-slots";
const SESSION_SAVE_KEY = "harlow-active-session";
/** Separate from the five manual slots, so an autosave cannot overwrite them. */
export const AUTOSAVE_KEY = "harlow-autosave";
export const SAVE_SLOT_COUNT = 5;
const SAVE_VERSION = 1;

export type SaveStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SavedGame = {
  version: typeof SAVE_VERSION;
  gameState: GameState;
  playerState: Player;
  currentSceneId: string;
  busStopReturnSceneId: string;
  marleneActive: boolean;
  deskCigarettesPickedUp: boolean;
  scrapyardKnifePickedUp: boolean;
  garageFlashlightPickedUp: boolean;
  momTalked?: boolean;
  momJobConcernHeard?: boolean;
  job?: JobId;
  jobQuestTarget?: JobId;
  /** Missing on older saves; migrate via migrateQuestsFromLegacy. */
  quests?: QuestProgress[];
  storyFlags?: Partial<Record<StoryFlag, boolean>>;
  chapter?: number;
  /** Hidden trust. Missing on older saves; migrate via migrateTrust. */
  trust?: Partial<TrustMap>;
  /** People Ethan has met, in order. */
  met?: TrustPerson[];
  /** Trust last read on the People page. A difference is the notebook dot. */
  peopleSeenTrust?: Partial<TrustMap>;
  /** dayNumber of the last once-per-day trust gain, per person. */
  trustGainedOnDay?: Partial<Record<TrustPerson, number>>;
};

export type SavedGameSlot = {
  slot: number;
  savedAt: string;
  save: SavedGame;
};

export type AutosaveRecord = {
  savedAt: string;
  /** Month-day-hour of the last scene-change autosave. Null if none yet. */
  sceneStamp: string | null;
  save: SavedGame;
};

function resolveStorage(storage?: SaveStorage): SaveStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSavedGame(value: unknown): value is SavedGame {
  if (!value || typeof value !== "object") return false;

  const save = value as Partial<SavedGame>;
  return (
    save.version === SAVE_VERSION &&
    typeof save.currentSceneId === "string" &&
    typeof save.busStopReturnSceneId === "string" &&
    typeof save.gameState === "object" &&
    save.gameState !== null &&
    typeof save.playerState === "object" &&
    save.playerState !== null
  );
}

function isSavedGameSlot(value: unknown): value is SavedGameSlot {
  if (!value || typeof value !== "object") return false;

  const slot = value as Partial<SavedGameSlot>;
  return (
    typeof slot.slot === "number" &&
    slot.slot >= 1 &&
    slot.slot <= SAVE_SLOT_COUNT &&
    typeof slot.savedAt === "string" &&
    isSavedGame(slot.save)
  );
}

export function readSaveSlots(storage?: SaveStorage): Array<SavedGameSlot | null> {
  const emptySlots = Array<SavedGameSlot | null>(SAVE_SLOT_COUNT).fill(null);
  const store = resolveStorage(storage);
  if (!store) return emptySlots;

  try {
    const rawSlots = store.getItem(SAVE_SLOTS_KEY);
    if (rawSlots) {
      const slots: unknown = JSON.parse(rawSlots);
      if (!Array.isArray(slots)) return emptySlots;

      slots.filter(isSavedGameSlot).forEach((slot) => {
        emptySlots[slot.slot - 1] = slot;
      });
      return emptySlots;
    }

    // Preserve saves made before the multiple-slot system was introduced.
    const legacySave: unknown = JSON.parse(
      store.getItem(LEGACY_SAVE_KEY) ?? "null"
    );
    if (isSavedGame(legacySave)) {
      emptySlots[0] = { slot: 1, savedAt: "Previous save", save: legacySave };
    }
    return emptySlots;
  } catch {
    return emptySlots;
  }
}

export function readSaveSlot(slotNumber: number, storage?: SaveStorage): SavedGame | null {
  return readSaveSlots(storage)[slotNumber - 1]?.save ?? null;
}

export function readMostRecentSave(storage?: SaveStorage): SavedGame | null {
  const manual = readSaveSlots(storage).filter((slot): slot is SavedGameSlot => slot !== null);
  const autosave = readAutosave(storage);
  const candidates = [
    ...manual.map((slot) => ({ savedAt: slot.savedAt, save: slot.save })),
    ...(autosave ? [{ savedAt: autosave.savedAt, save: autosave.save }] : []),
  ];
  return candidates.sort((first, second) => Date.parse(second.savedAt) - Date.parse(first.savedAt))[0]?.save ?? null;
}

export function writeSaveSlot(slotNumber: number, save: SavedGame, storage?: SaveStorage): boolean {
  if (slotNumber < 1 || slotNumber > SAVE_SLOT_COUNT) return false;
  const store = resolveStorage(storage);
  if (!store) return false;

  try {
    const slots = readSaveSlots(store);
    slots[slotNumber - 1] = {
      slot: slotNumber,
      savedAt: new Date().toISOString(),
      save,
    };
    store.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots.filter(Boolean)));
    return true;
  } catch {
    return false;
  }
}

function isAutosaveRecord(value: unknown): value is AutosaveRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AutosaveRecord>;
  return (
    typeof record.savedAt === "string"
    && (record.sceneStamp === null || typeof record.sceneStamp === "string")
    && isSavedGame(record.save)
  );
}

export function readAutosave(storage?: SaveStorage): AutosaveRecord | null {
  const store = resolveStorage(storage);
  if (!store) return null;
  try {
    const parsed: unknown = JSON.parse(store.getItem(AUTOSAVE_KEY) ?? "null");
    return isAutosaveRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAutosave(record: AutosaveRecord, storage?: SaveStorage): boolean {
  const store = resolveStorage(storage);
  if (!store || !isSavedGame(record.save)) return false;
  try {
    store.setItem(AUTOSAVE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** Manual slots, the legacy single save, and the autosave. Settings stay. */
export function clearStoredGames(storage?: SaveStorage) {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(SAVE_SLOTS_KEY);
    store.removeItem(LEGACY_SAVE_KEY);
    store.removeItem(AUTOSAVE_KEY);
  } catch {
    // Storage can throw in private mode. The new game still starts.
  }
}

export function readSessionSave(): SavedGame | null {
  if (typeof window === "undefined") return null;

  try {
    const save: unknown = JSON.parse(window.sessionStorage.getItem(SESSION_SAVE_KEY) ?? "null");
    return isSavedGame(save) ? save : null;
  } catch {
    return null;
  }
}

export function writeSessionSave(save: SavedGame): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.sessionStorage.setItem(SESSION_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSessionSave(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(SESSION_SAVE_KEY);
  } catch {
    // Session storage may be unavailable in private or restricted browsing.
  }
}
