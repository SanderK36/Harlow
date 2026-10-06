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

const LEAD_RESERVE = 96;
const TAB = 18;

/**
 * Puts the SCENE box in the first clear corner at full width. Choice buttons
 * and the bottom thought move below the art when they cover a hotspot.
 * Hotspot rectangles stay where the art put them.
 */
export function placeSceneChrome(frame: HTMLElement) {
  const art = frame.querySelector<HTMLElement>(".scene-art");
  const stack = frame.querySelector<HTMLElement>(".scene-info-stack");
  const panel = frame.querySelector<HTMLElement>(".scene-info-panel");
  if (!art || !stack || !panel) return;

  const sceneId = frame.dataset.sceneId ?? "";
  if (frame.dataset.captionScene !== sceneId) {
    delete frame.dataset.choices;
    delete frame.dataset.thought;
    delete frame.dataset.caption;
    frame.dataset.captionScene = sceneId;
  }

  if (window.innerWidth <= 640) {
    stack.style.cssText = "";
    panel.style.cssText = "";
    return;
  }

  const artRect = art.getBoundingClientRect();
  if (artRect.width < 2 || artRect.height < 2) return;

  const hotspots = [...frame.querySelectorAll<HTMLElement>(".scene-hotspot")]
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 2 && rect.height > 2)
    .map(toBox);

  const choiceList = frame.querySelector<HTMLElement>(":scope > .overlayActionList");
  const buttons = choiceList?.querySelector<HTMLElement>(".overlayActionButtons") ?? null;
  const thought = frame.querySelector<HTMLElement>(":scope > .opening-thought");
  const obstacles = [...hotspots];

  if (choiceList && getComputedStyle(choiceList).position === "absolute" && buttons) {
    const box = toBox(buttons.getBoundingClientRect());
    if (box.right - box.left > 2 && box.bottom - box.top > 2) obstacles.push(box);
  }
  if (thought && getComputedStyle(thought).position === "absolute") {
    const box = toBox(thought.getBoundingClientRect());
    if (box.bottom - box.top > 2) obstacles.push(box);
  }

  const width = Math.min(CAPTION_DESKTOP_MAX, Math.max(CAPTION_DESKTOP_MIN, artRect.width - CAPTION_EDGE * 2));
  stack.style.position = "absolute";
  stack.style.width = `${width}px`;
  stack.style.margin = "0";
  stack.style.right = "auto";
  stack.style.bottom = "auto";
  stack.style.flexDirection = "column";
  stack.style.alignItems = "stretch";
  panel.style.width = "100%";
  panel.style.minWidth = "0";
  panel.style.maxWidth = "none";
  panel.style.margin = "0";
  panel.style.overflow = "visible";

  const measured = panel.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const size = { width, height: measured.height + LEAD_RESERVE + TAB };
  const spot = placeCaption(toBox(artRect), size, obstacles);

  if (spot === "below") {
    frame.dataset.caption = "below";
    stack.style.cssText = "";
    panel.style.cssText = "";
  } else {
    delete frame.dataset.caption;
    const placed = cornerBox(toBox(artRect), size, spot);
    stack.style.top = `${Math.round(placed.top + TAB - frameRect.top)}px`;
    stack.style.left = `${Math.round(placed.left - frameRect.left)}px`;
  }

  const choiceIsOverlay = Boolean(choiceList && getComputedStyle(choiceList).position === "absolute");
  const thoughtIsOverlay = Boolean(thought && getComputedStyle(thought).position === "absolute");
  const buttonBox = buttons ? toBox(buttons.getBoundingClientRect()) : null;
  const heading = choiceList?.querySelector("h2");
  const headingBox = heading ? toBox(heading.getBoundingClientRect()) : null;
  const thoughtBox = thoughtIsOverlay && thought ? toBox(thought.getBoundingClientRect()) : null;
  const thoughtHitsChoices = Boolean(
    thoughtBox
    && (
      (buttonBox && overlaps(thoughtBox, buttonBox))
      || (headingBox && overlaps(thoughtBox, headingBox))
    ),
  );

  if (choiceIsOverlay && buttonBox && hotspots.some((hotspot) => overlaps(hotspot, buttonBox))) {
    frame.dataset.choices = "below";
  }
  if (thoughtBox && hotspots.some((hotspot) => overlaps(hotspot, thoughtBox))) {
    frame.dataset.thought = "below";
  }
  // Once the choices leave the picture, an absolute thought still pins to
  // the bottom of the frame and lands on the button row. Move it under the art.
  if (thoughtHitsChoices) {
    frame.dataset.choices = "below";
    frame.dataset.thought = "below";
  }
}
