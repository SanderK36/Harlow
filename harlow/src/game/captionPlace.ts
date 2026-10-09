export type Box = { left: number; top: number; right: number; bottom: number };

export const CAPTION_DESKTOP_MIN = 280;
export const CAPTION_DESKTOP_MAX = 440;
export const CAPTION_EDGE = 16;

export type CaptionSpot = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "below";

const CORNERS: Array<Exclude<CaptionSpot, "below">> = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export function overlaps(a: Box, b: Box, slack = 1) {
  const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ix > slack && iy > slack;
}

/** Desktop boxes stay between 280 and 440. A phone uses the viewport minus 16px a side. */
export function captionBoxWidth(artWidth: number, viewportWidth: number) {
  if (viewportWidth <= 640) return viewportWidth - CAPTION_EDGE * 2;
  return Math.min(CAPTION_DESKTOP_MAX, Math.max(CAPTION_DESKTOP_MIN, artWidth - CAPTION_EDGE * 2));
}

export function cornerBox(
  art: Box,
  size: { width: number; height: number },
  spot: Exclude<CaptionSpot, "below">,
  margin = CAPTION_EDGE,
): Box {
  const { width, height } = size;
  switch (spot) {
    case "top-left":
      return {
        left: art.left + margin,
        top: art.top + margin,
        right: art.left + margin + width,
        bottom: art.top + margin + height,
      };
    case "top-right":
      return {
        left: art.right - margin - width,
        top: art.top + margin,
        right: art.right - margin,
        bottom: art.top + margin + height,
      };
    case "bottom-left":
      return {
        left: art.left + margin,
        top: art.bottom - margin - height,
        right: art.left + margin + width,
        bottom: art.bottom - margin,
      };
    case "bottom-right":
      return {
        left: art.right - margin - width,
        top: art.bottom - margin - height,
        right: art.right - margin,
        bottom: art.bottom - margin,
      };
  }
}

/**
 * First corner where the full-size box sits inside the art and misses every
 * obstacle. The box never shrinks. If none fit, the caption goes below the art.
 */
export function placeCaption(
  art: Box,
  size: { width: number; height: number },
  obstacles: Box[],
  margin = CAPTION_EDGE,
): CaptionSpot {
  const artWidth = art.right - art.left;
  const artHeight = art.bottom - art.top;
  if (size.width > artWidth - margin * 2 || size.height > artHeight - margin * 2) return "below";
  for (const spot of CORNERS) {
    const box = cornerBox(art, size, spot, margin);
    if (obstacles.some((obstacle) => overlaps(box, obstacle))) continue;
    return spot;
  }
  return "below";
}

function toBox(rect: DOMRect): Box {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function clearPictureSize(art: HTMLElement) {
  const image = art.querySelector<HTMLElement>(":scope > .scene-image");
  art.style.width = "";
  art.style.height = "";
  art.style.minHeight = "";
  art.style.marginLeft = "";
  art.style.marginRight = "";
  if (!image) return;
  image.style.display = "";
  image.style.width = "";
  image.style.height = "";
  image.style.maxHeight = "";
  image.style.maxWidth = "";
  image.style.objectFit = "";
}

/**
 * Puts the SCENE box in the first clear corner at full width. Hotspots and
 * the choice buttons block a corner, so the caption moves instead of the
 * buttons. Choices always stay painted on the picture. A caption or thought
 * that does not fit drops below the art. The picture keeps its size.
 */
export function placeSceneChrome(frame: HTMLElement) {
  const art = frame.querySelector<HTMLElement>(".scene-art");
  const stack = frame.querySelector<HTMLElement>(".scene-info-stack");
  const panel = frame.querySelector<HTMLElement>(".scene-info-panel");
  if (!art || !stack || !panel) return;

  const sceneId = frame.dataset.sceneId ?? "";
  const mode = window.innerWidth <= 640 ? "phone" : "desk";
  const keepHomeOverlays = mode === "desk" && (
    sceneId === "hallway"
    || sceneId === "kitchen"
    || sceneId === "living-room"
    || sceneId === "street"
  );
  const choiceList = frame.querySelector<HTMLElement>(":scope > .overlayActionList");
  if (frame.dataset.captionScene !== sceneId || frame.dataset.captionMode !== mode) {
    delete frame.dataset.choices;
    delete frame.dataset.thought;
    delete frame.dataset.caption;
    clearPictureSize(art);
    stack.style.cssText = "";
    panel.style.cssText = "";
    if (choiceList) choiceList.style.cssText = "";
    frame.dataset.captionScene = sceneId;
    frame.dataset.captionMode = mode;
  }

  const artRect = art.getBoundingClientRect();
  if (artRect.width < 2 || artRect.height < 2) return;

  // Pin twice: the first pass takes a list that was in normal flow out of
  // it, and the second measures that overlay.
  pinChoicesToArt(frame, art, choiceList);
  pinChoicesToArt(frame, art, choiceList);

  const hotspots = [...art.querySelectorAll<HTMLElement>(".scene-hotspot")]
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 2 && rect.height > 2)
    .map(toBox);

  const buttons = choiceList?.querySelector<HTMLElement>(".overlayActionButtons") ?? null;
  const heading = choiceList?.querySelector("h2");
  const buttonBox = buttons && buttons.getBoundingClientRect().height > 2
    ? toBox(buttons.getBoundingClientRect())
    : null;
  const headingBox = heading && heading.getBoundingClientRect().height > 2
    ? toBox(heading.getBoundingClientRect())
    : null;
  const choiceObstacles = [buttonBox, headingBox].filter((box): box is Box => box !== null);

  const phone = mode === "phone";
  let spot: CaptionSpot = "below";
  if (!phone) {
    const width = Math.min(
      CAPTION_DESKTOP_MAX,
      Math.max(CAPTION_DESKTOP_MIN, artRect.width - CAPTION_EDGE * 2),
    );
    stack.style.width = `${width}px`;
    panel.style.width = "100%";
    panel.style.minWidth = "0";
    panel.style.maxWidth = "none";
    panel.style.margin = "0";
    panel.style.overflow = "visible";
    // The box is the caption that is on screen. A lead reserve used to make
    // this taller than the text, so a free corner was thrown out.
    const height = stack.offsetHeight;
    const obstacles = keepHomeOverlays ? hotspots : [...hotspots, ...choiceObstacles];
    // Keep the home hallway and kitchen panels anchored over the art.
    spot = keepHomeOverlays ? "top-left" : placeCaption(toBox(artRect), { width, height }, obstacles);
    if (spot === "below") {
      stack.style.cssText = "";
      panel.style.cssText = "";
    } else {
      const frameRect = frame.getBoundingClientRect();
      const placed = cornerBox(toBox(artRect), { width, height }, spot);
      stack.style.position = "absolute";
      stack.style.margin = "0";
      stack.style.right = "auto";
      stack.style.bottom = "auto";
      stack.style.flexDirection = "column";
      stack.style.alignItems = "stretch";
      stack.style.top = `${Math.round(placed.top - frameRect.top)}px`;
      stack.style.left = `${Math.round(placed.left - frameRect.left)}px`;
    }
  } else {
    stack.style.cssText = "";
    panel.style.cssText = "";
  }

  const thought = frame.querySelector<HTMLElement>(":scope > .opening-thought");
  const captionBox = toBox(panel.getBoundingClientRect());
  const thoughtIsOverlay = Boolean(thought && getComputedStyle(thought).position === "absolute");
  const thoughtBox = thoughtIsOverlay && thought && thought.getBoundingClientRect().height > 2
    ? toBox(thought.getBoundingClientRect())
    : null;

  const thoughtCovered = Boolean(
    thoughtBox
    && (
      overlaps(thoughtBox, captionBox)
      || hotspots.some((hotspot) => overlaps(hotspot, thoughtBox))
      || choiceObstacles.some((obstacle) => overlaps(thoughtBox, obstacle))
    ),
  );

  // Never eject the choice list. Once a caption or thought drops below, it
  // stays there until the scene changes, so the two do not swap every frame.
  delete frame.dataset.choices;
  if (spot === "below") {
    frame.dataset.caption = "below";
    if (thought) frame.dataset.thought = "below";
  } else {
    delete frame.dataset.caption;
    if (thoughtCovered) frame.dataset.thought = "below";
  }

  if (keepHomeOverlays) {
    delete frame.dataset.caption;
    delete frame.dataset.choices;
    delete frame.dataset.thought;
  }

  pinChoicesToArt(frame, art, choiceList);
  // Caption placement must not change the image size between scenes.
  clearPictureSize(art);
}

/** Keeps the choice list on the picture, even when the frame grows below it. */
function pinChoicesToArt(
  frame: HTMLElement,
  art: HTMLElement,
  choiceList: HTMLElement | null,
) {
  if (!choiceList) return;
  const frameRect = frame.getBoundingClientRect();
  const artNow = art.getBoundingClientRect();
  if (artNow.width < 2 || artNow.height < 2) return;
  // The picture can run past the window. Keep the buttons on the part of it
  // that is actually on screen.
  const visibleTop = Math.max(artNow.top, 0);
  const visibleBottom = Math.min(artNow.bottom, window.innerHeight);
  let lift = 0;
  const thoughtBar = frame.querySelector<HTMLElement>(":scope > .opening-thought");
  if (thoughtBar && getComputedStyle(thoughtBar).position === "absolute") {
    const thoughtRect = thoughtBar.getBoundingClientRect();
    if (
      thoughtRect.height > 2
      && thoughtRect.top < visibleBottom - 1
      && thoughtRect.bottom > visibleTop
    ) {
      lift = Math.max(0, visibleBottom - thoughtRect.top);
    }
  }
  choiceList.style.position = "absolute";
  choiceList.style.left = `${Math.round(artNow.left - frameRect.left)}px`;
  choiceList.style.width = `${Math.round(artNow.width)}px`;
  choiceList.style.right = "auto";
  choiceList.style.top = "auto";
  choiceList.style.margin = "0";
  choiceList.style.bottom = `${Math.round(frameRect.bottom - visibleBottom + lift)}px`;
  choiceList.style.maxHeight = `${Math.round(Math.max(48, visibleBottom - visibleTop - lift))}px`;
}
