import styles from "./CharacterLine.module.css";

type CharacterLineProps = {
  text: string;
  effect?: {
    stat: string;
    amount: number;
  };
};

export default function CharacterLine({
  text,
  effect,
}: CharacterLineProps) {
  const sign =
    effect && effect.amount >= 0 ? "+" : "";

  return (
    <div className={styles.characterLine}>
      <img
        src="/images/characters/EthanParker/EthanParker.jpg"
        alt="Ethan Parker"
        className={styles.portrait}
      />

      <div className={styles.text}>
        <strong>
          <span>ETHAN</span>
          <span className={styles.label}>Inner thought</span>
        </strong>

        <div className={styles.thoughtRow}>
          <p>{text}</p>

          {effect && (
            <span
              className={`${styles.effect} ${
                styles[effect.stat.toLowerCase()]
              }`}
            >
              {sign}
              {effect.amount} {effect.stat.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
