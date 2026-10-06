"use client";

import { useLayoutEffect, useRef, type ButtonHTMLAttributes } from "react";

import { harlowAudio } from "@/game/audio";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  /** Notebook mark inside the name label. Hidden until the label is shown. */
  leadsQuest?: boolean;
};

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
  leadsQuest = false,
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
      // Measuring mid-transition reports a half-moved label, so the lift
      // settles a few pixels into the choice heading.
      caption.style.transition = "none";
      caption.style.fontSize = "";
      caption.style.setProperty("--caption-offset", "0px");
      caption.style.setProperty("--caption-lift", "0px");
      void caption.offsetHeight;
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
      // Keep the plate inside the picture, and above the choice panel.
      // The panel is a sibling of the art, so a label at the hotspot's
      // bottom edge paints underneath "WHAT DO YOU WANT TO DO?".
      const panel = frame.parentElement?.querySelector(".overlayActionList");
      const obstacles = panel
        ? [panel.querySelector("h2"), panel.querySelector(".overlayActionButtons")].filter(
            (element): element is Element => element !== null,
          )
        : [];
      const blockTop = obstacles.reduce((top, element) => {
        return Math.min(top, element.getBoundingClientRect().top);
      }, Number.POSITIVE_INFINITY);
      const frameLimit = captionBounds.bottom - (frameBounds.bottom - 8);
      const panelLimit = blockTop === Number.POSITIVE_INFINITY
        ? 0
        : captionBounds.bottom - (blockTop - 20);
      const lift = Math.max(0, frameLimit, panelLimit);
      const maxLift = Math.max(0, captionBounds.top - frameBounds.top - 8);
      if (lift > 0) {
        caption.style.setProperty("--caption-lift", `${-Math.min(lift, maxLift)}px`);
      }
      void caption.offsetHeight;
      caption.style.transition = "";
    };

    const observer = new ResizeObserver(fit);
    observer.observe(button);
    observer.observe(frame);
    const choicePanel = frame.parentElement?.querySelector(".overlayActionList");
    if (choicePanel) observer.observe(choicePanel);
    const thought = frame.parentElement?.querySelector(".opening-thought, .late-night-thought");
    if (thought) observer.observe(thought);
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
          harlowAudio().hover();
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
      <span ref={labelRef}>
        {label}
        {leadsQuest && (
          <svg
            className="scene-hotspot-lead"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="1.15" y="1.35" width="7.15" height="10.5" rx="0.7" stroke="currentColor" strokeWidth="1.1" fill="none" />
            <path d="M2.85 4.15h3.7M2.85 6.35h3.7M2.85 8.55h2.4" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" />
            <path d="M8.35 8.75 11.7 5.4l.9.9-3.35 3.35-1.05.25z" fill="currentColor" />
          </svg>
        )}
      </span>
    </button>
  );
}
