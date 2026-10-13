import { folderLook, FOLDER_GONE_LINE, FOLDER_LOCKED_LINE, FOLDER_RINGS_LINE } from "@/game/chapter1";
import { isQuestActive } from "@/game/quests";
import type { JobId, QuestProgress, StoryFlag } from "@/game/quests";
import { isNightTime } from "@/game/utils";

export const WAITING_TIRED_HINT = "I can barely keep my eyes open. Go home, Ethan.";

export type TimeHintInput = {
  action: string;
  sceneId: string;
  time: number;
  dayOfWeek: string;
  job: JobId | null;
  flags: Partial<Record<StoryFlag, boolean>>;
  quests: QuestProgress[];
  knifeTaken: boolean;
};

function momAtKitchen(time: number, day: string) {
  if (time >= 450 && time < 540) return true;
  return (day === "Saturday" || day === "Sunday") && time >= 12 * 60 && time < 19 * 60;
}

/**
 * A thought for an action Ethan can still press outside its window.
 * Null when the action should run, or when there is nothing to try.
 */
export function timeHint(input: TimeHintInput): string | null {
  const { action, time, flags } = input;

  if (action === "talkToMom" && input.sceneId === "kitchen" && !momAtKitchen(time, input.dayOfWeek)) {
    return "Mom's not up yet. Or she's already gone.";
  }

  if (action === "goToSleep" && input.sceneId === "ethan-room") {
    const canSleep = time >= 22 * 60 || time < 7 * 60;
    if (!canSleep) return "Too early. I wouldn't sleep anyway.";
  }

  if (
    action === "lookAtGazette"
    && input.dayOfWeek === "Saturday"
    && time >= 12 * 60
    && !flags.gazetteFound
  ) {
    return "Somebody already took the paper in.";
  }

  if (
    action === "lookAtSanatoriumHill"
    && !isNightTime(time)
    && isQuestActive(input.quests, "light-on-the-hill")
    && !flags.sanatoriumSeenFromStreet
  ) {
    return "The hill looks normal in daylight. That's the trouble with it.";
  }

  if (
    action === "lookAtElrodBootPrint"
    && time >= 3 * 60
    && time < 7 * 60
    && (flags.margaretGossipHeard || flags.hillPrintHint)
    && !flags.bootPrintSeen
  ) {
    return "Too dark back there. I'd step right on it.";
  }

  if (action === "lookAtEmilyFolder") {
    const look = folderLook({
      time,
      fileDrawerSeen: flags.fileDrawerSeen,
      emilyFileOpened: flags.emilyFileOpened,
      folderLockedToday: flags.folderLockedToday,
      rachelFolderCover: flags.rachelFolderCover,
    });
    if (look === "gone") return FOLDER_GONE_LINE;
    if (look === "locked") return FOLDER_LOCKED_LINE;
    if (look === "rings") return FOLDER_RINGS_LINE;
    return null;
  }

  if (action === "enterDiner" && time < 7 * 60) {
    return "Closed. Margaret's not in yet.";
  }

  if (action === "talkToJohnny" && (time < 8 * 60 || time >= 14 * 60)) {
    return "Sign says back in five. It always says that.";
  }

  if (action === "workNeedleGrooveShift" && input.job === "needle-groove") {
    if (time < 10 * 60 || time >= 19 * 60) return "Johnny doesn't need me now.";
  }

  if (action === "takeScrapyardKnife" && !input.knifeTaken && time >= 7 * 60 && time < 15 * 60) {
    return "Roy's watching. Not with him standing right there.";
  }

  if (
    action === "lookAtSanatoriumCigarette"
    && flags.sanatoriumCigaretteSeen
    && time >= 7 * 60
    && time < 12 * 60
  ) {
    return "The butt's gone. Somebody came back for it.";
  }

  return null;
}
