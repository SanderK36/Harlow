export type ThoughtCondition = {
  from?: number;
  until?: number;
};

export type StoryEntry =
  | {
      type: "narration";
      text: string;
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
  /** Shows this response only after the matching story milestone. */
  requiresStoryFlag?: "momJobConcern";
  /** Applies a permanent job reward when this response is selected. */
  jobOffer?: import("./quests").JobId;
  /** Hide this choice after Ethan has accepted a job. */
  requiresNoJob?: boolean;
  /** Show this choice only when Ethan has this job. */
  requiresJob?: import("./quests").JobId;
  /** Show this offer only after selecting its matching flyer. */
  requiresJobQuestTarget?: import("./quests").JobId;
};

export type Conversation = {
  opening: StoryEntry[];
  choices: ConversationChoice[];
};

export function narration(text: string): StoryEntry {
  // Scene description without a speaker.
  return {
    type: "narration",
    text,
  };
}

export function thought(
  text: string,
  condition?: ThoughtCondition
): StoryEntry {
  // Ethan's internal narration; an optional time condition controls visibility.
  return {
    type: "thought",
    text,
    condition,
  };
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
