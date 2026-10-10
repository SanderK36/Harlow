"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import styles from "./Prologue.module.css";
import dialogue from "@/components/DialogueScene/DialogueScene.module.css";
import thoughtStyles from "@/components/ThoughtPanel/ThoughtPanel.module.css";
import ActionButton from "@/components/ActionButton/ActionButton";
import { revealDelay, useReducedMotion } from "@/components/DialogueScene/typewriter";
import { harlowAudio } from "@/game/audio";
import {
  OUTDOOR_BEATS,
  PROLOGUE,
  PROLOGUE_IMAGES,
  PROLOGUE_VIDEOS,
  type PrologueBeat,
  type PrologueChoice,
  type PrologueImage,
  type PrologueLine,
} from "@/game/prologue";

type PrologueProps = {
  /** Called once the prologue has faded out (finished or skipped). */
  onDone: () => void;
};

/** A line on screen; `chosen` marks the reply the player just picked. */
type ActiveLine = PrologueLine & { chosen?: boolean };

type Position = { node: number; branch: ActiveLine[] };

type Strike = "flash" | "killer" | "dark";

const IMAGE_ORDER = Object.keys(PROLOGUE_IMAGES) as PrologueImage[];
// Ethan's picked reply steps aside on its own, as in conversations.
const CHOSEN_AUTO_ADVANCE = 520;
const THOUGHT_PACE = 0.8;
const LEAVE_FADE = 900;
// The lightning: a white strobe, the killer for about a second, then dark.
const STRIKE_KILLER_AT = 110;
const STRIKE_DARK_AT = 1150;
const STRIKE_TEXT_AT = 420;
const STRIKE_THUNDER_AT = 260;
// Without motion the flash becomes a soft fade, held a little longer.
const STRIKE_DARK_AT_REDUCED = 1700;

function imageFor(beat: PrologueBeat, strike: Strike | null): PrologueImage {
  if (beat === "strike") return strike === "dark" ? "street" : "killer";
  if (beat === "aftermath") return "street";
  return beat;
}

function isInteractive(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("button, a, input");
}

/**
 * The new-game prologue: full-frame art with lines in the dialogue box and
 * thought panel styles, a short conversation with Walter, and the lightning.
 * Every picture is shown whole, with a blurred copy filling the rest.
 * Click, tap, Space or Enter moves on; Escape or the Skip button ends it.
 */
export default function Prologue({ onDone }: PrologueProps) {
  const reducedMotion = useReducedMotion();
  const [position, setPosition] = useState<Position>({ node: 0, branch: [] });
  const [progress, setProgress] = useState({ key: "", revealed: 0 });
  const [strike, setStrike] = useState<Strike | null>(null);
  const [strikeTextReady, setStrikeTextReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const choicesRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const node = PROLOGUE[position.node];
  const beat = node.beat;
  const line: ActiveLine | null = position.branch[0] ?? (node.kind === "choice" ? null : node);
  const choice = !line && node.kind === "choice" ? node : null;
  // The lightning text waits a beat.
  const lineHidden = beat === "strike" && !strikeTextReady;
  const lineKey = `${position.node}:${position.branch.length}:${line?.text ?? ""}`;
  // While Ethan picks a reply, the line he is answering stays in the box.
  const previous = PROLOGUE[position.node - 1];
  const answering = choice && previous && previous.kind !== "choice" ? previous : null;
  const boxLine: ActiveLine | null = line ?? answering;

  const text = line?.text ?? "";
  const revealed = progress.key === lineKey ? progress.revealed : 0;
  const shown = reducedMotion ? text.length : Math.min(revealed, text.length);
  const lineComplete = !line || (!lineHidden && shown >= text.length);
  const strikeHolding = beat === "strike" && strike !== "dark";

  function leave() {
    setLeaving(true);
  }

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDone();
    }, reducedMotion ? 200 : LEAVE_FADE);
    return () => window.clearTimeout(timer);
  }, [leaving, onDone, reducedMotion]);

  function next() {
    const { node: index, branch } = position;
    if (branch.length > 1) setPosition({ node: index, branch: branch.slice(1) });
    else if (index + 1 < PROLOGUE.length) setPosition({ node: index + 1, branch: [] });
    else leave();
  }

  const autoNext = useEffectEvent(next);

  function choose(option: PrologueChoice) {
    setPosition(({ node: index }) => ({
      node: index,
      branch: [
        { kind: "say", speaker: "Ethan", text: option.label, chosen: true },
        ...option.reply,
      ],
    }));
  }

  function advance() {
    if (leaving) return;
    if (!line || lineHidden) return;
    if (!lineComplete) {
      setProgress({ key: lineKey, revealed: text.length });
      return;
    }
    if (strikeHolding || line.chosen) return;
    next();
  }

  // Typewriter, with an optional silent beat partway through a line.
  useEffect(() => {
    if (!line || lineHidden || lineComplete || leaving) return;
    const previous = shown === 0 ? undefined : text[shown - 1];
    const pause = line.kind === "say" && line.pause?.after === shown ? line.pause.ms : null;
    const timer = window.setTimeout(
      () => setProgress({ key: lineKey, revealed: shown + 1 }),
      pause ?? revealDelay(previous, line.kind === "thought" ? THOUGHT_PACE : 1),
    );
    return () => window.clearTimeout(timer);
  }, [leaving, line, lineComplete, lineHidden, lineKey, shown, text]);

  // Ethan's picked reply moves on to the answer by itself.
  useEffect(() => {
    if (!line?.chosen || !lineComplete) return;
    const timer = window.setTimeout(autoNext, reducedMotion ? 300 : CHOSEN_AUTO_ADVANCE);
    return () => window.clearTimeout(timer);
  }, [line, lineComplete, reducedMotion]);

  // The lightning strike timeline.
  useEffect(() => {
    if (beat !== "strike") return;
    const timers = [
      window.setTimeout(() => setStrike(reducedMotion ? "killer" : "flash"), 0),
      window.setTimeout(() => setStrike((current) => (current === "flash" ? "killer" : current)), STRIKE_KILLER_AT),
      window.setTimeout(() => harlowAudio().thunder(0.15), reducedMotion ? 120 : STRIKE_THUNDER_AT),
      window.setTimeout(() => setStrikeTextReady(true), reducedMotion ? 300 : STRIKE_TEXT_AT),
      window.setTimeout(() => setStrike("dark"), reducedMotion ? STRIKE_DARK_AT_REDUCED : STRIKE_DARK_AT),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [beat, reducedMotion]);

  // No rain bed under the prologue (the rain has stopped); only the thunder.
  const outdoors = OUTDOOR_BEATS.includes(beat);
  useEffect(() => {
    harlowAudio().setAmbience({ indoor: !outdoors, weather: "Cloudy" });
  }, [outdoors]);
  useEffect(() => () => harlowAudio().setAmbience(null), []);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      event.preventDefault();
      leave();
      return;
    }
    if (choice && /^[1-9]$/.test(event.key)) {
      const option = choice.options[Number(event.key) - 1];
      if (option) {
        event.preventDefault();
        choose(option);
      }
      return;
    }
    if ((event.key === " " || event.key === "Enter") && !isInteractive(event.target)) {
      event.preventDefault();
      if (!event.repeat) advance();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Choices take focus so keyboard players can pick with arrows/Enter too.
  useEffect(() => {
    if (choice) choicesRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [choice]);

  const visibleImage = imageFor(beat, strike);
  const visibleIndex = IMAGE_ORDER.indexOf(visibleImage);
  const furthestIndex = Math.max(visibleIndex, IMAGE_ORDER.indexOf(beat === "aftermath" ? "killer" : imageFor(beat, null)));
  const strikeCut = beat === "strike" || beat === "aftermath";
  const sirens = beat === "bed" || beat === "window";
  const isEthan = boxLine?.kind === "say" && boxLine.speaker === "Ethan";
  const awaitingContinue = lineComplete && !!line && !line.chosen && !strikeHolding;

  return (
    <div
      className={`${styles.prologue} ${leaving ? styles.leaving : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        if (!isInteractive(event.target)) advance();
      }}
      role="presentation"
    >
      {IMAGE_ORDER.map((image, index) => {
        const active = image === visibleImage;
        const video = image === "stairs" ? PROLOGUE_VIDEOS.stairs : undefined;
        // Load each picture one beat ahead of when it is needed.
        const load = index <= furthestIndex + 1;
        return (
          <div
            key={image}
            className={`${styles.layer} ${active ? styles.layerActive : ""} ${
              strikeCut && (image === "killer" || image === "street") ? styles.layerCut : ""
            } ${image === "street" && beat === "strike" && strike === "dark" ? styles.layerDark : ""}`}
            aria-hidden={!active}
          >
            {load && (
              <>
                {video ? (
                  <video
                    className={styles.backdrop}
                    src={video}
                    poster={PROLOGUE_IMAGES[image]}
                    autoPlay={active}
                    muted
                    playsInline
                    preload={active ? "auto" : "none"}
                    aria-hidden="true"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img className={styles.backdrop} src={PROLOGUE_IMAGES[image]} alt="" aria-hidden="true" />
                )}
                <div className={styles.frame}>
                  {video ? (
                    <video
                      className={styles.art}
                      src={video}
                      poster={PROLOGUE_IMAGES[image]}
                      autoPlay={active}
                      muted
                      playsInline
                      preload={active ? "auto" : "none"}
                      aria-label="Ethan walking down the stairs"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className={styles.art} src={PROLOGUE_IMAGES[image]} alt="" />
                  )}
                  {(image === "bed" || image === "window") && (
                    <div className={`${styles.sirens} ${sirens && active ? styles.sirensOn : ""}`} aria-hidden="true" />
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      <div className={styles.vignette} aria-hidden="true" />
      {strike === "flash" && <div className={styles.flash} aria-hidden="true" />}

      <div className={styles.topBar}>
        <span className={`scene-caption-plate ${styles.chapter}`}>Prologue</span>
        <span className={styles.hint} aria-hidden="true">
          <span className={styles.hintPointer}>Click or press Space to continue</span>
          <span className={styles.hintTouch}>Tap to continue</span>
        </span>
        <button type="button" className={styles.skip} onClick={leave}>
          Skip prologue
          <span className={styles.skipKey} aria-hidden="true">Esc</span>
        </button>
      </div>

      <div className={styles.textArea}>

        {line && !lineHidden && line.kind === "thought" && (
          <div key={lineKey} className={thoughtStyles.panel} role="status">
            <div className={thoughtStyles.plateRow} aria-hidden="true">
              <span className={thoughtStyles.namePlate}>Ethan</span>
              <span className={thoughtStyles.caption}>Inner thought</span>
            </div>
            <button type="button" className={thoughtStyles.lineButton} onClick={advance} aria-label={lineComplete ? "Continue" : "Show the full line"}>
              <span className={thoughtStyles.line} aria-hidden="true">
                {text.slice(0, shown)}
                {!lineComplete && <span className={thoughtStyles.caret} />}
                <span className={thoughtStyles.unrevealed}>{text.slice(shown)}</span>
                {awaitingContinue && <span className={thoughtStyles.next} />}
              </span>
            </button>
            <p className={thoughtStyles.srOnly}>{`Ethan (inner thought): ${text}`}</p>
          </div>
        )}

        {boxLine && !lineHidden && boxLine.kind !== "thought" && (
          <div className={`${dialogue.box} ${isEthan ? dialogue.boxEthan : ""} ${styles.box}`}>
            {boxLine.kind === "say" && (
              <div
                key={`${lineKey}-plate`}
                className={`${dialogue.namePlate} ${isEthan ? dialogue.namePlateEthan : ""}`}
              >
                {boxLine.speaker}
              </div>
            )}
            <button
              type="button"
              className={dialogue.lineButton}
              onClick={advance}
              aria-label={lineComplete ? "Continue" : "Show the full line"}
              tabIndex={choice ? -1 : 0}
            >
              <span
                key={lineKey}
                className={`${dialogue.line} ${boxLine.kind === "narration" ? dialogue.lineNarration : ""}`}
                aria-hidden="true"
              >
                {line ? text.slice(0, shown) : boxLine.text}
                {!lineComplete && <span className={dialogue.caret} />}
                {line && <span className={dialogue.unrevealed}>{text.slice(shown)}</span>}
              </span>
              {awaitingContinue && (
                <span className={dialogue.prompt} aria-hidden="true">
                  Continue
                  <span className={dialogue.promptGlyph} />
                </span>
              )}
            </button>
            {choice && (
              <div ref={choicesRef} className={styles.choices}>
                {choice.options.map((option) => (
                  <ActionButton key={option.label} label={option.label} onClick={() => choose(option)} />
                ))}
              </div>
            )}
            <p className={dialogue.srOnly} aria-live="polite">
              {choice
                ? "Choose what Ethan says."
                : `${boxLine.kind === "say" ? boxLine.speaker : "Narration"}: ${text}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
