import styles from "./GameStatus.module.css";
import type { Player, GameState } from "@/game/types";
import { formatTime } from "@/game/utils";

type GameStatusProps = {
  player: Player;
  gameState: GameState;
  onStatsClick: () => void;
  onInventoryClick: () => void;
};

export default function GameStatus({
  player,
  gameState,
  onStatsClick,
  onInventoryClick,
}: GameStatusProps) {
  const percentage = (value: number, maximum: number) =>
    Math.min(100, Math.max(0, (value / maximum) * 100));

  return (
    <div className={styles.status}>

      {/* Player */}
      <div className={styles.playerInfo}>

        <div className={styles.portraitSection}>
          <img
            className={styles.portrait}
            src="/images/characters/EthanParker/EthanParker.jpg"
            alt=""
          />

          <button
            className={styles.statsButton}
            onClick={onStatsClick}
          >
            STATS
          </button>

          <button
            className={styles.statsButton}
            onClick={onInventoryClick}
          >
            INVENTORY
          </button>

        </div>

        <div className={styles.playerDetails}>
          <h2>{player.name}</h2>

          <div className={styles.playerStats}>
            <p className={styles.money}>
              ${player.money}
            </p>

            <div className={styles.statWithMeter}>
              <p className={styles.health}>
                {player.health}/{player.maxHealth} HP
              </p>
              <div
                className={`${styles.statMeter} ${styles.healthMeter}`}
                aria-label={`Health: ${Math.round(percentage(player.health, player.maxHealth))}%`}
              >
                <span style={{ width: `${percentage(player.health, player.maxHealth)}%` }} />
              </div>
            </div>

            <div className={styles.statWithMeter}>
              <p className={styles.stamina}>
                {player.stamina}/{player.maxStamina} STAM
              </p>
              <div
                className={`${styles.statMeter} ${styles.staminaMeter}`}
                aria-label={`Stamina: ${Math.round(percentage(player.stamina, player.maxStamina))}%`}
              >
                <span style={{ width: `${percentage(player.stamina, player.maxStamina)}%` }} />
              </div>
            </div>

            <div className={styles.statWithMeter}>
              <p className={styles.fear}>
                FEAR: {player.fear}
              </p>
              <div
                className={`${styles.statMeter} ${styles.fearMeter}`}
                aria-label={`Fear: ${Math.round(percentage(player.fear, 100))}%`}
              >
                <span style={{ width: `${percentage(player.fear, 100)}%` }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* World */}
      <div className={styles.worldInfo}>

        <div className={styles.timeInfo}>
          {formatTime(gameState.time)}
        </div>

        <div className={styles.worldDetails}>

          <div className={styles.dateInfo}>
            <span>{gameState.dayOfWeek}</span>
            <strong>
              {gameState.currentMonth} {gameState.dayNumber}
            </strong>
          </div>

          <div className={styles.locationInfo}>
            <strong>{gameState.location}</strong>
            <span>{gameState.weather}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
