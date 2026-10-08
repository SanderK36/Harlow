import type { Choice } from "../choices";
import type { StoryFlag } from "../quests";
import type { Conversation, StoryEntry } from "../story";
import type { DayOfWeek, Location, Weather } from "../types";

export type SceneCharacter = {
  /** NPC overlay shown in this scene. Add their portrait path in `image`. */
  name: string;
  from?: number;
  until?: number;
  /** If set, the character only appears on these weekdays. */
  days?: DayOfWeek[];
  image?: string;
  /** Alternative scene artwork used when the character is present at night. */
  nightImage?: string;
  /** Requires every listed story flag. */
  requiresFlags?: StoryFlag[];
  /** Hidden once any listed story flag is set. */
  excludesFlags?: StoryFlag[];
};

export type Scene = {
  /**
   * Blueprint for one playable location/state.
   * To add a scene: create a Scene object, add it to `scenes` in registry.ts,
   * then point another choice's `nextScene` at its id. Use image day/night
   * paths from /public.
   */
  id: string;
  story: StoryEntry[];
  location: Location;
  image: {
    day: string;
    night: string;
    weather?: Partial<Record<Weather, string>>;
    /** The weather art is daylit: at night the night art wins. */
    weatherDayOnly?: boolean;
    /**
     * The weather art is a night plate. By day the day art wins and the
     * interim rain filter greys it. A dark rainy plate would read as night
     * at 10:35.
     */
    weatherNightOnly?: boolean;
    /**
     * No night art yet: `night` is the day plate. After dark the scene is
     * dimmed and cooled instead of showing daylight. Set this on any scene
     * that still shares its day image at night.
     */
    noNightVariant?: boolean;
    /**
     * CSS object-position when the plate is cropped (object-fit). Full-bleed
     * plates ignore it; use captionPosition when a corner covers the subject.
     */
    objectPosition?: string;
  };
  /**
   * Where the scene caption sits over the art on a wide screen.
   * Phones already place it above the picture.
   */
  captionPosition?: "top" | "bottom" | "center";
  choices: Choice[];
  conversation?: Conversation;
  characters?: SceneCharacter[];
};
