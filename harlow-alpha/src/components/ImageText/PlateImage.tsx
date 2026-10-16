"use client";

import { useState } from "react";

import ImageText from "./ImageText";
import styles from "./ImageText.module.css";
import type { Inscription } from "./imageText";

type PlateImageProps = {
  src: string;
  alt: string;
  /** Shown, with the same overlay, when `src` fails to load. */
  fallbackSrc?: string;
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
  fallbackSrc,
  inscriptions,
  imageClassName,
  onClick,
}: PlateImageProps) {
  const [shown, setShown] = useState(src);
  const [missing, setMissing] = useState(false);
  const words = inscriptions ?? [];

  function onPlateError() {
    if (fallbackSrc && shown !== fallbackSrc) {
      setShown(fallbackSrc);
      return;
    }
    setMissing(true);
  }

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
        src={shown}
        alt={alt}
        inscriptions={words}
        imageClassName={imageClassName}
        onError={onPlateError}
        onClick={onClick}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shown}
      alt={alt}
      className={imageClassName}
      onError={onPlateError}
      onClick={onClick}
    />
  );
}
