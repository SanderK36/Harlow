import type { GameState, Player } from "@/game/types";
import type { JobId } from "@/game/quests";

const LEGACY_SAVE_KEY = "harlow-save";
const SAVE_SLOTS_KEY = "harlow-save-slots";
const SESSION_SAVE_KEY = "harlow-active-session";
export const SAVE_SLOT_COUNT = 5;
const SAVE_VERSION = 1;

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
  momJobConcernHeard?: boolean;
  job?: JobId;
  jobQuestTarget?: JobId;
};

export type SavedGameSlot = {
  slot: number;
  savedAt: string;
  save: SavedGame;
};

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

export function readSaveSlots(): Array<SavedGameSlot | null> {
  const emptySlots = Array<SavedGameSlot | null>(SAVE_SLOT_COUNT).fill(null);
  if (typeof window === "undefined") return emptySlots;

  try {
    const rawSlots = window.localStorage.getItem(SAVE_SLOTS_KEY);
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
      window.localStorage.getItem(LEGACY_SAVE_KEY) ?? "null"
    );
    if (isSavedGame(legacySave)) {
      emptySlots[0] = { slot: 1, savedAt: "Previous save", save: legacySave };
    }
    return emptySlots;
  } catch {
    return emptySlots;
  }
}

export function readSaveSlot(slotNumber: number): SavedGame | null {
  return readSaveSlots()[slotNumber - 1]?.save ?? null;
}

export function readMostRecentSave(): SavedGame | null {
  return readSaveSlots()
    .filter((slot): slot is SavedGameSlot => slot !== null)
    .sort((first, second) => Date.parse(second.savedAt) - Date.parse(first.savedAt))[0]?.save ?? null;
}

export function writeSaveSlot(slotNumber: number, save: SavedGame): boolean {
  if (slotNumber < 1 || slotNumber > SAVE_SLOT_COUNT) return false;
  if (typeof window === "undefined") return false;

  try {
    const slots = readSaveSlots();
    slots[slotNumber - 1] = {
      slot: slotNumber,
      savedAt: new Date().toISOString(),
      save,
    };
    window.localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots.filter(Boolean)));
    return true;
  } catch {
    return false;
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
