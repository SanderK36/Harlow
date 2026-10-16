"use client";

import { useEffect, useId, useRef } from "react";

import { useGameSettings } from "@/game/useSettings";
import {
  TEXT_SIZE_PX,
  updateSettings,
  type TextSize,
  type TextSpeed,
} from "@/game/settings";
import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import styles from "./SettingsScreen.module.css";

type SettingsScreenProps = {
  onBack: () => void;
};

const SIZES: TextSize[] = ["S", "M", "L"];
const SPEEDS: { id: TextSpeed; label: string }[] = [
  { id: "slow", label: "Slow" },
  { id: "normal", label: "Normal" },
  { id: "instant", label: "Instant" },
];

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const settings = useGameSettings();
  const dialogRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reduced = useReducedMotion();

  useEffect(() => {
    backRef.current?.focus();
    const root = dialogRef.current;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onBack();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, input")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onBack]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 id={titleId}>Settings</h2>
          <button ref={backRef} type="button" className={styles.back} onClick={onBack}>
            Back
          </button>
        </header>
        <p className={styles.note}>Saved on this device. This is not a game save.</p>

        <fieldset className={styles.group}>
          <legend>Text size</legend>
          <div className={styles.choices} role="radiogroup" aria-label="Text size">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={settings.textSize === size}
                className={settings.textSize === size ? styles.choiceOn : styles.choice}
                onClick={() => updateSettings({ textSize: size })}
              >
                {size}
                <small>{TEXT_SIZE_PX[size]}</small>
              </button>
            ))}
          </div>
          <p className={styles.sample}>The rain has not let up.</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Text speed</legend>
          <div className={styles.choices} role="radiogroup" aria-label="Text speed">
            {SPEEDS.map((speed) => (
              <button
                key={speed.id}
                type="button"
                role="radio"
                aria-checked={settings.textSpeed === speed.id}
                className={settings.textSpeed === speed.id ? styles.choiceOn : styles.choice}
                onClick={() => updateSettings({ textSpeed: speed.id })}
              >
                {speed.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Volume</legend>
          <VolumeSlider
            label="Master"
            value={settings.masterVolume}
            onChange={(masterVolume) => updateSettings({ masterVolume })}
          />
          <VolumeSlider
            label="Music"
            value={settings.musicVolume}
            onChange={(musicVolume) => updateSettings({ musicVolume })}
          />
          <VolumeSlider
            label="SFX"
            value={settings.sfxVolume}
            onChange={(sfxVolume) => updateSettings({ sfxVolume })}
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Comfort</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={reduced}
              onChange={() => updateSettings({ reducedMotion: !reduced })}
            />
            <span>Reduced motion</span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={() => updateSettings({ highContrast: !settings.highContrast })}
            />
            <span>High contrast</span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={settings.skipSeenText}
              onChange={() => updateSettings({ skipSeenText: !settings.skipSeenText })}
            />
            <span>Skip seen text</span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={!settings.timedChoices}
              onChange={() => updateSettings({ timedChoices: !settings.timedChoices })}
            />
            <span>Timed choices: off</span>
          </label>
        </fieldset>
      </div>
    </div>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <label className={styles.slider}>
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-valuetext={`${percent} percent`}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <span className={styles.percent}>{percent}</span>
    </label>
  );
}
