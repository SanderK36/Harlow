import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SETTINGS,
  readSettings,
  SETTINGS_STORAGE_KEY,
  textRevealsInstantly,
  textSpeedScale,
  TEXT_SIZE_PX,
  writeSettings,
  type GameSettings,
  type SettingsStorage,
} from "./settings.ts";
import { hasSeenText, markTextSeen, SEEN_TEXT_KEY } from "./seenText.ts";

function memoryStorage(): SettingsStorage & { snapshot(): Record<string, string> } {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    snapshot: () => Object.fromEntries(values),
  };
}

describe("settings persistence", () => {
  it("starts from the defaults, including follow-the-system motion", () => {
    const storage = memoryStorage();
    const settings = readSettings(storage);
    assert.deepEqual(settings, DEFAULT_SETTINGS);
    assert.equal(settings.reducedMotion, null);
    assert.equal(TEXT_SIZE_PX[settings.textSize], 18);
  });

  it("round-trips every setting and leaves game saves alone", () => {
    const storage = memoryStorage();
    storage.setItem("harlow-save-slots", "[{\"slot\":1}]");
    const next: GameSettings = {
      textSize: "L",
      textSpeed: "instant",
      masterVolume: 0.25,
      musicVolume: 0.5,
      sfxVolume: 0,
      reducedMotion: true,
      highContrast: true,
      skipSeenText: true,
    };
    writeSettings(next, storage);
    assert.deepEqual(readSettings(storage), next);
    assert.equal(storage.getItem("harlow-save-slots"), "[{\"slot\":1}]");
    assert.equal(storage.snapshot()[SETTINGS_STORAGE_KEY] !== undefined, true);
  });

  it("clamps volumes and drops unknown values back to the defaults", () => {
    const storage = memoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      textSize: "huge",
      textSpeed: "fast",
      masterVolume: 4,
      musicVolume: -2,
      sfxVolume: "loud",
      reducedMotion: "yes",
      highContrast: 1,
      skipSeenText: "true",
    }));
    const settings = readSettings(storage);
    assert.equal(settings.textSize, "M");
    assert.equal(settings.textSpeed, "normal");
    assert.equal(settings.masterVolume, 1);
    assert.equal(settings.musicVolume, 0);
    assert.equal(settings.sfxVolume, 1);
    assert.equal(settings.reducedMotion, null);
    assert.equal(settings.highContrast, false);
    assert.equal(settings.skipSeenText, false);
  });

  it("keeps an explicit reduced-motion choice", () => {
    const storage = memoryStorage();
    writeSettings({ ...DEFAULT_SETTINGS, reducedMotion: false }, storage);
    assert.equal(readSettings(storage).reducedMotion, false);
  });

  it("treats broken storage as the defaults", () => {
    const storage = memoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, "{");
    assert.deepEqual(readSettings(storage), DEFAULT_SETTINGS);
  });

  it("reveals text instantly for reduced motion, Instant, and seen lines", () => {
    assert.equal(textSpeedScale("slow"), 1.85);
    assert.equal(textSpeedScale("normal"), 1);
    assert.equal(textSpeedScale("instant"), 1);
    assert.equal(textRevealsInstantly(DEFAULT_SETTINGS, false, false), false);
    assert.equal(textRevealsInstantly(DEFAULT_SETTINGS, true, false), true);
    assert.equal(
      textRevealsInstantly({ textSpeed: "instant", skipSeenText: false }, false, false),
      true,
    );
    assert.equal(
      textRevealsInstantly({ textSpeed: "normal", skipSeenText: true }, false, true),
      true,
    );
    assert.equal(
      textRevealsInstantly({ textSpeed: "slow", skipSeenText: true }, false, false),
      false,
    );
  });

  it("remembers seen lines apart from the settings blob", () => {
    const storage = memoryStorage();
    assert.equal(hasSeenText("The rain has not let up.", storage), false);
    markTextSeen("The rain has not let up.", storage);
    markTextSeen("The rain has not let up.", storage);
    assert.equal(hasSeenText("The rain has not let up.", storage), true);
    assert.equal(hasSeenText("Something else.", storage), false);
    const stored = JSON.parse(storage.getItem(SEEN_TEXT_KEY) ?? "[]") as string[];
    assert.deepEqual(stored, ["The rain has not let up."]);
    assert.equal(storage.getItem(SETTINGS_STORAGE_KEY), null);
  });
});
