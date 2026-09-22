import styles from "./StatsWindow.module.css";
import type { Player } from "@/game/types";

type StatsWindowProps = {
  player: Player;
  onClose: () => void;
};

export default function StatsWindow({ player, onClose }: StatsWindowProps) {
  return (
    <div className={styles.backdrop}>
        <div className={styles.window}>
            <h2>Stats</h2>
            <button className={styles.closeButton} onClick={onClose}>X</button>
            <p>Courage: <span className={styles.statsNumber}>{player.courage}</span></p>
            <p>Intelligence: <span className={styles.statsNumber}>{player.intelligence}</span></p>
            <p>Charisma: <span className={styles.statsNumber}>{player.charisma}</span></p>
            <p>Athletics: <span className={styles.statsNumber}>{player.athletics}</span></p>
            <p>Strength: <span className={styles.statsNumber}>{player.strength}</span></p>
        </div>
    </div>
  );
}