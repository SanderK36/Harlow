"use client";

import { useEffect } from "react";

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
  /** Two crops, side by side. The thought stays under the frame. */
  split?: { left: string; right: string };
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
          {closeup.split ? (
            <div className={styles.split}>
              <div className={styles.splitPane}>
                <img src={closeup.split.left} alt="" className={styles.splitLeft} />
              </div>
              <div className={styles.splitPane}>
                <img src={closeup.split.right} alt="" className={styles.splitRight} />
              </div>
            </div>
          ) : (
          <PlateImage
            src={closeup.image}
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
            onClick={onDismiss}
          />
          )}
          {rain === "exterior" && !closeup.split && <div className={styles.overcast} aria-hidden="true" />}
          {rain === "exterior" && !closeup.split && <div className={styles.rainGlass} aria-hidden="true" />}
        </div>
        <p className={styles.thought}>{closeup.thought}</p>
      </div>
    </div>
  );
}
