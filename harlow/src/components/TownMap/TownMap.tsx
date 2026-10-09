"use client";

import { useEffect, useId, useRef, useState } from "react";

import ThoughtPanel from "@/components/ThoughtPanel/ThoughtPanel";
import type { Choice } from "@/game/choices";
import {
  mapPinViews,
  mapPinsByWalkTime,
  mapTripChoice,
  markerPosition,
  type MapPinView,
} from "@/game/map";
import HarlowMapArt from "./HarlowMapArt";
import styles from "./TownMap.module.css";

type TownMapProps = {
  originId: string;
  time: number;
  momTalked: boolean;
  lightOnTheHillActive: boolean;
  availableIds: readonly string[];
  money: number;
  night: boolean;
  onTravel: (choice: Choice) => void;
  onClose: () => void;
};

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: none), (pointer: coarse)").matches;
  });

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return coarse;
}

function LockMark() {
  return (
    <svg className={styles.lock} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="3.2" y="7" width="9.6" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.4 7V5.1a2.6 2.6 0 0 1 5.2 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function nameClass(side: MapPinView["labelSide"]) {
  if (side === "top") return styles.nameTop;
  if (side === "bottom") return styles.nameBottom;
  if (side === "left") return styles.nameLeft;
  return styles.nameRight;
}

function PinGlyph({ here, closed }: { here: boolean; closed: boolean }) {
  return (
    <span className={`${styles.glyph} ${here ? styles.glyphHere : ""} ${closed ? styles.glyphClosed : ""}`}>
      <svg className={styles.pinSvg} viewBox="0 0 32 42" aria-hidden="true" focusable="false">
        <path
          d="M16 41C16 41 3 25.2 3 15.2a13 13 0 0 1 26 0C29 25.2 16 41 16 41z"
          fill="currentColor"
        />
        <circle cx="16" cy="15" r="5" className={styles.pinHole} />
      </svg>
      {closed && <LockMark />}
    </span>
  );
}

export default function TownMap({
  originId,
  time,
  momTalked,
  lightOnTheHillActive,
  availableIds,
  money,
  night,
  onTravel,
  onClose,
}: TownMapProps) {
  const coarse = useCoarsePointer();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [thought, setThought] = useState<string | null>(null);

  const pins = mapPinViews({
    originId,
    time,
    momTalked,
    lightOnTheHillActive,
    availableIds,
  });
  const byWalk = mapPinsByWalkTime(pins);
  const standingOnPin = pins.some((pin) => pin.here);
  const marker = markerPosition(originId);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function trip(pin: MapPinView, mode: "walk" | "bus") {
    if (!pin.open) return;
    const choice = mapTripChoice(originId, pin.id, mode, availableIds);
    if (!choice) return;
    if (mode === "bus" && money < (choice.requirements?.money ?? 0)) return;
    onTravel(choice);
  }

  function pointerIsTouch(event: React.MouseEvent) {
    const native = event.nativeEvent as PointerEvent;
    return native.pointerType === "touch" || coarse;
  }

  function activate(pin: MapPinView, event: React.MouseEvent<HTMLButtonElement>) {
    if (pin.here) return;
    const keyboard = event.detail === 0;
    if (!pin.open) {
      setSelectedId(pin.id);
      setThought(pin.thought);
      return;
    }
    if (keyboard || !pointerIsTouch(event)) {
      trip(pin, "walk");
      return;
    }
    setThought(null);
    setSelectedId(pin.id);
  }

  function revealed(pin: MapPinView) {
    if (pin.here) return false;
    if (coarse) return selectedId === pin.id;
    return hoveredId === pin.id || focusedId === pin.id || selectedId === pin.id;
  }

  function canAffordBus(pin: MapPinView) {
    const choice = mapTripChoice(originId, pin.id, "bus", availableIds);
    return money >= (choice?.requirements?.money ?? 7);
  }

  function onDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")].filter(
      (element) => element.getClientRects().length > 0,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={`${styles.overlay} ${night ? styles.night : ""}`}>
      <div
        ref={dialogRef}
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <div className={styles.paper}>
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>Town of</p>
              <h2 id={titleId} className={styles.title}>Harlow</h2>
              <p className={styles.year}>1982</p>
            </div>
            <button type="button" className={styles.close} onClick={onClose}>
              Close
            </button>
          </header>

          <div className={styles.canvas}>
            <HarlowMapArt />
            <div className={styles.compass} aria-hidden="true">N</div>
            {pins.map((pin) => {
              const openCard = revealed(pin) && pin.open;
              const showCard = revealed(pin);
              return (
                <div
                  key={pin.id}
                  className={styles.slot}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  onMouseEnter={() => setHoveredId(pin.id)}
                  onMouseLeave={() => setHoveredId((current) => (current === pin.id ? null : current))}
                  onFocus={() => setFocusedId(pin.id)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setFocusedId((current) => (current === pin.id ? null : current));
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`${styles.pin} ${pin.here ? styles.pinHere : pin.open ? styles.pinOpen : styles.pinClosed}`}
                    data-pin={pin.id}
                    data-open={pin.open ? "true" : "false"}
                    aria-current={pin.here ? "location" : undefined}
                    aria-label={
                      pin.here
                        ? `${pin.label}, you are here`
                        : pin.open
                          ? `${pin.label}, ${pin.walkMinutes} minutes on foot`
                          : `${pin.label}, closed`
                    }
                    onClick={(event) => activate(pin, event)}
                  >
                    <PinGlyph here={pin.here} closed={!pin.open && !pin.here} />
                    <span className={`${styles.name} ${nameClass(pin.labelSide)}`}>{pin.label}</span>
                    {pin.here && <span className={styles.hereLabel}>You are here</span>}
                    {!pin.open && !pin.here && <span className={styles.srOnly}>Closed</span>}
                  </button>
                  {showCard && (
                    <div
                      className={`${styles.tip} ${pin.y < 22 ? styles.tipBelow : ""}`}
                      role="tooltip"
                    >
                      <p>{pin.label} · {pin.walkMinutes} min</p>
                      {openCard && (
                        <div className={styles.tipActions}>
                          {coarse && (
                            <button type="button" onClick={() => trip(pin, "walk")}>
                              Walk
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canAffordBus(pin)}
                            onClick={() => trip(pin, "bus")}
                          >
                            Bus · $7 · 10 min
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!standingOnPin && (
              <div
                className={styles.marker}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                role="img"
                aria-label="You are here"
              >
                <PinGlyph here closed={false} />
                <span className={styles.hereLabel}>You are here</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.listWrap}>
        <p className={styles.listLabel}>By walking time</p>
        <ol className={styles.list} aria-label="Places by walking time">
          {byWalk.map((pin) => {
            const openCard = revealed(pin) && pin.open;
            return (
              <li key={pin.id} className={pin.here ? styles.rowHere : pin.open ? styles.rowOpen : styles.rowClosed}>
                <button
                  type="button"
                  className={styles.rowButton}
                  aria-current={pin.here ? "location" : undefined}
                  onClick={(event) => activate(pin, event)}
                >
                  {!pin.open && !pin.here && <LockMark />}
                  <span className={styles.rowName}>{pin.label}</span>
                  <span className={styles.rowTime}>
                    {pin.here ? "You are here" : `${pin.walkMinutes} min`}
                  </span>
                </button>
                {openCard && (
                  <div className={styles.rowActions}>
                    <button type="button" onClick={() => trip(pin, "walk")}>
                      Walk · {pin.walkMinutes} min
                    </button>
                    <button
                      type="button"
                      disabled={!canAffordBus(pin)}
                      onClick={() => trip(pin, "bus")}
                    >
                      Bus · $7 · 10 min
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        </div>
      </div>
      {thought && (
        <div className={styles.thought}>
          <ThoughtPanel speaker="Ethan" caption="Inner thought" text={thought} />
        </div>
      )}
    </div>
  );
}
