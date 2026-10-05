import ActionButton from "@/components/ActionButton/ActionButton";
import {
  QUEST_DEFS,
  jobDetails,
  questObjective,
  type JobId,
  type QuestProgress,
} from "@/game/quests";
import type { DayOfWeek, Month } from "@/game/types";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  quests: QuestProgress[];
  job: JobId | null;
  dayOfWeek: DayOfWeek;
  dayNumber: number;
  currentMonth: Month;
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
  onClose,
}: QuestWindowProps) {
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
        </header>

        <div className={styles.pages}>
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
                      {QUEST_DEFS[quest.id]?.title ?? quest.id}
                    </h3>
                    <p className={styles.note}>{questObjective(quest)}</p>
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
                      {QUEST_DEFS[quest.id]?.title ?? quest.id}
                    </h3>
                    <p className={styles.noteDone}>{questObjective(quest)}</p>
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
        </div>

        <div className={styles.closeButton}>
          <ActionButton label="Close" onClick={onClose} />
        </div>
      </section>
    </div>
  );
}
