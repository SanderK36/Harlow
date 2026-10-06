"use client";

import { useState } from "react";

import SaveWindow from "@/components/SaveWindow/SaveWindow";
import SoundToggle from "@/components/SoundToggle/SoundToggle";
import { readSaveSlots } from "@/game/save";
import styles from "./GameMenu.module.css";

type GameMenuProps = {
  onOpenCharacters: () => void;
  onMainMenu: () => void;
  onSave: (slotNumber: number) => boolean;
  onLoad: (slotNumber: number) => boolean;
  /** Optional. Opening the menu does not dismiss thoughts; the menu paints above them. */
  onOpen?: () => void;
};

export default function GameMenu({ onOpenCharacters, onMainMenu, onSave, onLoad, onOpen }: GameMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"save" | "load" | null>(null);
  const [slots, setSlots] = useState(() => readSaveSlots());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function openCharacters() {
    setIsOpen(false);
    onOpenCharacters();
  }

  function goToMainMenu() {
    setIsOpen(false);
    onMainMenu();
  }

  function openSaveWindow(mode: "save" | "load") {
    setSlots(readSaveSlots());
    setSaveMessage(null);
    setIsOpen(false);
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
      <button
        className={styles.toggle}
        type="button"
        aria-label="Open game menu"
        aria-expanded={isOpen}
        aria-controls="game-menu-actions"
        onClick={() => {
          if (!isOpen) onOpen?.();
          setIsOpen((previous) => !previous);
        }}
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <nav className={styles.actions} id="game-menu-actions" aria-label="Game menu">
          <button type="button" onClick={openCharacters}>
            Characters
          </button>
          <button type="button" onClick={goToMainMenu}>Main Menu</button>
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
