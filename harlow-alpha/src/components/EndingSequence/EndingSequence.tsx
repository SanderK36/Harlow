"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import { harlowAudio } from "@/game/audio";
import { getSettings } from "@/game/settings";
import {
  HOODED_FALLBACK,
  STALKER_FIGURE,
  TIMED_CHOICE_BUTTON_MIN_PX,
  TIMED_CHOICE_MS,
  escapeSteps,
  timedChoiceEnabled,
  type EscapeStep,
} from "@/game/slasher";

import styles from "./EndingSequence.module.css";

type EndingSequenceProps = {
  /** The bar is up. Hide and Run are both still available. */
  choosing: boolean;
  /** Hide or Run is already decided. The outcome plays itself. */
  mode: "hide" | "run" | null;
  onChoose: (choice: "hide" | "run") => void;
  onDone: () => void;
};

export default function EndingSequence({ choosing, mode, onChoose, onDone }: EndingSequenceProps) {
  const reduced = useReducedMotion();
  const [timed] = useState(() => timedChoiceEnabled(getSettings().timedChoices));
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;

  useEffect(() => {
    if (!choosing || !timed) return;
    const id = window.setTimeout(() => chooseRef.current("hide"), TIMED_CHOICE_MS);
    return () => window.clearTimeout(id);
  }, [choosing, timed]);

  if (choosing) {
    return (
      <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="Hide or run">
        <div className={styles.choices}>
          <button
            type="button"
            className={styles.choice}
            style={{ minHeight: TIMED_CHOICE_BUTTON_MIN_PX }}
            onClick={() => onChoose("hide")}
          >
            Hide
          </button>
          <button
            type="button"
            className={styles.choice}
            style={{ minHeight: TIMED_CHOICE_BUTTON_MIN_PX }}
            onClick={() => onChoose("run")}
          >
            Run
          </button>
          {timed && (
            <span
              className={`${styles.bar} ${reduced ? styles.barSteps : ""}`}
              style={{ animationDuration: `${TIMED_CHOICE_MS}ms` }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    );
  }

  if (!mode) return null;
  return <EscapePlayback mode={mode} reduced={reduced} onDone={onDone} />;
}

function EscapePlayback({
  mode,
  reduced,
  onDone,
}: {
  mode: "hide" | "run";
  reduced: boolean;
  onDone: () => void;
}) {
  const steps = escapeSteps(mode, reduced);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);

  useEffect(() => {
    if (mode === "hide") harlowAudio().loopHeartbeat();
    return () => harlowAudio().stopHeartbeat();
  }, [mode]);

  useEffect(() => {
    if (!step) {
      if (!finished.current) {
        finished.current = true;
        doneRef.current();
      }
      return;
    }
    const id = window.setTimeout(() => setIndex((current) => current + 1), step.ms);
    return () => window.clearTimeout(id);
  }, [step]);

  if (!step) return null;
  return <EscapeFrame step={step} />;
}

function EscapeFrame({ step }: { step: EscapeStep }) {
  const [figure, setFigure] = useState(STALKER_FIGURE);
  return (
    <div className={`${styles.scrim} ${step.black ? styles.black : ""} ${step.shake ? styles.shake : ""}`}>
      {step.strip === "open" && (
        <div className={styles.crack}>
          {step.text && <p className={styles.crackLine}>{step.text}</p>}
        </div>
      )}
      {step.figure && (
        <img
          src={figure}
          alt=""
          className={styles.figure}
          onError={() => setFigure((current) => (current === HOODED_FALLBACK ? current : HOODED_FALLBACK))}
        />
      )}
      {step.strip !== "open" && step.text && <p className={styles.runLine}>{step.text}</p>}
    </div>
  );
}
