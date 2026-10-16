"use client";

import { useSyncExternalStore } from "react";

import { harlowAudio } from "@/game/audio";
import styles from "./SoundToggle.module.css";

function subscribe(onChange: () => void) {
  return harlowAudio().subscribe(onChange);
}

/** Speaker button beside the game menu; mutes every sound and remembers it. */
export default function SoundToggle() {
  const muted = useSyncExternalStore(
    subscribe,
    () => harlowAudio().isMuted(),
    () => false,
  );

  return (
    <button
      className={styles.toggle}
      type="button"
      aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      title={muted ? "Sound off" : "Sound on"}
      onClick={() => harlowAudio().setMuted(!muted)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className={styles.speaker} d="M4 9.5h3.6L12 5.6v12.8l-4.4-3.9H4z" />
        {muted ? (
          <path className={styles.wave} d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
        ) : (
          <>
            <path className={styles.wave} d="M15.2 9.2a4 4 0 0 1 0 5.6" />
            <path className={`${styles.wave} ${styles.waveOuter}`} d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8" />
          </>
        )}
      </svg>
    </button>
  );
}
