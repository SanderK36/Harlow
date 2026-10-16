"use client";

import { useSyncExternalStore } from "react";

import { hasSeenText, subscribeSeenText } from "@/game/seenText";
import { useGameSettings } from "@/game/useSettings";

// Base reveal speed, plus short beats after punctuation so lines read like speech.
const CHARACTER_DELAY = 22;
const SENTENCE_PAUSE = 240;
const CLAUSE_PAUSE = 110;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/** The player's reduced-motion choice, or the OS preference until they pick. */
export function useReducedMotion() {
  const settings = useGameSettings();
  const system = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);
  if (settings.reducedMotion !== null) return settings.reducedMotion;
  return system;
}

/** True once this exact line has finished typing in a previous visit. */
export function useSeenLine(text: string) {
  return useSyncExternalStore(
    subscribeSeenText,
    () => hasSeenText(text),
    () => false,
  );
}

/**
 * Delay before revealing the next character, given the one just revealed.
 * `pace` scales the whole rhythm (below 1 is faster).
 */
export function revealDelay(previousCharacter: string | undefined, pace = 1) {
  if (previousCharacter === undefined) return 140 * pace;
  if (".!?…".includes(previousCharacter)) return SENTENCE_PAUSE * pace;
  if (",;:—".includes(previousCharacter)) return CLAUSE_PAUSE * pace;
  return CHARACTER_DELAY * pace;
}
