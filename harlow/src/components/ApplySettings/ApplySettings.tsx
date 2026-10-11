"use client";

import { useLayoutEffect } from "react";

import { getSettings, subscribeSettings, TEXT_SIZE_PX } from "@/game/settings";

function applySettingsToDocument() {
  const settings = getSettings();
  const root = document.documentElement;
  root.dataset.textSize = settings.textSize;
  root.style.setProperty("--reading-size", `${TEXT_SIZE_PX[settings.textSize]}px`);
  root.dataset.contrast = settings.highContrast ? "high" : "normal";
  if (settings.reducedMotion === null) delete root.dataset.motion;
  else root.dataset.motion = settings.reducedMotion ? "reduce" : "full";
}

/** Pushes text size, contrast, and reduced motion onto the document as they change. */
export default function ApplySettings() {
  useLayoutEffect(() => {
    applySettingsToDocument();
    return subscribeSettings(applySettingsToDocument);
  }, []);
  return null;
}
