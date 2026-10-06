"use client";

import { useEffect } from "react";

import styles from "./CloseupOverlay.module.css";

export type CloseupContent = {
  image: string;
  thought: string;
  /** Optional short label for screen readers. */
  label?: string;
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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={closeup.label ?? "Closeup"}
      onClick={onDismiss}
    >
      <p className={styles.hint}>Click or press Space</p>
      <div className={styles.frame} onClick={(event) => event.stopPropagation()}>
        <div className={styles.art}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={closeup.image}
            alt=""
            className={`${styles.image}${
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
            onClick={onDismiss}
          />
          {rain === "exterior" && <div className={styles.overcast} aria-hidden="true" />}
          {rain === "exterior" && <div className={styles.rainGlass} aria-hidden="true" />}
        </div>
        <p className={styles.thought}>{closeup.thought}</p>
      </div>
    </div>
  );
}
