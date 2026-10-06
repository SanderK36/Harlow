import type { ConversationChoice } from "./story";

export type ChoiceEffects = Partial<{
  // Values are added to the matching player stat. Negative values reduce it.
  courage: number;
  intelligence: number;
  charisma: number;
  athletics: number;
  strength: number;
  health: number;
  stamina: number;
  fear: number;
  money: number;
}>;

export type Choice = {
  /** Button text shown to the player. */
  label: string;
  /** Stable ID used for special interactions and availability checks. */
  action: string;
  /** Scene ID to display after this choice resolves. */
  nextScene: string;
  /** Minutes to advance in the game clock. Use 0 for instant movement. */
  timeCost: number;
  /** Optional player-stat changes applied after the choice resolves. */
  effects?: ChoiceEffects;
  /** Adds this exact item name to inventory after the choice is selected. */
  itemToAdd?: string;
  /** Clickable regions on the scene image, in percentages. */
  hotspots?: { left: number; top: number; width: number; height: number }[];
  /** Uses the travel overlay instead of moving to the scene immediately. */
  travel?: boolean;
  /**
   * The choice goes through an actual door (a room door, a front or back
   * door, a shop entrance): the screen dips to black and a door opens and
   * shuts while the scene changes. Not for stairs, ladders, open doorways,
   * walking around outside or the travel map.
   */
  door?: boolean;
  /** Hide the choice until these conditions are met. Never render it disabled. */
  requirements?: {
    money?: number;
    /** Requires this inventory item. */
    item?: string;
    /** Requires every listed story flag. */
    flags?: import("./quests").StoryFlag[];
    /** Hidden once any listed story flag is set. */
    excludesFlags?: import("./quests").StoryFlag[];
  };
  /** Show a closeup instead of (or before) moving scenes. */
  closeup?: {
    image: string;
    thought: string;
    label?: string;
    next?: { image: string; thought: string; label?: string };
  };
  /** Stat effects applied when this choice is taken (also on ChoiceEffects). */
  startsQuest?: import("./quests").QuestId;
  completesQuest?: import("./quests").QuestId;
  /**
   * Show the subtle new-lead marker until this quest exists.
   * Only for a person asking something of Ethan, never a discovery.
   */
  leadQuest?: import("./quests").QuestId;
  questStep?: string;
  setsFlags?: import("./quests").StoryFlag[];
};

export type GameChoice = Choice | ConversationChoice;
