/**
 * Ink drawn on top of a close-up so the painting itself can stay wordless.
 * Headline: bold serif from the body family (Crimson).
 * Photo captions and notes: the handwriting face used for Ethan's notebook lines.
 * A slight tilt and multiply blending keep the words in the paper, not on it.
 */

export type InscriptionKind = "headline" | "subline" | "body" | "caption" | "note";

export type Inscription = {
  id: string;
  kind: InscriptionKind;
  text: string;
  /** Percent from the top of the image. */
  top: number;
  /** Percent from the left of the image. */
  left: number;
  /** Percent width. Omitted means the line is as wide as its words. */
  width?: number;
  /** Degrees. Omitted uses the kind's slight default tilt. */
  rotate?: number;
};

const DEFAULTS: Record<InscriptionKind, { rotate: number; font: "body" | "handwriting"; weight: number }> = {
  headline: { rotate: -1.2, font: "body", weight: 600 },
  subline: { rotate: -0.4, font: "body", weight: 600 },
  body: { rotate: 0, font: "body", weight: 400 },
  caption: { rotate: -2, font: "handwriting", weight: 500 },
  note: { rotate: -3.5, font: "handwriting", weight: 500 },
};

export function inscriptionPresentation(kind: InscriptionKind, rotate?: number) {
  const defaults = DEFAULTS[kind];
  const tilt = rotate ?? defaults.rotate;
  return {
    font: defaults.font,
    weight: defaults.weight,
    blend: "multiply" as const,
    rotate: tilt,
    fontFamily: defaults.font === "body" ? "var(--font-body)" : "var(--font-handwriting)",
  };
}

/** Three plates for the demo page and the unit test. Not used by a scene. */
export const IMAGE_TEXT_DEMO: Inscription[] = [
  {
    id: "headline",
    kind: "headline",
    text: "Woman found dead in Harlow home",
    top: 10,
    left: 7,
    width: 86,
  },
  {
    id: "caption",
    kind: "caption",
    text: "Emily, summer of '72",
    top: 78,
    left: 8,
    width: 80,
  },
  {
    id: "note",
    kind: "note",
    text: "Don't go up there after dark.",
    top: 28,
    left: 14,
    width: 72,
  },
];

export function paperDataUri(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
