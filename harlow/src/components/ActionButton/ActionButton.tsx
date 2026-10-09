import type { Ref } from "react";

import styles from "./ActionButton.module.css";

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Subtle notebook mark. The choice starts a quest that has not begun. */
  leadsQuest?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
};

export default function ActionButton({
  label,
  onClick,
  disabled = false,
  leadsQuest = false,
  buttonRef,
}: ActionButtonProps) {
  return (
    <button
      ref={buttonRef}
      className={`${styles.actionButton}${leadsQuest ? ` ${styles.leadsQuest}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.label}>{label}</span>
      {leadsQuest && (
        <>
          <span className={styles.leadMark} aria-hidden="true">
            <LeadGlyph />
          </span>
          <span className={styles.srOnly}>Starts a new lead</span>
        </>
      )}
    </button>
  );
}

/** 14px notebook and pencil. Bone colour comes from currentColor. */
function LeadGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" focusable="false">
      <rect x="1.15" y="1.35" width="7.15" height="10.5" rx="0.7" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <path d="M2.85 4.15h3.7M2.85 6.35h3.7M2.85 8.55h2.4" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" />
      <path d="M8.35 8.75 11.7 5.4l.9.9-3.35 3.35-1.05.25z" fill="currentColor" />
    </svg>
  );
}