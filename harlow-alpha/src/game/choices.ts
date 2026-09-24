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
  /** Disable the choice until these conditions are met. Extend this for new rules. */
  requirements?: {
    money?: number;
  }
};

export type GameChoice = Choice | ConversationChoice;
