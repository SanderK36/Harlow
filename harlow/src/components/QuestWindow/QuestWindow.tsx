"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import ActionButton from "@/components/ActionButton/ActionButton";
import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import {
  jobDetails,
  questObjective,
  questTitle,
  type JobId,
  type QuestProgress,
  type StoryFlag,
} from "@/game/quests";
import {
  handwritingCount,
  notebookLine,
  notebookPortrait,
  NOTEBOOK_NAME,
  type TrustMap,
  type TrustPerson,
} from "@/game/trust";
import type { DayOfWeek, Month } from "@/game/types";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  quests: QuestProgress[];
  job: JobId | null;
  dayOfWeek: DayOfWeek;
  dayNumber: number;
  currentMonth: Month;
  inventory: string[];
  storyFlags: Partial<Record<StoryFlag, boolean>>;
  trust: TrustMap;
  metPeople: TrustPerson[];
  unseenPeople: TrustPerson[];
  onPeopleViewed: () => void;
  onClose: () => void;
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: "Mon.",
  Tuesday: "Tue.",
  Wednesday: "Wed.",
  Thursday: "Thu.",
  Friday: "Fri.",
  Saturday: "Sat.",
  Sunday: "Sun.",
};

const MONTH_SHORT: Record<Month, string> = {
  January: "Jan.",
  February: "Feb.",
  March: "Mar.",
  April: "Apr.",
  May: "May",
  June: "June",
  July: "July",
  August: "Aug.",
  September: "Sept.",
  October: "Oct.",
  November: "Nov.",
  December: "Dec.",
};

function HandLine({ text, animate }: { text: string; animate: boolean }) {
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

  return <p className={styles.hand}>{reveal ? text.slice(0, count) : text}</p>;
}

/** Notebook date line, e.g. "Sat., Oct. 2, 1982". */
export function formatQuestLogDate(
  dayOfWeek: DayOfWeek,
  currentMonth: Month,
  dayNumber: number,
) {
  return `${DAY_SHORT[dayOfWeek]} ${MONTH_SHORT[currentMonth]} ${dayNumber}, 1982`;
}

/**
 * Ethan's notebook quest log. Only quests already started or completed
 * appear — nothing unstarted, so later locations stay unspoiled.
 */
export default function QuestWindow({
  quests,
  job,
  dayOfWeek,
  dayNumber,
  currentMonth,
  inventory,
  storyFlags,
  trust,
  metPeople,
  unseenPeople,
  onPeopleViewed,
  onClose,
}: QuestWindowProps) {
  const [tab, setTab] = useState<"quests" | "people">("quests");
  const [writing, setWriting] = useState<TrustPerson[]>([]);
  const objectiveCtx = { inventory, storyFlags };

  function openPeople() {
    if (tab !== "people") {
      setWriting(unseenPeople);
      onPeopleViewed();
    }
    setTab("people");
  }
  const active = quests.filter((quest) => quest.status === "active");
  const completed = quests.filter((quest) => quest.status === "completed");
  const details = job ? jobDetails[job] : null;
  const dateLine = formatQuestLogDate(dayOfWeek, currentMonth, dayNumber);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-log-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.caseLabel}>E. Parker</p>
          <h2 id="quest-log-title" className={styles.title}>
            Notebook
          </h2>
          <p className={styles.date}>{dateLine}</p>
          <div className={styles.tabs} role="tablist" aria-label="Notebook">
            <button
              type="button"
              role="tab"
              id="notebook-tab-quests"
              className={styles.pageTab}
              aria-selected={tab === "quests"}
              aria-controls="notebook-panel-quests"
              onClick={() => setTab("quests")}
            >
              Quests
            </button>
            <button
              type="button"
              role="tab"
              id="notebook-tab-people"
              className={styles.pageTab}
              aria-selected={tab === "people"}
              aria-controls="notebook-panel-people"
              onClick={openPeople}
            >
              People
            </button>
          </div>
        </header>

        <div
          className={styles.pages}
          id={tab === "quests" ? "notebook-panel-quests" : "notebook-panel-people"}
          role="tabpanel"
          aria-labelledby={tab === "quests" ? "notebook-tab-quests" : "notebook-tab-people"}
        >
          {tab === "people" ? (
            metPeople.length === 0 ? (
              <p className={styles.empty}>Nothing written down yet.</p>
            ) : (
              <ul className={styles.people}>
                {metPeople.map((person, index) => {
                  const line = notebookLine(person, trust[person]);
                  const name = NOTEBOOK_NAME[person];
                  return (
                    <li
                      key={person}
                      className={`${styles.person} ${index % 2 === 0 ? styles.tiltA : styles.tiltB}`}
                    >
                      <article className={styles.card} aria-label={`${name}. ${line}`}>
                        <div className={styles.polaroidWrap}>
                          <Image
                            className={styles.polaroid}
                            src={notebookPortrait(person)}
                            alt=""
                            width={72}
                            height={72}
                          />
                        </div>
                        <div className={styles.personCopy} aria-hidden="true">
                          <h3 className={styles.personName}>{name}</h3>
                          <HandLine key={line} text={line} animate={writing.includes(person)} />
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
          <>
          {active.length === 0 && completed.length === 0 && (
            <p className={styles.empty}>Nothing written down yet.</p>
          )}

          {active.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                <span className={styles.pin} aria-hidden="true" />
                Open leads
              </p>
              <ul className={styles.list}>
                {active.map((quest) => (
                  <li key={quest.id} className={styles.entry}>
                    <div className={styles.tab} aria-hidden="true" />
                    <h3 className={styles.entryTitle}>
                      {questTitle(quest, objectiveCtx)}
                    </h3>
                    <p className={styles.note}>{questObjective(quest, objectiveCtx)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Done</p>
              <ul className={styles.list}>
                {completed.map((quest) => (
                  <li key={quest.id} className={styles.entryDone}>
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                    <h3 className={styles.entryTitleDone}>
                      {questTitle(quest, objectiveCtx)}
                    </h3>
                    <p className={styles.noteDone}>{questObjective(quest, objectiveCtx)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details && (
            <p className={styles.jobNote}>
              Job: <strong>{details.name}</strong> — {details.benefit}
            </p>
          )}
          </>
          )}
        </div>

        <div className={styles.closeButton}>
          <ActionButton label="Close" onClick={onClose} />
        </div>
      </section>
    </div>
  );
}
