"use client";

import { useState } from "react";

import ImageText from "./ImageText";
import styles from "./ImageText.module.css";
import type { Inscription } from "./imageText";

type PlateImageProps = {
  src: string;
  alt: string;
  inscriptions?: Inscription[];
  imageClassName?: string;
  onClick?: () => void;
};

/**
 * A close-up plate. A missing file becomes a dark card that still shows the
 * overlay text, and swaps back to the picture if the file appears later.
 */
export default function PlateImage({
  src,
  alt,
  inscriptions,
  imageClassName,
  onClick,
}: PlateImageProps) {
  const [missing, setMissing] = useState(false);
  const words = inscriptions ?? [];

  if (missing) {
    return (
      <div className={styles.missing} role="img" aria-label={alt} onClick={onClick}>
        {words.map((inscription) => (
          <p key={inscription.id} className={`${styles.missingText} ${styles[inscription.kind]}`}>
            {inscription.text}
          </p>
        ))}
      </div>
    );
  }

  if (words.length > 0) {
    return (
      <ImageText
        src={src}
        alt={alt}
        inscriptions={words}
        imageClassName={imageClassName}
        onError={() => setMissing(true)}
        onClick={onClick}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={imageClassName}
      onError={() => setMissing(true)}
      onClick={onClick}
    />
  );
}
