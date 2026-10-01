import styles from "./Atmosphere.module.css";

type AtmosphereProps = {
  night: boolean;
};

/**
 * Film grain and a dark vignette over the whole game, like an old VHS
 * transfer. Purely decorative: it never takes clicks.
 */
export default function Atmosphere({ night }: AtmosphereProps) {
  return (
    <div className={`${styles.atmosphere}${night ? ` ${styles.night}` : ""}`} aria-hidden="true">
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  );
}
