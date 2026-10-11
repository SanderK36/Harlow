"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import { subscribeAutosavePulse } from "@/game/autosave";
import styles from "./AutosaveIndicator.module.css";

/** A 24px cassette in the corner for about a second after an autosave. */
export default function AutosaveIndicator() {
  const reducedMotion = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  const [hiddenPulse, setHiddenPulse] = useState(0);
  const visible = pulse > 0 && pulse !== hiddenPulse;

  useEffect(() => subscribeAutosavePulse(() => setPulse((count) => count + 1)), []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setHiddenPulse(pulse), 1000);
    return () => window.clearTimeout(timer);
  }, [pulse, visible]);

  return (
    <div className={styles.corner} aria-live="polite">
      <span className={styles.sr}>{visible ? "Game saved" : ""}</span>
      {visible && (
        <svg
          className={reducedMotion ? styles.fade : styles.spin}
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
        >
          <rect x="2.2" y="6" width="19.6" height="12" rx="1.6" fill="#140c0a" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="12" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="16" cy="12" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.5 6 8 4.2h8L17.5 6" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
    </div>
  );
}
