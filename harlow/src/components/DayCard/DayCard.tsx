"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/components/DialogueScene/typewriter";

const HOLD_MS = 2000;
const FADE_MS = 700;

/** Full-screen morning line. Types on, holds, then fades. A hard cut when motion is reduced. */
export default function DayCard({
  line,
  count,
  onDone,
}: {
  line: string;
  count: string;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? line.length : 0);

  useEffect(() => {
    if (reduced) {
      const done = window.setTimeout(onDone, HOLD_MS);
      return () => window.clearTimeout(done);
    }
    let count = 0;
    const step = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= line.length) window.clearInterval(step);
    }, 42);
    const done = window.setTimeout(onDone, HOLD_MS + FADE_MS);
    return () => {
      window.clearInterval(step);
      window.clearTimeout(done);
    };
  }, [line, onDone, reduced]);

  return (
    <div
      className={`new-day-screen${reduced ? " new-day-screen-cut" : ""}`}
      role="status"
      aria-live="polite"
      aria-labelledby="new-day-title"
    >
      <div>
        <h2 id="new-day-title">{line.slice(0, shown)}</h2>
        <p className="new-day-count">{count}</p>
      </div>
    </div>
  );
}
