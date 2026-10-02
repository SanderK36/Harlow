"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { harlowAudio } from "@/game/audio";
import type { Weather } from "@/game/types";
import styles from "./StormLightning.module.css";

type StormLightningProps = {
  weather: Weather;
  indoor: boolean;
  active: boolean;
};

// Seconds between strikes [min, max] and how bright they are. Only a
// Thunderstorm has lightning; Rainy and Heavy rain are rain only.
const STORMS: Partial<Record<Weather, { gap: [number, number]; strength: number }>> = {
  Thunderstorm: { gap: [14, 32], strength: 1 },
};

/**
 * Lightning over the scene art in a thunderstorm: the picture whites out for a
 * moment, then thunder rolls in after a delay that suggests the distance.
 * Inside the house the flash is softer, as if through a window.
 */
export default function StormLightning({ weather, indoor, active }: StormLightningProps) {
  const [strike, setStrike] = useState<{ id: number; strength: number } | null>(null);
  const storm = STORMS[weather];

  useEffect(() => {
    if (!active || !storm) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    let nextId = 0;

    const schedule = () => {
      const [min, max] = storm.gap;
      const wait = (min + Math.random() * (max - min)) * 1000;
      timers.push(
        window.setTimeout(() => {
          if (!document.hidden) {
            const distance = Math.random() * 0.9;
            const strength = storm.strength * (indoor ? 0.55 : 1) * (1 - distance * 0.4);
            if (!reduceMotion) {
              nextId += 1;
              setStrike({ id: nextId, strength });
              timers.push(window.setTimeout(() => setStrike(null), 1100));
            }
            // Sound travels slower than light: further strikes rumble later.
            timers.push(
              window.setTimeout(
                () => harlowAudio().thunder(Math.min(1, distance + (indoor ? 0.15 : 0))),
                350 + distance * 2600,
              ),
            );
          }
          schedule();
        }, wait),
      );
    };

    // The first strike comes a little sooner so a storm makes itself known.
    timers.push(window.setTimeout(schedule, 2000));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setStrike(null);
    };
  }, [active, storm, indoor]);

  if (!strike) return null;
  return (
    <div
      key={strike.id}
      className={styles.flash}
      style={{ "--strike": strike.strength } as CSSProperties}
      aria-hidden="true"
    />
  );
}
