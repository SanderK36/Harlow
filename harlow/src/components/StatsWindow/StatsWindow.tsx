import styles from "./StatsWindow.module.css";
import type { Player } from "@/game/types";

type StatsWindowProps = {
  player: Player;
  onClose: () => void;
};

const ROWS: Array<{
  key: "courage" | "intelligence" | "charisma" | "athletics" | "strength";
  label: string;
  note: string;
}> = [
  { key: "courage", label: "Courage", note: "How steadily you face what you find." },
  { key: "intelligence", label: "Intelligence", note: "What you notice, and what you can put together." },
  { key: "charisma", label: "Charisma", note: "Whether people open up or shut you out." },
  { key: "athletics", label: "Athletics", note: "How well you move when you have to." },
  { key: "strength", label: "Strength", note: "What you can force, lift, or hold." },
];

export default function StatsWindow({ player, onClose }: StatsWindowProps) {
  return (
    <div className={styles.backdrop}>
      <div
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
      >
        <header className={styles.header}>
          <p className={styles.caseLabel}>Index card</p>
          <h2 id="stats-title">Stats</h2>
        </header>
        <ul className={styles.list}>
          {ROWS.map((row) => (
            <li key={row.key}>
              <p className={styles.line}>
                <span>{row.label}</span>
                <span className={styles.statsNumber}>{player[row.key]}</span>
              </p>
              <p className={styles.note}>{row.note}</p>
            </li>
          ))}
        </ul>
        <div className={styles.closeRow}>
          <button className={styles.closeButton} type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
