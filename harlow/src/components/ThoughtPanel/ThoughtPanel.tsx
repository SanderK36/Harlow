"use client";

import { useEffect, useState } from "react";

import styles from "./ThoughtPanel.module.css";
import { revealDelay, useReducedMotion } from "@/components/DialogueScene/typewriter";

type ThoughtPanelProps = {
  /** Name on the plate, e.g. "Ethan" or "TV news". */
  speaker: string;
  /** Small caption beside the plate, e.g. "Inner thought". */
  caption?: string;
  kind?: "thought" | "news";
  text: string;
  className?: string;
};

// These panels are on screen for a few seconds only, so they type a little
// quicker than the dialogue box.
const PACE = 0.7;

/**
 * A short line over the scene (Ethan's inner thoughts, the TV), presented in
 * the same nameplate-and-typewriter style as the dialogue box.
 */
export default function ThoughtPanel({
  speaker,
  caption,
  kind = "thought",
  text,
  className = "",
}: ThoughtPanelProps) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState({ text, revealed: 0 });

  // A new line restarts the reveal; adjusting state while rendering avoids
  // a flash of the previous line at full length.
  if (progress.text !== text) setProgress({ text, revealed: 0 });

  const revealed = progress.text === text ? progress.revealed : 0;
  const shown = reducedMotion ? text.length : Math.min(revealed, text.length);
  const complete = shown >= text.length;

  useEffect(() => {
    if (complete) return;
    const timer = window.setTimeout(
      () => setProgress({ text, revealed: shown + 1 }),
      revealDelay(shown === 0 ? undefined : text[shown - 1], PACE)
    );
    return () => window.clearTimeout(timer);
  }, [complete, shown, text]);

  return (
    <div
      className={`${styles.panel} ${kind === "news" ? styles.news : ""} ${className}`}
      role="status"
    >
      <div className={styles.plateRow} aria-hidden="true">
        <span className={styles.namePlate}>{speaker}</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
      <button
        type="button"
        className={styles.lineButton}
        onClick={() => setProgress({ text, revealed: text.length })}
        aria-label={complete ? text : "Show the full line"}
        tabIndex={complete ? -1 : 0}
      >
        <span className={styles.line} aria-hidden="true">
          {text.slice(0, shown)}
          {!complete && <span className={styles.caret} />}
          <span className={styles.unrevealed}>{text.slice(shown)}</span>
        </span>
      </button>
      {/* Announce the finished line once rather than every typed character. */}
      <p className={styles.srOnly}>{`${speaker}${caption ? ` (${caption})` : ""}: ${text}`}</p>
    </div>
  );
}
