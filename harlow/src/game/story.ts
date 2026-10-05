import type { Weather } from "./types";

export type ThoughtCondition = {
  from?: number;
  until?: number;
  /** Only in these weather states (the same values as the image weather map). */
  weather?: Weather[];
};

export type StoryEntry =
  | {
      type: "narration";
      text: string;
      condition?: ThoughtCondition;
    }
  | {
      type: "thought";
      text: string;
      condition?: ThoughtCondition;
    }
  | {
      type: "conversation";
      character: string;
      text: string;
    }
  | {
      type: "effect";
      stat: "health" | "stamina" | "fear" | "money" | "courage";
      amount: number;
    };

export type ConversationChoice = {
  label: string;
  response: StoryEntry[];
  endsConversation?: boolean;
  /** Marks one or more story milestones when this response is selected. */
  storyFlag?: import("./quests").StoryFlag | import("./quests").StoryFlag[];
  /** Completes the opening Mom objective after this conversation response. */
  completesMomQuest?: boolean;
  /** Shows this response only after every listed story flag is set. */
  requiresStoryFlag?: import("./quests").StoryFlag | import("./quests").StoryFlag[];
  /** Hides this response once any listed story flag is set. */
  excludesStoryFlag?: import("./quests").StoryFlag | import("./quests").StoryFlag[];
  /** Shows this response only once the choice with this label has been
   *  picked in the same conversation (to answer a question it raised). */
  requiresChoice?: string;
  /** Applies a permanent job reward when this response is selected. */
  jobOffer?: import("./quests").JobId;
  /** Hide this choice after Ethan has accepted a job. */
  requiresNoJob?: boolean;
  /** Show this choice only when Ethan has this job. */
  requiresJob?: import("./quests").JobId;
  /** Show this choice only when the conversation opened with jobOpening,
   *  i.e. on a later visit as an employee, never in the hiring talk. */
  returningEmployee?: boolean;
  /** Hide this choice while Ethan has this job (other jobs don't matter). */
  excludesJob?: import("./quests").JobId;
  /** Show this offer only after selecting its matching flyer. */
  requiresJobQuestTarget?: import("./quests").JobId;
  /** Requires this exact inventory item name. */
  requiresItem?: string;
  /** Adds this item to inventory when selected. */
  givesItem?: string;
  /** Removes this inventory item when selected (e.g. handing Mom the coffee). */
  removesItem?: string;
  /** Hide once Ethan already carries this item. */
  excludesItem?: string;
  /** Starts or advances a quest when selected. */
  startsQuest?: import("./quests").QuestId;
  /** Completes a quest when selected. */
  completesQuest?: import("./quests").QuestId;
  /** Show only while this quest is active. */
  requiresQuestActive?: import("./quests").QuestId;
  /** Optional quest step id to set while the quest is active. */
  questStep?: string;
  /** Show a closeup after this reply finishes (drawer, poster, memory). */
  closeup?: {
    image: string;
    thought: string;
    label?: string;
    /** Optional follow-up closeup (e.g. drawer shut). */
    next?: { image: string; thought: string; label?: string };
  };
};

export type Conversation = {
  opening: StoryEntry[];
  /** Replaces the opening once Ethan works for this NPC. */
  jobOpening?: { job: import("./quests").JobId; opening: StoryEntry[] };
  choices: ConversationChoice[];
};

export function narration(text: string, condition?: ThoughtCondition): StoryEntry {
  // Scene description without a speaker; an optional time/weather condition.
  return {
    type: "narration",
    text,
    condition,
  };
}

export function thought(
  text: string,
  condition?: ThoughtCondition
): StoryEntry {
  // Ethan's internal narration; an optional time/weather condition controls visibility.
  return {
    type: "thought",
    text,
    condition,
  };
}

/** Whether a narration or thought line applies at this time and weather. */
export function storyEntryApplies(entry: StoryEntry, time: number, weather: Weather) {
  if (entry.type !== "narration" && entry.type !== "thought") return true;
  const condition = entry.condition;
  if (!condition) return true;
  const afterStart = condition.from === undefined || time >= condition.from;
  const beforeEnd = condition.until === undefined || time < condition.until;
  const weatherMatches = !condition.weather || condition.weather.includes(weather);
  return afterStart && beforeEnd && weatherMatches;
}

export function ethan(text: string): StoryEntry {
  // Convenience helper for dialogue spoken by the player character.
  return {
    type: "conversation",
    character: "Ethan",
    text,
  };
}

export function npc(
  character: string,
  text: string
): StoryEntry {
  // Use this for any new NPC. Also add their portrait in StoryLog's getPortrait.
  return {
    type: "conversation",
    character,
    text,
  };
}
