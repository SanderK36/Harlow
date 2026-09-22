import type { SavedGameSlot } from "@/game/save";

import styles from "./SaveWindow.module.css";

type SaveWindowProps = {
  mode: "save" | "load";
  slots: Array<SavedGameSlot | null>;
  message: string | null;
  onSelect: (slotNumber: number) => void;
  onClose: () => void;
};

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const remainingMinutes = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${remainingMinutes}`;
}

export default function SaveWindow({
  mode,
  slots,
  message,
  onSelect,
  onClose,
}: SaveWindowProps) {
  const isSaving = mode === "save";

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-window-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="save-window-title">{isSaving ? "Save Game" : "Load Game"}</h2>
        <p className={styles.instructions}>
          {isSaving ? "Choose a slot to save your progress." : "Choose a saved game to continue."}
        </p>

        <div className={styles.slots}>
          {slots.map((slot, index) => {
            const slotNumber = index + 1;
            const isEmpty = slot === null;
            const save = slot?.save;

            return (
              <button
                key={slotNumber}
                type="button"
                className={styles.slot}
                disabled={!isSaving && isEmpty}
                onClick={() => onSelect(slotNumber)}
              >
                <span className={styles.slotNumber}>Slot {slotNumber}</span>
                {save ? (
                  <span className={styles.details}>
                    Day {save.gameState.dayNumber} · {save.gameState.location} · {formatTime(save.gameState.time)}
                    <small>{slot.savedAt === "Previous save" ? slot.savedAt : new Date(slot.savedAt).toLocaleString()}</small>
                  </span>
                ) : (
                  <span className={styles.empty}>Empty</span>
                )}
              </button>
            );
          })}
        </div>
        {message && <p className={styles.message} role="status">{message}</p>}
      </section>
    </div>
  );
}
