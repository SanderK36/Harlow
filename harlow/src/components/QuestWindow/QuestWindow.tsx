import ActionButton from "@/components/ActionButton/ActionButton";
import { findAJobQuest, jobDetails, type JobId } from "@/game/quests";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  job: JobId | null;
  jobQuestTarget: JobId | null;
  momJobConcernHeard: boolean;
  onClose: () => void;
};

export default function QuestWindow({ job, jobQuestTarget, momJobConcernHeard, onClose }: QuestWindowProps) {
  const details = job ? jobDetails[job] : null;
  const hasDiscoveredQuest = Boolean(job || jobQuestTarget || momJobConcernHeard);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section className={styles.window} role="dialog" aria-modal="true" aria-labelledby="quest-log-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className={styles.eyebrow}>{hasDiscoveredQuest ? (job ? "Completed" : "Active quest") : "Quest log"}</p>
        <h2 id="quest-log-title">{hasDiscoveredQuest ? findAJobQuest.title : "No quests discovered"}</h2>
        {!hasDiscoveredQuest ? (
          <p>Your quest log is empty.</p>
        ) : details ? (
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
