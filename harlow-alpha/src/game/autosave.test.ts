import assert from "node:assert/strict";
import { describe, it } from "node:test";

import player from "./player.ts";
import {
  planAutosave,
  questAutosaveNeeded,
  sceneAutosaveStamp,
  type AutosaveRequest,
} from "./autosave.ts";
import {
  AUTOSAVE_KEY,
  clearStoredGames,
  readAutosave,
  readMostRecentSave,
  readSaveSlot,
  writeAutosave,
  writeSaveSlot,
  type AutosaveRecord,
  type SavedGame,
  type SaveStorage,
} from "./save.ts";
import type { QuestProgress } from "./quests.ts";

function memoryStorage(): SaveStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function gameSave(location: SavedGame["gameState"]["location"], time: number): SavedGame {
  return {
    version: 1,
    gameState: {
      dayNumber: 2,
      dayOfWeek: "Saturday",
      currentMonth: "October",
      time,
      location,
      weather: "Sunny",
    },
    playerState: { ...player, inventory: [...player.inventory] },
    currentSceneId: "ethan-room",
    busStopReturnSceneId: "front-yard",
    marleneActive: false,
    deskCigarettesPickedUp: false,
    scrapyardKnifePickedUp: false,
    garageFlashlightPickedUp: false,
  };
}

const quiet: AutosaveRequest = { quest: false, sleep: false, sceneChanged: false };

describe("autosave triggers", () => {
  it("saves after a quest step or completion, not a bare new quest", () => {
    const active: QuestProgress[] = [{ id: "find-a-job", status: "active" }];
    assert.equal(
      questAutosaveNeeded(active, [{ id: "find-a-job", status: "active", step: "flyer" }]),
      true,
    );
    assert.equal(
      questAutosaveNeeded(
        [{ id: "talk-to-mom", status: "active" }],
        [{ id: "talk-to-mom", status: "completed" }],
      ),
      true,
    );
    assert.equal(
      questAutosaveNeeded([], [{ id: "light-on-the-hill", status: "active" }]),
      false,
    );
    assert.equal(
      questAutosaveNeeded([], [{ id: "faded-poster", status: "active", step: "poster" }]),
      true,
    );
    assert.equal(questAutosaveNeeded(active, active.map((quest) => ({ ...quest }))), false);
  });

  it("autosaves a scene change once per in-game hour", () => {
    const morning = { currentMonth: "October", dayNumber: 2, time: 10 * 60 + 15 };
    assert.equal(sceneAutosaveStamp(morning), "October-2-10");
    const first = planAutosave({
      request: { ...quiet, sceneChanged: true },
      game: morning,
      previousSceneStamp: null,
    });
    assert.deepEqual(first, { write: true, sceneStamp: "October-2-10" });

    const laterSameHour = planAutosave({
      request: { ...quiet, sceneChanged: true },
      game: { ...morning, time: 10 * 60 + 50 },
      previousSceneStamp: first.sceneStamp,
    });
    assert.deepEqual(laterSameHour, { write: false, sceneStamp: "October-2-10" });

    const nextHour = planAutosave({
      request: { ...quiet, sceneChanged: true },
      game: { ...morning, time: 11 * 60 },
      previousSceneStamp: first.sceneStamp,
    });
    assert.deepEqual(nextHour, { write: true, sceneStamp: "October-2-11" });

    const sameScene = planAutosave({
      request: quiet,
      game: { ...morning, time: 12 * 60 },
      previousSceneStamp: nextHour.sceneStamp,
    });
    assert.equal(sameScene.write, false);
  });

  it("still saves on sleep or a quest inside an hour that already scene-saved", () => {
    const game = { currentMonth: "October", dayNumber: 2, time: 22 * 60 };
    const slept = planAutosave({
      request: { ...quiet, sleep: true, sceneChanged: true },
      game,
      previousSceneStamp: "October-2-22",
    });
    assert.equal(slept.write, true);
    assert.equal(slept.sceneStamp, "October-2-22");

    const quest = planAutosave({
      request: { ...quiet, quest: true },
      game,
      previousSceneStamp: "October-2-22",
    });
    assert.deepEqual(quest, { write: true, sceneStamp: "October-2-22" });
  });
});

describe("autosave slot", () => {
  it("writes a dedicated slot and leaves manual saves in place", () => {
    const storage = memoryStorage();
    const manual = gameSave("Ethan's room", 450);
    const auto = gameSave("Neighbourhood", 1320);
    assert.equal(writeSaveSlot(2, manual, storage), true);

    const record: AutosaveRecord = {
      savedAt: "2099-01-01T00:00:00.000Z",
      sceneStamp: "October-2-22",
      save: auto,
    };
    assert.equal(writeAutosave(record, storage), true);

    assert.equal(readSaveSlot(2, storage)?.gameState.location, "Ethan's room");
    assert.equal(readSaveSlot(1, storage), null);
    assert.equal(readAutosave(storage)?.save.gameState.location, "Neighbourhood");
    assert.equal(readMostRecentSave(storage)?.gameState.location, "Neighbourhood");
    const slots = storage.getItem("harlow-save-slots") ?? "";
    assert.equal(slots.includes("Neighbourhood"), false);
    assert.equal(storage.getItem(AUTOSAVE_KEY)?.includes("Neighbourhood"), true);
  });

  it("prefers a newer manual save over the autosave", () => {
    const storage = memoryStorage();
    const manual = gameSave("Diner", 800);
    writeSaveSlot(1, manual, storage);
    writeAutosave({
      savedAt: "2000-01-01T00:00:00.000Z",
      sceneStamp: null,
      save: gameSave("Sanatorium", 1200),
    }, storage);
    assert.equal(readMostRecentSave(storage)?.gameState.location, "Diner");
  });

  it("clears slots and the autosave together", () => {
    const storage = memoryStorage();
    writeSaveSlot(1, gameSave("Home", 450), storage);
    writeAutosave({
      savedAt: "2026-10-11T12:00:00.000Z",
      sceneStamp: null,
      save: gameSave("Home", 500),
    }, storage);
    storage.setItem("harlow-settings", "{\"textSize\":\"L\"}");
    clearStoredGames(storage);
    assert.equal(readSaveSlot(1, storage), null);
    assert.equal(readAutosave(storage), null);
    assert.equal(storage.getItem("harlow-settings"), "{\"textSize\":\"L\"}");
  });
});
