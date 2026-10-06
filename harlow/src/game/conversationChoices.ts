import type { ConversationChoice } from "@/game/story";
import {
  isQuestActive,
  isQuestCompleted,
  type JobId,
  type QuestProgress,
  type StoryFlag,
} from "@/game/quests";

export type ConversationChoiceContext = {
  storyFlags: Partial<Record<StoryFlag, boolean>>;
  quests: QuestProgress[];
  job: JobId | null;
  jobQuestTarget: JobId | null;
  usedLabels: string[];
  openedAsEmployee: boolean;
  inventory: string[];
};

function flagList(flags: StoryFlag | StoryFlag[] | undefined) {
  if (!flags) return [];
  return Array.isArray(flags) ? flags : [flags];
}

function hasAllFlags(
  storyFlags: Partial<Record<StoryFlag, boolean>>,
  flags: StoryFlag | StoryFlag[] | undefined,
) {
  if (!flags) return true;
  return flagList(flags).every((flag) => Boolean(storyFlags[flag]));
}

function hasAnyFlag(
  storyFlags: Partial<Record<StoryFlag, boolean>>,
  flags: StoryFlag | StoryFlag[] | undefined,
) {
  if (!flags) return false;
  return flagList(flags).some((flag) => Boolean(storyFlags[flag]));
}

/**
 * Rachel's goodbye sets `rachelMet` and finishes The Tape together.
 * A choice list built on the tick before that flag commits still has the
 * quest, and the hood line belongs in the first talk with Walter.
 */
function meetsStoryRequirement(choice: ConversationChoice, ctx: ConversationChoiceContext) {
  if (hasAllFlags(ctx.storyFlags, choice.requiresStoryFlag)) return true;
  const required = flagList(choice.requiresStoryFlag);
  if (!required.includes("rachelMet")) return false;
  if (!required.every((flag) => flag === "rachelMet" || ctx.storyFlags[flag])) return false;
  return (
    isQuestCompleted(ctx.quests, "the-tape")
    || isQuestActive(ctx.quests, "down-to-the-station")
    || isQuestCompleted(ctx.quests, "down-to-the-station")
  );
}

/** Whether a reply is on screen for this conversation. Flags and quests are arguments so a stale render cannot drop them. */
export function conversationChoiceVisible(
  choice: ConversationChoice,
  ctx: ConversationChoiceContext,
) {
  return (
    (!choice.requiresNoJob || !ctx.job)
    && (!choice.requiresJob || choice.requiresJob === ctx.job)
    && (!choice.requiresJobQuestTarget || choice.requiresJobQuestTarget === ctx.jobQuestTarget)
    && meetsStoryRequirement(choice, ctx)
    && !hasAnyFlag(ctx.storyFlags, choice.excludesStoryFlag)
    && (!choice.requiresChoice || ctx.usedLabels.includes(choice.requiresChoice))
    && (!choice.requiresAnyChoice || choice.requiresAnyChoice.some((label) => ctx.usedLabels.includes(label)))
    && (!choice.requiresPriorChoice || ctx.usedLabels.length > 0)
    && (!choice.excludesChoice || !ctx.usedLabels.includes(choice.excludesChoice))
    && (!choice.excludesJob || choice.excludesJob !== ctx.job)
    && (!choice.returningEmployee || ctx.openedAsEmployee)
    && (!choice.requiresItem || ctx.inventory.includes(choice.requiresItem))
    && (!choice.excludesItem || !ctx.inventory.includes(choice.excludesItem))
    && (!choice.requiresQuestActive || isQuestActive(ctx.quests, choice.requiresQuestActive))
    && (choice.endsConversation || !ctx.usedLabels.includes(choice.label))
  );
}
