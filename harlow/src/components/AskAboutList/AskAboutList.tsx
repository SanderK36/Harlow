"use client";

import { useState } from "react";

import { NEVER_MIND_LINE } from "@/game/askAbout";
import { CLUE_DEFS, type ClueId } from "@/game/clues";

import styles from "./AskAboutList.module.css";

type AskAboutListProps = {
  topics: ClueId[];
  asked: readonly ClueId[];
  onAsk: (clue: ClueId) => void;
  onNeverMind: () => void;
};

function Thumb({ src }: { src?: string }) {
  const [missing, setMissing] = useState(!src);
  if (!src || missing) return <span className={styles.thumbEmpty} aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.thumb} onError={() => setMissing(true)} />
  );
}

/**
 * Replaces the reply list. Each note is the clue, and Never mind returns
 * to the ordinary choices. Already-asked clues stay, fainter, with a check.
 */
export default function AskAboutList({ topics, asked, onAsk, onNeverMind }: AskAboutListProps) {
  return (
    <div className={styles.list}>
      <ul>
        {topics.map((id) => {
          const clue = CLUE_DEFS[id];
          const done = asked.includes(id);
          return (
            <li key={id}>
              <button
                type="button"
                className={done ? styles.asked : styles.note}
                onClick={() => onAsk(id)}
              >
                <Thumb src={clue.image} />
                <span className={styles.name}>{clue.name}</span>
                {done && <span className={styles.check} aria-hidden="true">✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.never} onClick={onNeverMind}>
        {NEVER_MIND_LINE}
      </button>
    </div>
  );
}
