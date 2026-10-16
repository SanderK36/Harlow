import styles from "./ImageText.module.css";
import { inscriptionPresentation, type Inscription } from "./imageText";

type ImageTextProps = {
  src: string;
  alt: string;
  inscriptions: Inscription[];
  imageClassName?: string;
  onError?: () => void;
  onClick?: () => void;
};

/**
 * Readable in-game text laid over a close-up. Scenes do not use this yet;
 * the demo page at /image-text-demo shows the three kinds.
 */
export default function ImageText({
  src,
  alt,
  inscriptions,
  imageClassName,
  onError,
  onClick,
}: ImageTextProps) {
  return (
    <figure className={styles.frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={imageClassName ? `${styles.image} ${imageClassName}` : styles.image}
        onError={onError}
        onClick={onClick}
      />
      {inscriptions.map((inscription) => {
        const ink = inscriptionPresentation(inscription.kind, inscription.rotate);
        return (
          <p
            key={inscription.id}
            className={`${styles.inscription} ${styles[inscription.kind]}`}
            style={{
              top: `${inscription.top}%`,
              left: `${inscription.left}%`,
              width: inscription.width === undefined ? undefined : `${inscription.width}%`,
              transform: `rotate(${ink.rotate}deg)`,
              mixBlendMode: ink.blend,
              fontFamily: ink.fontFamily,
              fontWeight: ink.weight,
            }}
          >
            {inscription.text}
          </p>
        );
      })}
    </figure>
  );
}
