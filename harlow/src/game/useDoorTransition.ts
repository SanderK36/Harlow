import { useEffect, useRef, useState } from "react";

import { harlowAudio } from "./audio";
import type { Choice } from "./choices";

/**
 * Going through a door: a quick dip to black while the door opens and shuts
 * (the scene swaps while the screen is black). In milliseconds; under 1s.
 */
const DOOR_FADE_IN = 250;
const DOOR_HOLD = 350;
const DOOR_FADE_OUT = 300;
/** With reduced motion there is no fade; doors are just ignored this long. */
const DOOR_REDUCED_MOTION_LOCK = 400;

export type DoorTransitionPhase = "idle" | "closing" | "black" | "opening";

export function useDoorTransition(applyChoice: (choice: Choice) => void) {
  const [doorTransition, setDoorTransition] = useState<DoorTransitionPhase>("idle");
  const doorBusy = useRef(false);
  const doorTimers = useRef<number[]>([]);
  const latestApply = useRef(applyChoice);

  useEffect(() => {
    latestApply.current = applyChoice;
  });

  useEffect(() => () => {
    doorTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  /** Dip to black, play the door, and take the choice while it's dark. */
  function walkThroughDoor(choice: Choice) {
    doorBusy.current = true;
    doorTimers.current.forEach((timer) => window.clearTimeout(timer));
    const later = (callback: () => void, delay: number) => {
      doorTimers.current.push(window.setTimeout(callback, delay));
    };
    const done = () => {
      doorTimers.current = [];
      doorBusy.current = false;
      setDoorTransition("idle");
    };
    harlowAudio().door();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      latestApply.current(choice);
      later(done, DOOR_REDUCED_MOTION_LOCK);
      return;
    }

    setDoorTransition("closing");
    later(() => {
      latestApply.current(choice);
      setDoorTransition("black");
    }, DOOR_FADE_IN);
    later(() => {
      // The scene is back. Clicks land while the black fades out.
      doorBusy.current = false;
      setDoorTransition("opening");
    }, DOOR_FADE_IN + DOOR_HOLD);
    later(done, DOOR_FADE_IN + DOOR_HOLD + DOOR_FADE_OUT);
  }

  return { doorTransition, doorBusy, walkThroughDoor };
}
