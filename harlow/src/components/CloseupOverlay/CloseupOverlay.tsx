"use client";

import { useEffect, useState } from "react";

import {
  BLOOD_BEAT_MS,
  closeupBeat,
  HILL_LIGHT_ON_MS,
  HILL_LIGHT_THOUGHT_DELAY_MS,
} from "@/game/chapter1";

import PlateImage from "@/components/ImageText/PlateImage";
import type { Inscription } from "@/components/ImageText/imageText";

import styles from "./CloseupOverlay.module.css";

export type CloseupContent = {
  image: string;
  /** Optional one-shot animation displayed directly in the scene art. */
  video?: string;
  thought: string;
  /** Optional short label for screen readers. */
  label?: string;
  /** Some memories should avoid the rainy-weather closeup wash. */
  disableWeatherFilter?: boolean;
  /** Headline, caption, or note drawn on the picture. */
  inscriptions?: Inscription[];
  /**
   * Shown one at a time on the same plate. The dismiss control stays hidden
   * until the last line is up. A clean cut: no flash, no shake.
   */
  thoughts?: readonly string[];
  /** Used when `image` is not on disk yet. The overlay stays. */
  fallbackImage?: string;
  /**
   * A separate glow over the lit window. It cuts out; the follow-up thought
   * arrives half a second later. No fade, including under reduced motion.
   */
  windowLight?: { thought: string };
  /** Dismissing this plate opens the timed Hide / Run choice. */
  after?: "timed-choice";
};

type CloseupOverlayProps = {
  closeup: CloseupContent;
  onDismiss: () => void;
  /**
   * Rainy weather applies the same interim filter as a dry scene plate.
   * Streaks only on an exterior scene. Indoors get the filter and nothing else.
   */
  rain?: "interior" | "exterior" | null;
  /** Night rain filter is dimmer, matching the scene. */
  rainNight?: boolean;
};

/**
 * Full-frame closeup over a dark backdrop (poster, drawer, memory, cigarette).
 * Click, Space or Enter dismisses it.
 */
export default function CloseupOverlay({ closeup, onDismiss, rain = null, rainNight = false }: CloseupOverlayProps) {
  const [lit, setLit] = useState(Boolean(closeup.windowLight));
  const [thought, setThought] = useState(closeup.thought);
  const [elapsed, setElapsed] = useState(0);
  const beat = closeupBeat(closeup.thoughts, closeup.thought, elapsed);
  const line = closeup.windowLight ? thought : beat.text;
  const canDismiss = closeup.windowLight ? true : beat.canDismiss;
  const sequenced = Boolean(closeup.thoughts && closeup.thoughts.length > 1);

  useEffect(() => {
    setThought(closeup.thought);
    setLit(Boolean(closeup.windowLight));
    setElapsed(0);
    const timers: number[] = [];
    if (closeup.windowLight) {
      timers.push(window.setTimeout(() => setLit(false), HILL_LIGHT_ON_MS));
      timers.push(window.setTimeout(
        () => setThought(closeup.windowLight?.thought ?? closeup.thought),
        HILL_LIGHT_ON_MS + HILL_LIGHT_THOUGHT_DELAY_MS,
      ));
    }
    const lines = closeup.thoughts;
    if (lines && lines.length > 1) {
      for (let index = 1; index < lines.length; index += 1) {
        timers.push(window.setTimeout(() => setElapsed(BLOOD_BEAT_MS * index), BLOOD_BEAT_MS * index));
      }
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [closeup]);

  function dismiss() {
    if (!canDismiss) return;
    onDismiss();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss, canDismiss]);

  return (
    <div
      className={`${styles.overlay}${sequenced ? ` ${styles.cut}` : ""}${canDismiss ? "" : ` ${styles.holding}`}`}
      role="dialog"
      aria-modal="true"
      aria-label={closeup.label ?? "Closeup"}
      onClick={dismiss}
    >
      {canDismiss && <p className={styles.hint}>Click or press Space</p>}
      <div className={styles.frame} onClick={(event) => event.stopPropagation()}>
        <div className={styles.art}>
          <PlateImage
            key={closeup.image}
            src={closeup.image}
            fallbackSrc={closeup.fallbackImage}
            alt={closeup.label ?? "Closeup"}
            inscriptions={closeup.inscriptions}
            imageClassName={`${styles.image}${
              rain
                ? ` ${
                  rainNight
                    ? rain === "exterior"
                      ? styles.imageRainNightExterior
                      : styles.imageRainNight
                    : styles.imageRain
                }`
                : ""
            }`}
            onClick={dismiss}
          />
          {closeup.windowLight && (
            <div className={styles.hillLight} aria-hidden="true">
              {lit ? <div className={styles.hillGlow} /> : <div className={styles.hillShutter} />}
            </div>
          )}
          {rain === "exterior" && <div className={styles.overcast} aria-hidden="true" />}
          {rain === "exterior" && <div className={styles.rainGlass} aria-hidden="true" />}
        </div>
        <p className={styles.thought}>{line}</p>
      </div>
    </div>
  );
}
