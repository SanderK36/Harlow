import ActionButton from "@/components/ActionButton/ActionButton";
import { findAJobQuest, jobDetails, type JobId } from "@/game/quests";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  job: JobId | null;
  jobQuestTarget: JobId | null;
  onClose: () => void;
};

export default function QuestWindow({ job, jobQuestTarget, onClose }: QuestWindowProps) {
  const details = job ? jobDetails[job] : null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section className={styles.window} role="dialog" aria-modal="true" aria-labelledby="quest-log-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className={styles.eyebrow}>{job ? "Completed" : jobQuestTarget ? "Active quest" : "Not started"}</p>
        <h2 id="quest-log-title">{findAJobQuest.title}</h2>
        {details ? (
          <>
            <p>You are working at <strong>{details.name}</strong>.</p>
            <p className={styles.benefit}>{details.benefit}</p>
          </>
        ) : jobQuestTarget ? (
          <p>Talk to <strong>{jobDetails[jobQuestTarget].employer}</strong> about the job.</p>
        ) : (
          <p>{findAJobQuest.objective}</p>
        )}
        <ActionButton label="Close" onClick={onClose} />
      </section>
    </div>
  );
}
