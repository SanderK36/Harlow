import { conversationChoiceVisible, type ConversationChoiceContext } from "@/game/conversationChoices";
import { isQuestActive, isQuestCompleted, type QuestId } from "@/game/quests";
import { npc, type ConversationChoice, type StoryEntry } from "@/game/story";
import type { TrustPerson } from "@/game/trust";

/** 18:00. From here the evening line is what they say. */
export const EVENING_START = 18 * 60;

const LINES: Record<TrustPerson, { day: string; evening: string }> = {
  rachel: {
    day: "Still can't stop looking at that tape.",
    evening: "You should be home, Ethan. So should I.",
  },
  linda: {
    day: "There's coffee if you want it.",
    evening: "Lock the door when you come in, honey. Please.",
  },
  walter: {
    day: "I've got work, Ethan.",
    evening: "Go home before dark, kid.",
  },
  margaret: {
    day: "Refill, honey?",
    evening: "You're looking thin, honey. Eat something.",
  },
};

const SPEAKER: Record<TrustPerson, string> = {
  rachel: "Rachel",
  linda: "Linda",
  walter: "Walter",
  margaret: "Margaret",
};

export function repeatVisitLine(person: TrustPerson, time: number): string {
  return time >= EVENING_START ? LINES[person].evening : LINES[person].day;
}

export function repeatVisitOpening(person: TrustPerson, time: number): StoryEntry[] {
  return [npc(SPEAKER[person], repeatVisitLine(person, time))];
}

function flagList(flags: ConversationChoice["storyFlag"]) {
  if (!flags) return [];
  return Array.isArray(flags) ? flags : [flags];
}

function questOpen(ctx: ConversationChoiceContext, id: QuestId) {
  return !isQuestActive(ctx.quests, id) && !isQuestCompleted(ctx.quests, id);
}

/** A reply still has something Ethan has not heard. Flavor and goodbyes do not. */
function bringsNews(choice: ConversationChoice, ctx: ConversationChoiceContext) {
  if (!conversationChoiceVisible(choice, ctx)) return false;
  if (choice.repeatable) return false;
  if (choice.startsQuest && questOpen(ctx, choice.startsQuest)) return true;
  if (choice.completesQuest && !isQuestCompleted(ctx.quests, choice.completesQuest)) return true;
  if (choice.leadQuest && questOpen(ctx, choice.leadQuest)) return true;
  if (flagList(choice.storyFlag).some((flag) => !ctx.storyFlags[flag])) return true;
  if (choice.givesItem && !ctx.inventory.includes(choice.givesItem)) return true;
  return false;
}

/** True when the open talk has no new story left, so the repeat-visit line is the greeting. */
export function visitHasNothingNew(
  choices: readonly ConversationChoice[],
  ctx: ConversationChoiceContext,
): boolean {
  return !choices.some((choice) => bringsNews(choice, ctx));
}
