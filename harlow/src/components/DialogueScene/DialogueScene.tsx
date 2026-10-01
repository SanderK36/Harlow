"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";

import styles from "./DialogueScene.module.css";
import type { StoryEntry } from "@/game/story";
import { getPortrait } from "@/game/portraits";
import StoryLog from "@/components/StoryLog/StoryLog";
import { prefersReducedMotion, revealDelay, useReducedMotion } from "./typewriter";

type DialogueLine = {
  speaker: string | null;
  text: string;
};

type DialogueSceneProps = {
  entries: StoryEntry[];
  active: boolean;
  /** Reply buttons; only shown once the latest line has been read. */
  choices?: ReactNode;
};

// Ethan's own (already chosen) line steps aside on its own for the NPC reply.
const ETHAN_AUTO_ADVANCE = 520;

function toDialogueLines(entries: StoryEntry[]): DialogueLine[] {
  return entries.flatMap((entry): DialogueLine[] => {
    if (entry.type === "conversation") {
      return [{ speaker: entry.character, text: entry.text }];
    }
    if (entry.type === "narration") {
      return [{ speaker: null, text: entry.text }];
    }
    return [];
  });
}

function isEthan(speaker: string | null) {
  return speaker?.toLowerCase() === "ethan";
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !!target.closest("button, a, input, textarea, select, [contenteditable='true']")
  );
}

/**
 * Visual-novel presentation of a conversation: the scene stays behind,
 * the conversation partner's portrait stands on the left (Ethan's on the
 * right while he speaks), and the newest line types into a dialogue box.
 */
export default function DialogueScene({
  entries,
  active,
  choices,
}: DialogueSceneProps) {
  const lines = toDialogueLines(entries);
  const reducedMotion = useReducedMotion();
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [knownLineCount, setKnownLineCount] = useState(lines.length);
  const [showHistory, setShowHistory] = useState(false);
  const choicesRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const lineIndex = Math.min(cursor, Math.max(0, lines.length - 1));
  const line = lines[lineIndex];
  const hasLine = line !== undefined;
  const fullLength = line?.text.length ?? 0;
  const shown = reducedMotion ? fullLength : Math.min(revealed, fullLength);
  const lineComplete = shown >= fullLength;

  // New lines arrived (or a new conversation started). Adjusting state while
  // rendering avoids a flash of the stale line.
  if (lines.length !== knownLineCount) {
    setKnownLineCount(lines.length);
    if (lines.length < knownLineCount) {
      setCursor(0);
      setRevealed(0);
    } else if (lineComplete && lineIndex === knownLineCount - 1 && !isEthan(line?.speaker ?? null)) {
      // The reader is caught up and waiting, so go straight to the reply.
      setCursor(knownLineCount);
      setRevealed(0);
    }
  }

  const hasQueuedLines = lineIndex < lines.length - 1;
  const readyForChoices = active && lineComplete && !hasQueuedLines;
  const speakerIsEthan = isEthan(line?.speaker ?? null);
  const partner = lines.find((entry) => entry.speaker && !isEthan(entry.speaker))?.speaker ?? null;

  // Typewriter: reveal one character per tick.
  useEffect(() => {
    if (!active || lineComplete || !line) return;
    const timer = window.setTimeout(
      () => setRevealed(shown + 1),
      revealDelay(shown === 0 ? undefined : line.text[shown - 1])
    );
    return () => window.clearTimeout(timer);
  }, [active, line, lineComplete, shown]);

  // Ethan's line has already been chosen by the player; once it has been
  // spoken, move on to the queued reply without asking for another click.
  useEffect(() => {
    if (!active || !lineComplete || !hasQueuedLines || !speakerIsEthan) return;
    const timer = window.setTimeout(() => {
      setCursor(lineIndex + 1);
      setRevealed(0);
    }, reducedMotion ? 0 : ETHAN_AUTO_ADVANCE);
    return () => window.clearTimeout(timer);
  }, [active, hasQueuedLines, lineComplete, lineIndex, reducedMotion, speakerIsEthan]);

  function advance() {
    if (!active) return;
    if (!lineComplete) {
      setRevealed(fullLength);
      return;
    }
    if (hasQueuedLines) {
      setCursor(lineIndex + 1);
      setRevealed(0);
    }
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === "Escape" && showHistory) {
      setShowHistory(false);
      return;
    }
    if (showHistory) return;

    if ((event.key === " " || event.key === "Enter") && !isInteractiveTarget(event.target)) {
      event.preventDefault();
      advance();
      return;
    }

    // Number keys pick a reply once it is on screen.
    if (readyForChoices && /^[1-9]$/.test(event.key) && !isInteractiveTarget(event.target)) {
      const buttons = choicesRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      const choice = buttons?.[Number(event.key) - 1];
      if (choice) {
        event.preventDefault();
        choice.click();
      }
    }
  });

  // On phones the conversation stage is taller than the space left under the
  // status panel, so bring it into view when a conversation opens.
  useEffect(() => {
    if (!active || !window.matchMedia("(max-width: 640px)").matches) return;
    stageRef.current?.closest(".scene-image-frame")?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [active]);

  // Expose the box height so phone portraits can rest on its top edge
  // whatever the line length or number of replies.
  useEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;
    // On wide screens the box keeps its tallest height for the conversation
    // (replies vanish while an answer is pending), so the busts behind it never
    // bob. Phones stack replies, so holding that height would leave a mostly
    // empty box; there the busts ride the box edge instead.
    const wide = window.matchMedia("(min-width: 641px)");
    let tallest = 0;
    let width = stage.clientWidth;
    const observer = new ResizeObserver(() => {
      if (stage.clientWidth !== width || !wide.matches) {
        width = stage.clientWidth;
        tallest = 0;
        box.style.minHeight = "";
      }
      tallest = wide.matches ? Math.max(tallest, box.offsetHeight) : box.offsetHeight;
      if (wide.matches) box.style.minHeight = `${tallest}px`;
      stage.style.setProperty("--dialogue-box-height", `${tallest}px`);
    });
    observer.observe(box);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [hasLine]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (!line) return null;

  const awaitingContinue = lineComplete && hasQueuedLines && !speakerIsEthan;

  return (
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.cast} aria-hidden="true">
        {partner && (
          <div
            className={`${styles.portrait} ${styles.partnerPortrait} ${
              speakerIsEthan || !line.speaker ? styles.portraitIdle : styles.portraitSpeaking
            }`}
          >
            <Image
              src={getPortrait(partner)}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, 360px"
              loading="eager"
            />
          </div>
        )}
        <div
          className={`${styles.portrait} ${styles.ethanPortrait} ${
            speakerIsEthan ? styles.portraitSpeaking : styles.portraitIdle
          }`}
        >
          <Image
            src={getPortrait("Ethan")}
            alt=""
            fill
            sizes="(max-width: 640px) 40vw, 300px"
            loading="eager"
          />
        </div>
      </div>

      <div
        ref={boxRef}
        className={`${styles.box} ${speakerIsEthan ? styles.boxEthan : ""} ${
          line.speaker ? "" : styles.boxNarration
        }`}
      >
        {line.speaker && (
          <div
            key={`${lineIndex}-${line.speaker}`}
            className={`${styles.namePlate} ${speakerIsEthan ? styles.namePlateEthan : ""}`}
          >
            {line.speaker}
          </div>
        )}

        <button
          type="button"
          className={styles.history}
          onClick={() => setShowHistory((visible) => !visible)}
          aria-pressed={showHistory}
          tabIndex={active ? 0 : -1}
        >
          Log
        </button>

        <button
          type="button"
          className={styles.lineButton}
          onClick={advance}
          aria-label={
            lineComplete
              ? hasQueuedLines
                ? "Continue to the next line"
                : `${line.speaker ?? "Narration"}: ${line.text}`
              : "Show the full line"
          }
          tabIndex={active && !readyForChoices ? 0 : -1}
        >
          <span
            key={lineIndex}
            className={`${styles.line} ${line.speaker ? "" : styles.lineNarration}`}
            aria-hidden="true"
          >
            {line.text.slice(0, shown)}
            {!lineComplete && <span className={styles.caret} />}
            <span className={styles.unrevealed}>{line.text.slice(shown)}</span>
          </span>
          {awaitingContinue && (
            <span className={styles.prompt} aria-hidden="true">
              Continue
              <span className={styles.promptGlyph} />
            </span>
          )}
        </button>

        {/* Screen readers get each finished line once, not every typed character. */}
        <p className={styles.srOnly} aria-live="polite">
          {`${line.speaker ?? "Narration"}: ${line.text}`}
        </p>

        {choices && (
          <div
            ref={choicesRef}
            className={`${styles.choices} ${readyForChoices ? styles.choicesVisible : ""}`}
            inert={!readyForChoices}
          >
            {choices}
          </div>
        )}
      </div>

      {showHistory && (
        <div className={styles.historyPanel} role="dialog" aria-label="Conversation log">
          <StoryLog entries={entries} title="Conversation log" variant="conversation" />
          <button
            type="button"
            className={styles.historyClose}
            onClick={() => setShowHistory(false)}
          >
            Back to conversation
          </button>
        </div>
      )}
    </div>
  );
}
