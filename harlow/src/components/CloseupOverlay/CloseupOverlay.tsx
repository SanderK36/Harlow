"use client";

import { useEffect } from "react";

import styles from "./CloseupOverlay.module.css";

export type CloseupContent = {
  image: string;
  thought: string;
  /** Optional short label for screen readers. */
  label?: string;
};

type CloseupOverlayProps = {
  closeup: CloseupContent;
  onDismiss: () => void;
};

/**
 * Full-frame closeup over a dark backdrop (poster, drawer, memory, cigarette).
 * Click, Space or Enter dismisses it.
 */
export default function CloseupOverlay({ closeup, onDismiss }: CloseupOverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={closeup.label ?? "Closeup"}
      onClick={onDismiss}
    >
      <p className={styles.hint}>Click or press Space</p>
      <div className={styles.frame} onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={closeup.image}
          alt=""
          className={styles.image}
          onClick={onDismiss}
        />
        <p className={styles.thought}>{closeup.thought}</p>
      </div>
    </div>
  );
}
