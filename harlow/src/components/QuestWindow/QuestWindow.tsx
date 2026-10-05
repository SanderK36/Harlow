import ActionButton from "@/components/ActionButton/ActionButton";
import {
  QUEST_DEFS,
  jobDetails,
  questObjective,
  type JobId,
  type QuestProgress,
} from "@/game/quests";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  quests: QuestProgress[];
  job: JobId | null;
  onClose: () => void;
};

export default function QuestWindow({ quests, job, onClose }: QuestWindowProps) {
  const active = quests.filter((quest) => quest.status === "active");
  const completed = quests.filter((quest) => quest.status === "completed");
  const details = job ? jobDetails[job] : null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-log-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className={styles.eyebrow}>Quest log</p>
        <h2 id="quest-log-title">Quests</h2>

        {active.length === 0 && completed.length === 0 && (
          <p>No quests yet.</p>
        )}

        {active.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Active</p>
            {active.map((quest) => (
              <div key={quest.id} className={styles.quest}>
                <h3>{QUEST_DEFS[quest.id]?.title ?? quest.id}</h3>
                <p>{questObjective(quest)}</p>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Completed</p>
            {completed.map((quest) => (
              <div key={quest.id} className={styles.questDone}>
                <h3>{QUEST_DEFS[quest.id]?.title ?? quest.id}</h3>
                <p>{questObjective(quest)}</p>
              </div>
            ))}
          </div>
        )}

        {details && (
          <p className={styles.benefit}>
            Working at <strong>{details.name}</strong>. {details.benefit}
          </p>
        )}

        <ActionButton label="Close" onClick={onClose} />
      </section>
    </div>
  );
}
