import type { StoryEntry } from "./story";

export type ArmedConversationCloseup = {
  /** Dialogue lines in the log once the reply that owns the close-up is queued. */
  armedAt: number;
};

/** Lines the dialogue box actually shows. Effect rows are not lines. */
export function dialogueLineCount(entries: StoryEntry[]) {
  return entries.filter(
    (entry) => entry.type === "conversation" || entry.type === "narration" || entry.type === "thought",
  ).length;
}

/**
 * A conversation close-up is armed when its reply is queued and revealed
 * only after that reply's last line has settled. An earlier settled beat
 * (the opening, or a line still in the middle of the reply) must not open it.
 */
export function shouldRevealArmedCloseup(
  pending: ArmedConversationCloseup | null,
  settledLineCount: number,
) {
  return pending !== null && pending.armedAt > 0 && settledLineCount >= pending.armedAt;
}
