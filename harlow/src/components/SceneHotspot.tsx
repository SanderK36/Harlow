"use client";

import { useLayoutEffect, useRef, type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

// Pending "spotlight off" timers per scene, so gliding from one hotspot to
// the next moves the cut-out instead of snapping it in from nowhere.
const spotlightReleases = new WeakMap<HTMLElement, number>();

/** Move the scene's dimming cut-out (see .scene-spotlight) onto a hotspot. */
function placeSpotlight(button: HTMLButtonElement) {
  const art = button.parentElement;
  if (!art) return;

  const pendingRelease = spotlightReleases.get(art);
  if (pendingRelease !== undefined) window.clearTimeout(pendingRelease);
  spotlightReleases.delete(art);

  // Coming from nothing: jump straight to the hotspot, no glide.
  const jump = !("spotlightOn" in art.dataset);
  if (jump) art.dataset.spotlightJump = "";
  art.style.setProperty("--spot-left", `${button.offsetLeft}px`);
  art.style.setProperty("--spot-top", `${button.offsetTop}px`);
  art.style.setProperty("--spot-width", `${button.offsetWidth}px`);
  art.style.setProperty("--spot-height", `${button.offsetHeight}px`);
  art.dataset.spotlightOn = "";
  if (jump) {
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => delete art.dataset.spotlightJump)
    );
  }
}

function releaseSpotlight(button: HTMLButtonElement) {
  const art = button.parentElement;
  if (!art) return;
  spotlightReleases.set(
    art,
    window.setTimeout(() => {
      delete art.dataset.spotlightOn;
      spotlightReleases.delete(art);
    }, 200)
  );
}

export default function SceneHotspot({
  label,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const caption = labelRef.current;
    const frame = button?.parentElement;
    if (!button || !caption || !frame) return;

    const fit = () => {
      caption.style.fontSize = "";
      caption.style.setProperty("--caption-offset", "0px");
      caption.style.setProperty("--caption-lift", "0px");
      const bounds = button.getBoundingClientRect();
      const frameBounds = frame.getBoundingClientRect();
      const naturalWidth = caption.getBoundingClientRect().width;
      const fontSize = Number.parseFloat(getComputedStyle(caption).fontSize);
      // The plate may overhang a narrow hotspot a little before it shrinks.
      const available = bounds.width + 48;
      if (naturalWidth > available) {
        caption.style.fontSize = `${Math.max(11, Math.min(fontSize, fontSize * available / naturalWidth))}px`;
      }
      const captionBounds = caption.getBoundingClientRect();
      const width = captionBounds.width;
      const center = bounds.left + bounds.width / 2;
      const left = Math.max(frameBounds.left + 8, Math.min(center - width / 2, frameBounds.right - width - 8));
      caption.style.setProperty("--caption-offset", `${left + width / 2 - center}px`);
      // Keep a plate on the hotspot's bottom edge inside the picture.
      const overflow = captionBounds.bottom - (frameBounds.bottom - 8);
      if (overflow > 0) caption.style.setProperty("--caption-lift", `${-overflow}px`);
    };

    const observer = new ResizeObserver(fit);
    observer.observe(button);
    observer.observe(frame);
    fit();
    void document.fonts.ready.then(() => {
      if (button.isConnected) fit();
    });
    return () => observer.disconnect();
  }, [label]);

  return (
    <button
      {...props}
      ref={buttonRef}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          placeSpotlight(event.currentTarget);
        }
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        releaseSpotlight(event.currentTarget);
        onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        placeSpotlight(event.currentTarget);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        releaseSpotlight(event.currentTarget);
        onBlur?.(event);
      }}
    >
      <span ref={labelRef}>{label}</span>
    </button>
  );
}
