"use client";

import { useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import styles from "./PauseMenu.module.css";

type PauseMenuProps = {
  /** Settings is open on top, so this menu should not take keys or focus. */
  suspended?: boolean;
  onResume: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
};

export default function PauseMenu({
  suspended = false,
  onResume,
  onSettings,
  onMainMenu,
}: PauseMenuProps) {
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (suspended || confirming) return;
    resumeRef.current?.focus();
    const root = dialogRef.current;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onResume();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button")];
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
  }, [confirming, onResume, suspended]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.menu}
        id="pause-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        <h2 id="pause-title">Paused</h2>
        <button ref={resumeRef} type="button" onClick={onResume}>
          Resume
        </button>
        <button type="button" onClick={onSettings}>
          Settings
        </button>
        <button type="button" onClick={() => setConfirming(true)}>
          Main Menu
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Main menu"
          message="Return to the main menu?"
          confirmLabel="Main Menu"
          cancelLabel="Cancel"
          onConfirm={onMainMenu}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
