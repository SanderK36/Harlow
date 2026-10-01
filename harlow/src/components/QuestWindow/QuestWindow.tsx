import ActionButton from "@/components/ActionButton/ActionButton";
import { findAJobQuest, jobDetails, type JobId } from "@/game/quests";

import styles from "./QuestWindow.module.css";

type QuestWindowProps = {
  job: JobId | null;
  jobQuestTarget: JobId | null;
  momTalked: boolean;
  momJobConcernHeard: boolean;
  onClose: () => void;
};

export default function QuestWindow({ job, jobQuestTarget, momTalked, momJobConcernHeard, onClose }: QuestWindowProps) {
  const details = job ? jobDetails[job] : null;
  const hasJobQuest = Boolean(job || jobQuestTarget || momJobConcernHeard);
  const isMomQuestActive = !momTalked;
  const questTitle = isMomQuestActive || !hasJobQuest ? "Talk to Mom" : findAJobQuest.title;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section className={styles.window} role="dialog" aria-modal="true" aria-labelledby="quest-log-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className={styles.eyebrow}>{isMomQuestActive || jobQuestTarget || momJobConcernHeard ? (job ? "Completed" : "Active quest") : "Completed"}</p>
        <h2 id="quest-log-title">{questTitle}</h2>
        {isMomQuestActive ? (
          <p>Mom's got something on her mind.</p>
        ) : !hasJobQuest ? (
          <p>You caught up with Mom.</p>
        ) : details ? (
          <>
            <p>You're working at <strong>{details.name}</strong>.</p>
            <p className={styles.benefit}>{details.benefit}</p>
          </>
        ) : jobQuestTarget ? (
          <p>One of those leads is worth following up.</p>
        ) : (
          <p>{findAJobQuest.objective}</p>
        )}
        <ActionButton label="Close" onClick={onClose} />
      </section>
    </div>
  );
}
