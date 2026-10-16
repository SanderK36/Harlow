import type { QuestProgress } from "@/game/quests";

/**
 * When an autosave is allowed. The write itself lives in save.ts so the
 * manual slots stay untouched. Scene changes are limited to one per
 * in-game hour (month + day + hour). Quest steps, completions, and sleep
 * always save, and they do not use up that hour.
 */

export type AutosaveRequest = {
  quest: boolean;
  sleep: boolean;
  sceneChanged: boolean;
};

export function inGameHour(timeMinutes: number) {
  const wrapped = ((timeMinutes % 1440) + 1440) % 1440;
  return Math.floor(wrapped / 60);
}

export function sceneAutosaveStamp(game: {
  currentMonth: string;
  dayNumber: number;
  time: number;
}) {
  return `${game.currentMonth}-${game.dayNumber}-${inGameHour(game.time)}`;
}

/**
 * True when a quest gained a step or became completed.
 * Starting a quest with no step yet does not count.
 */
export function questAutosaveNeeded(before: QuestProgress[], after: QuestProgress[]) {
  const prior = new Map(before.map((quest) => [quest.id, quest]));
  return after.some((quest) => {
    const previous = prior.get(quest.id);
    if (!previous) return quest.status === "completed" || Boolean(quest.step);
    const completed = previous.status !== "completed" && quest.status === "completed";
    const stepped = (previous.step ?? "") !== (quest.step ?? "");
    return completed || stepped;
  });
}

export function planAutosave(input: {
  request: AutosaveRequest;
  game: { currentMonth: string; dayNumber: number; time: number };
  previousSceneStamp: string | null;
}): { write: boolean; sceneStamp: string | null } {
  const stamp = sceneAutosaveStamp(input.game);
  const sceneAllowed = input.request.sceneChanged && input.previousSceneStamp !== stamp;
  const write = input.request.quest || input.request.sleep || sceneAllowed;
  if (!write) {
    return { write: false, sceneStamp: input.previousSceneStamp };
  }
  return {
    write: true,
    sceneStamp: sceneAllowed ? stamp : input.previousSceneStamp,
  };
}

const pulseListeners = new Set<() => void>();

export function subscribeAutosavePulse(listener: () => void) {
  pulseListeners.add(listener);
  return () => {
    pulseListeners.delete(listener);
  };
}

export function pulseAutosave() {
  pulseListeners.forEach((listener) => listener());
}
