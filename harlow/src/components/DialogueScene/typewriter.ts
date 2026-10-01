"use client";

import { useSyncExternalStore } from "react";

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

/** Live `prefers-reduced-motion` flag (false during server rendering). */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);
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
