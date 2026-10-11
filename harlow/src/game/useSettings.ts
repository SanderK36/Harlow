"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_SETTINGS, getSettings, subscribeSettings, type GameSettings } from "./settings";

/** Live settings. Server render and hydration use the defaults, then the stored choice. */
export function useGameSettings(): GameSettings {
  return useSyncExternalStore(subscribeSettings, getSettings, () => DEFAULT_SETTINGS);
}
