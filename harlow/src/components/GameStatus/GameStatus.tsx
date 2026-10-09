import styles from "./GameStatus.module.css";
import type { Player, GameState } from "@/game/types";
import { formatStatDelta } from "@/game/statLabels";
import { formatTime, weatherStatusLabel } from "@/game/utils";

export type StatNotice = { stat: string; amount: number };

type GameStatusProps = {
  player: Player;
  gameState: GameState;
  onStatsClick: () => void;
  onInventoryClick: (opener: HTMLButtonElement) => void;
  onQuestsClick: (opener: HTMLButtonElement) => void;
  notices?: StatNotice[];
};

const ATTRIBUTES = new Set(["courage", "intelligence", "charisma", "athletics", "strength"]);

function Delta({ notices }: { notices: StatNotice[] }) {
  return notices.map((notice, index) => (
    <span
      key={`${notice.stat}-${index}`}
      className={styles.delta}
      style={{ bottom: `calc(100% + ${index * 16}px)` }}
      aria-hidden="true"
    >
      {formatStatDelta(notice.stat, notice.amount)}
    </span>
  ));
}

export default function GameStatus({
  player,
  gameState,
  onStatsClick,
  onInventoryClick,
  onQuestsClick,
  notices = [],
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
            <Delta notices={notices.filter((notice) => ATTRIBUTES.has(notice.stat))} />
          </button>

          <button
            className={styles.statsButton}
            onClick={(event) => onInventoryClick(event.currentTarget)}
          >
            INVENTORY
          </button>

          <button
            className={`${styles.statsButton} ${styles.questsButton}`}
            onClick={(event) => onQuestsClick(event.currentTarget)}
          >
            QUESTS
          </button>

        </div>

        <div className={styles.playerDetails}>
          <h2>{player.name}</h2>

          <div className={styles.playerStats}>
            <p className={styles.money}>
              ${player.money}
              <Delta notices={notices.filter((notice) => notice.stat === "money")} />
            </p>

            <div className={styles.statWithMeter}>
              <p className={styles.health}>
                {player.health}/{player.maxHealth} HP
              </p>
              <Delta notices={notices.filter((notice) => notice.stat === "health")} />
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
              <Delta notices={notices.filter((notice) => notice.stat === "stamina")} />
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
              <Delta notices={notices.filter((notice) => notice.stat === "fear")} />
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
            <span>{weatherStatusLabel(gameState.weather, gameState.time)}</span>
          </div>

        </div>

      </div>

      <p className={styles.srOnly} role="status">
        {notices.map((notice) => formatStatDelta(notice.stat, notice.amount)).join(", ")}
      </p>
    </div>
  );
}
