"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import styles from "./OpeningSequence.module.css";
import { useReducedMotion } from "@/components/DialogueScene/typewriter";

type OpeningSequenceProps = {
  /** e.g. "Monday" */
  dayOfWeek: string;
  /** e.g. "October" */
  month: string;
  dayNumber: number;
  /** Minutes after midnight. */
  time: number;
  location: string;
  /** Called as the title card starts to lift off the first scene. */
  onReveal?: () => void;
  /** Called once the title card has faded away and the first scene shows. */
  onFinished: () => void;
};

type Phase = "splash" | "splashOut" | "title" | "titleOut";

const YEAR = 1982;
// The studio's .mov first; browsers that won't take a QuickTime file (Chrome
// reports it can't) fall through to the same H.264/AAC streams in an .mp4.
const SPLASH_SOURCES = [
  { src: "/lostFrequencyGamesIntro.mov", type: "video/quicktime" },
  { src: "/lostFrequencyGamesIntro.mp4", type: "video/mp4" },
];
// Fades between the studio splash, the black, and the title card.
const SPLASH_FADE = 700;
const TITLE_HOLD = 5200;
const TITLE_FADE = 1100;
// With reduced motion the card simply appears and goes; it's held a little
// shorter since nothing is animating in.
const TITLE_HOLD_REDUCED = 4000;
const SKIP_HINT_DELAY = 1200;
// Longest the splash may run (the film itself is 10 seconds).
const SPLASH_FAILSAFE = 16000;

function formatClock(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24;
  const suffix = hours < 12 ? "AM" : "PM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

/**
 * New-game intro: the Lost Frequency Games splash (filled edge to edge with a
 * blurred copy of itself), a fade to black, then a HARLOW title card with the
 * date, time and place over falling rain, which fades into the first scene.
 * Any click, tap or key skips ahead one step.
 */
export default function OpeningSequence({
  dayOfWeek,
  month,
  dayNumber,
  time,
  location,
  onReveal,
  onFinished,
}: OpeningSequenceProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("splash");
  const [showSkipHint, setShowSkipHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);

  const reveal = useEffectEvent(() => onReveal?.());

  const finish = useEffectEvent(() => {
    if (finished.current) return;
    finished.current = true;
    onFinished();
  });

  const endSplash = () => setPhase((current) => (current === "splash" ? "splashOut" : current));

  function advance() {
    if (phase === "splash") endSplash();
    else if (phase === "title") setPhase("titleOut");
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    event.preventDefault();
    advance();
  });

  // Each phase moves itself on after its fade or hold.
  useEffect(() => {
    let delay: number | null = null;
    let next: (() => void) | null = null;
    if (phase === "splashOut") {
      delay = reducedMotion ? 0 : SPLASH_FADE;
      next = () => setPhase("title");
    } else if (phase === "title") {
      delay = reducedMotion ? TITLE_HOLD_REDUCED : TITLE_HOLD;
      next = () => setPhase("titleOut");
    } else if (phase === "titleOut") {
      reveal();
      delay = reducedMotion ? 0 : TITLE_FADE;
      next = finish;
    }
    if (delay === null || !next) return;
    const timer = window.setTimeout(next, delay);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion]);

  // The intro has sound. Starting a new game is a click, so browsers normally
  // allow it; if one still refuses, play it muted rather than sit on a still.
  // A stalled or missing video can't hold the player on the splash forever.
  useEffect(() => {
    const video = videoRef.current;
    video?.play().catch(() => {
      if (!video) return;
      video.muted = true;
      video.play().catch(endSplash);
    });
    const failsafe = window.setTimeout(endSplash, SPLASH_FAILSAFE);
    return () => window.clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkipHint(true), SKIP_HINT_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep the blurred backdrop copy roughly in step with the real video.
  function syncBackdrop() {
    const video = videoRef.current;
    const backdrop = backdropRef.current;
    if (!video || !backdrop) return;
    if (Math.abs(backdrop.currentTime - video.currentTime) > 0.25) {
      backdrop.currentTime = video.currentTime;
    }
  }

  const inSplash = phase === "splash" || phase === "splashOut";
  const date = `${dayOfWeek}, ${month} ${dayNumber}, ${YEAR}`;

  return (
    <div
      className={`${styles.sequence} ${phase === "titleOut" ? styles.sequenceOut : ""}`}
      onClick={advance}
      role="presentation"
    >
      {inSplash && (
        <div
          className={`${styles.splash} ${phase === "splashOut" ? styles.splashOut : ""}`}
          role="status"
          aria-label="A Lost Frequency Games production"
        >
          <video
            ref={backdropRef}
            className={styles.splashBackdrop}
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          >
            {SPLASH_SOURCES.map((source) => (
              <source key={source.src} {...source} />
            ))}
          </video>
          <video
            ref={videoRef}
            className={styles.splashVideo}
            autoPlay
            playsInline
            onTimeUpdate={syncBackdrop}
            onEnded={endSplash}
            // React bubbles a skipped <source>'s error up to here (Chrome skips
            // the .mov), so only the video's own errors count.
            onError={(event) => {
              if (event.target === event.currentTarget) endSplash();
            }}
          >
            {/* With <source> children the element itself doesn't report a
                failed load; the last source does once every one has failed. */}
            {SPLASH_SOURCES.map((source, index) => (
              <source
                key={source.src}
                {...source}
                onError={index === SPLASH_SOURCES.length - 1 ? endSplash : undefined}
              />
            ))}
          </video>
          <div className={styles.vignette} aria-hidden="true" />
        </div>
      )}

      {(phase === "title" || phase === "titleOut") && (
        <div className={styles.titleCard} role="status" aria-label={`Harlow. ${date}, ${formatClock(time)}, ${location}.`}>
          <div className={styles.rain} aria-hidden="true" />
          <div className={styles.vignette} aria-hidden="true" />
          <div className={styles.titleContent} aria-hidden="true">
            <h1 className={styles.title}>Harlow</h1>
            <span className={styles.rule} />
            <p className={styles.date}>{date}</p>
            <p className={styles.place}>
              {formatClock(time)}
              <span className={styles.dot}>·</span>
              {location}
            </p>
          </div>
        </div>
      )}

      <p
        className={`${styles.skipHint} ${showSkipHint && phase !== "titleOut" ? styles.skipHintVisible : ""}`}
        aria-hidden="true"
      >
        <span className={styles.hintPointer}>Click or press any key to skip</span>
        <span className={styles.hintTouch}>Tap to skip</span>
      </p>
    </div>
  );
}
