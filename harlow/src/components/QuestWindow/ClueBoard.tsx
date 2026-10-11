"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";

import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import { handwritingCount } from "@/game/trust";

import {
  CLUE_CONNECTIONS,
  CLUE_DEFS,
  type ClueConnectionId,
  type ClueId,
} from "@/game/clues";

import styles from "./QuestWindow.module.css";

type ConnectOutcome = { ok: boolean; line: string };

type ClueBoardProps = {
  clues: ClueId[];
  connections: ClueConnectionId[];
  writing: ClueId[];
  onConnect: (a: ClueId, b: ClueId) => ConnectOutcome;
};

type Point = { x: number; y: number };

function threadPath(from: Point, to: Point) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const sag = Math.min(26, len * 0.16);
  return `M ${from.x} ${from.y} Q ${mx - (dy / len) * sag} ${my + (dx / len) * sag} ${to.x} ${to.y}`;
}

function CluePhoto({ src }: { src?: string }) {
  const [missing, setMissing] = useState(!src);
  if (!src || missing) return <span className={styles.photoMissing} aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.cluePhoto} onError={() => setMissing(true)} />
  );
}

/**
 * Corkboard of the clues Ethan has pinned. Drag from one to another, or
 * select one and then the next. A real pair keeps a red thread.
 */
export default function ClueBoard({ clues, connections, writing, onConnect }: ClueBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Partial<Record<ClueId, HTMLButtonElement | null>>>({});
  const [centers, setCenters] = useState<Partial<Record<ClueId, Point>>>({});
  const [selected, setSelected] = useState<ClueId | null>(null);
  const [dragLine, setDragLine] = useState<{ from: ClueId; x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ from: Point; to: Point; pull: boolean } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const dragMoved = useRef(false);
  const dragFrom = useRef<ClueId | null>(null);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const bounds = board.getBoundingClientRect();
      const next: Partial<Record<ClueId, Point>> = {};
      for (const id of clues) {
        const card = cardRefs.current[id];
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        next[id] = {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
        };
      }
      setCenters(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [clues, connections]);

  function pointInBoard(event: { clientX: number; clientY: number }): Point {
    const bounds = boardRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function clueAt(event: { clientX: number; clientY: number }): ClueId | null {
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const card = hit instanceof Element ? hit.closest<HTMLElement>("[data-clue]") : null;
    const id = card?.dataset.clue;
    return id && clues.includes(id as ClueId) ? id as ClueId : null;
  }

  function pullBack(from: Point, to: Point) {
    setGhost({ from, to, pull: false });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setGhost((current) => current ? { ...current, pull: true } : current);
      });
    });
    window.setTimeout(() => setGhost(null), 320);
  }

  function finishLink(a: ClueId, b: ClueId) {
    const outcome = onConnect(a, b);
    setResult(outcome.line);
    setSelected(null);
    if (!outcome.ok) {
      const from = centers[a];
      const to = centers[b];
      if (from && to) pullBack(from, to);
    }
  }

  function onPointerDown(id: ClueId, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    dragMoved.current = false;
    dragFrom.current = id;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointInBoard(event);
    setDragLine({ from: id, x: point.x, y: point.y });
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const from = dragFrom.current;
    if (!from) return;
    const point = pointInBoard(event);
    const origin = centers[from];
    if (origin && Math.hypot(point.x - origin.x, point.y - origin.y) > 8) dragMoved.current = true;
    setDragLine({ from, x: point.x, y: point.y });
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!from) return;
    const moved = dragMoved.current;
    setDragLine(null);
    if (!moved) return;
    suppressClick.current = true;
    const target = clueAt(event);
    if (!target || target === from) return;
    finishLink(from, target);
  }

  function onClick(id: ClueId) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!selected) {
      setSelected(id);
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }
    finishLink(selected, id);
  }

  const threads = connections.flatMap((id) => {
    const link = CLUE_CONNECTIONS.find((item) => item.id === id);
    if (!link) return [];
    const from = centers[link.a];
    const to = centers[link.b];
    if (!from || !to) return [];
    return [{ id, d: threadPath(from, to) }];
  });

  const dragOrigin = dragLine ? centers[dragLine.from] : null;

  return (
    <div
      ref={boardRef}
      className={styles.board}
    >
      <p className={styles.srOnly}>
        Select a clue, then another, to connect them. On a wide screen, drag from one clue to the next.
      </p>
      <svg className={styles.threads} aria-hidden="true">
        {threads.map((thread) => (
          <path key={thread.id} d={thread.d} />
        ))}
        {dragLine && dragOrigin && (
          <path d={threadPath(dragOrigin, { x: dragLine.x, y: dragLine.y })} />
        )}
      </svg>
      {ghost && (
        <span
          className={styles.ghostThread}
          aria-hidden="true"
          style={{
            left: ghost.from.x,
            top: ghost.from.y,
            width: Math.hypot(ghost.to.x - ghost.from.x, ghost.to.y - ghost.from.y),
            transform: `rotate(${Math.atan2(ghost.to.y - ghost.from.y, ghost.to.x - ghost.from.x)}rad) scaleX(${ghost.pull ? 0 : 1})`,
            transition: ghost.pull ? "transform 260ms ease-in" : "none",
          }}
        />
      )}
      {clues.length === 0 ? (
        <p className={styles.empty}>Nothing written down yet.</p>
      ) : (
        <ul className={styles.clueGrid}>
          {clues.map((id) => {
            const clue = CLUE_DEFS[id];
            const pinned = !clue.image;
            return (
              <li key={id}>
                <button
                  type="button"
                  ref={(node) => {
                    cardRefs.current[id] = node;
                  }}
                  data-clue={id}
                  className={`${pinned ? styles.pinned : styles.polaroidCard} ${selected === id ? styles.clueSelected : ""}`}
                  aria-pressed={selected === id}
                  aria-label={`${clue.name}. ${clue.note}`}
                  onPointerDown={(event) => onPointerDown(id, event)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onClick={() => onClick(id)}
                >
                  {pinned ? (
                    <span className={styles.pin} aria-hidden="true" />
                  ) : (
                    <span className={styles.polaroidFrame}>
                      <CluePhoto src={clue.image} />
                    </span>
                  )}
                  <span className={styles.clueCopy}>
                    <span className={styles.clueName}>{clue.name}</span>
                    <NoteLine text={clue.note} animate={writing.includes(id)} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {result && (
        <p className={styles.boardThought} role="status">{result}</p>
      )}
    </div>
  );
}

function NoteLine({ text, animate }: { text: string; animate: boolean }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const reveal = animate && !reduced;

  useEffect(() => {
    if (!reveal) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = handwritingCount(text.length, now - started, false);
      setCount(next);
      if (next < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reveal, text]);

  return <span className={styles.clueNote}>{reveal ? text.slice(0, count) : text}</span>;
}
