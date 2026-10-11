"use client";

import { useEffect, useState } from "react";

import SaveWindow from "@/components/SaveWindow/SaveWindow";
import SoundToggle from "@/components/SoundToggle/SoundToggle";
import { readSaveSlots } from "@/game/save";
import styles from "./GameMenu.module.css";

type GameMenuProps = {
  onOpenCharacters: () => void;
  onOpenPause: () => void;
  onSave: (slotNumber: number) => boolean;
  onLoad: (slotNumber: number) => boolean;
  onSaveWindowChange?: (open: boolean) => void;
};

export default function GameMenu({
  onOpenCharacters,
  onOpenPause,
  onSave,
  onLoad,
  onSaveWindowChange,
}: GameMenuProps) {
  const [savesOpen, setSavesOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"save" | "load" | null>(null);
  const [slots, setSlots] = useState(() => readSaveSlots());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    onSaveWindowChange?.(saveMode !== null);
  }, [onSaveWindowChange, saveMode]);

  useEffect(() => {
    if (!savesOpen && !saveMode) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (saveMode) setSaveMode(null);
      else setSavesOpen(false);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [saveMode, savesOpen]);

  function openSaveWindow(mode: "save" | "load") {
    setSlots(readSaveSlots());
    setSaveMessage(null);
    setSavesOpen(false);
    setSaveMode(mode);
  }

  function selectSlot(slotNumber: number) {
    if (saveMode === "save") {
      setSaveMessage(onSave(slotNumber) ? `Saved in slot ${slotNumber}.` : "Could not save the game.");
      setSlots(readSaveSlots());
      return;
    }

    if (saveMode === "load" && onLoad(slotNumber)) {
      setSaveMode(null);
    }
  }

  return (
    <div className={styles.menu}>
      <SoundToggle />
      <button className={styles.word} type="button" onClick={onOpenCharacters}>
        Characters
      </button>
      <button
        className={styles.word}
        type="button"
        aria-expanded={savesOpen}
        aria-controls="game-menu-saves"
        onClick={() => setSavesOpen((open) => !open)}
      >
        Save/Load
      </button>
      <button
        className={styles.toggle}
        type="button"
        aria-label="Open pause menu"
        aria-expanded={false}
        aria-controls="pause-menu"
        onClick={onOpenPause}
      >
        <span />
        <span />
        <span />
      </button>

      {savesOpen && (
        <nav className={styles.actions} id="game-menu-saves" aria-label="Save or load">
          <button type="button" onClick={() => openSaveWindow("save")}>Save</button>
          <button type="button" onClick={() => openSaveWindow("load")}>Load</button>
        </nav>
      )}
      {saveMode && (
        <SaveWindow
          mode={saveMode}
          slots={slots}
          message={saveMessage}
          onSelect={selectSlot}
          onClose={() => setSaveMode(null)}
        />
      )}
    </div>
  );
}
