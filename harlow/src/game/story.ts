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
      stat: "health" | "stamina" | "fear" | "money";
      amount: number;
    };

export type ConversationChoice = {
  label: string;
  response: StoryEntry[];
  endsConversation?: boolean;
  /** Marks a story milestone when this response is selected. */
  storyFlag?: "momJobConcern";
  /** Completes the opening objective after this conversation response. */
  completesMomQuest?: boolean;
  /** Shows this response only after the matching story milestone. */
  requiresStoryFlag?: "momJobConcern";
  /** Shows this response only once the choice with this label has been
   *  picked in the same conversation (to answer a question it raised). */
  requiresChoice?: string;
  /** Applies a permanent job reward when this response is selected. */
  jobOffer?: import("./quests").JobId;
  /** Hide this choice after Ethan has accepted a job. */
  requiresNoJob?: boolean;
  /** Show this choice only when Ethan has this job. */
  requiresJob?: import("./quests").JobId;
  /** Hide this choice while Ethan has this job (other jobs don't matter). */
  excludesJob?: import("./quests").JobId;
  /** Show this offer only after selecting its matching flyer. */
  requiresJobQuestTarget?: import("./quests").JobId;
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
