import type { DayOfWeek, Location, Weather } from "./types";
import type { Choice } from "./choices";

import {
  type StoryEntry,
  type Conversation,
  npc,
  ethan,
  narration,
  thought,
  storyEntryApplies,
} from "./story";

export type SceneCharacter = {
  /** NPC overlay shown in this scene. Add their portrait path in `image`. */
  name: string;
  from?: number;
  until?: number;
  /** If set, the character only appears on these weekdays. */
  days?: import("./types").DayOfWeek[];
  image?: string;
  /** Alternative scene artwork used when the character is present at night. */
  nightImage?: string;
  /** Requires every listed story flag. */
  requiresFlags?: import("./quests").StoryFlag[];
  /** Hidden once any listed story flag is set. */
  excludesFlags?: import("./quests").StoryFlag[];
};

export type Scene = {
  /**
   * Blueprint for one playable location/state.
   * To add a scene: create a Scene object, add it to `scenes` below, then point
   * another choice's `nextScene` at its id. Use image day/night paths from /public.
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
  captionPosition?: "top" | "bottom";
  choices: Choice[];
  conversation?: Conversation;
  characters?: SceneCharacter[];
};

/** The weather states that count as rain (for rain-on-the-window art). */
export const RAIN_WEATHER: Weather[] = ["Rainy", "Heavy rain", "Thunderstorm"];

// Weather groups for weather-gated narration and thoughts. They apply day
// and night (it still rains after dark), unless a line also has a time range.
const RAIN: Weather[] = ["Rainy", "Heavy rain"];
const STORM: Weather[] = ["Thunderstorm"];
const WET: Weather[] = RAIN_WEATHER;
const DRY: Weather[] = ["Sunny", "Cloudy"];
const HEAVY: Weather[] = ["Heavy rain", "Thunderstorm"];
const WEEKDAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND: DayOfWeek[] = ["Saturday", "Sunday"];

/** Rain art for every rainy weather state (thunder art for storms if given). */
export function rainArt(rain: string, thunder = rain): Partial<Record<Weather, string>> {
  return { Rainy: rain, "Heavy rain": rain, Thunderstorm: thunder };
}

// Destinations listed here automatically appear in the walk and bus menus.
// Add an exterior scene here after it has been added to `scenes` below.
const exteriorDestinations = [
  { id: "front-yard", label: "your house", walkMinutes: 30 },
  { id: "needle-and-groove", label: "Needle & Groove", walkMinutes: 30 },
  { id: "gas-station", label: "the gas station", walkMinutes: 30 },
  { id: "police-station", label: "the police station", walkMinutes: 30 },
  { id: "hospital", label: "the hospital", walkMinutes: 35 },
  { id: "motel", label: "the motel", walkMinutes: 40 },
  { id: "cementary", label: "the cemetery", walkMinutes: 35 },
  { id: "diner", label: "the diner", walkMinutes: 25 },
  { id: "scrapyard", label: "the scrapyard", walkMinutes: 40 },
  { id: "sanatorium", label: "the sanatorium", walkMinutes: 40 },
];

export function isExteriorScene(sceneId: string): boolean {
  // Used by the page to decide whether to show travel controls.
  return (
    sceneId === "bus-stop" ||
    exteriorDestinations.some((destination) => destination.id === sceneId)
  );
}

export function createWalkingChoices(
  originId: string,
  availableDestinationIds: readonly string[],
): Choice[] {
  // Generates choices instead of repeating travel links in every exterior scene.
  return exteriorDestinations
    .filter(
      (destination) =>
        destination.id !== originId &&
        availableDestinationIds.includes(destination.id),
    )
    .map((destination) => ({
      label: `Walk to ${destination.label} (${destination.walkMinutes} min)`,
      action: `walkTo${destination.id}`,
      nextScene: destination.id,
      timeCost: destination.walkMinutes,
      travel: true,
    }));
}

export function createBusChoices(
  availableDestinationIds: readonly string[],
): Choice[] {
  // Bus pricing and travel time are defined here for every destination.
  return exteriorDestinations
    .filter((destination) => availableDestinationIds.includes(destination.id))
    .map((destination) => ({
      label: `Take the bus to ${destination.label} ($7, 10 min)`,
      action: `takeBusTo${destination.id}`,
      nextScene: destination.id,
      timeCost: 10,
      travel: true,
      effects: { money: -7 },
      requirements: { money: 7 },
    }));
}

// ----------------------------------------
// HALLWAY
// ----------------------------------------

export const hallway: Scene = {
  // Scene objects are data first: narration, art, available choices, and optional
  // conversations/NPCs. Copy this shape when creating a new location.
  id: "hallway",

  story: [
    narration("Rain ticks against the windows.", { weather: WET }),
    narration("The old house creaks around you.", { weather: DRY }),
    thought("I should get moving."),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/homeHallway.jpg",
    night: "./images/locations/home/homeHallwayNight.jpg",
  },

  choices: [
    {
      label: "Go to the living room",
      action: "goLivingRoom",
      nextScene: "living-room",
      timeCost: 0,
    },
    {
      label: "Go to the kitchen",
      action: "goKitchen",
      nextScene: "kitchen",
      timeCost: 0,
    },
    {
      label: "Go to the bathroom",
      action: "goBathroom",
      door: true,
      nextScene: "bathroom",
      timeCost: 0,
      hotspots: [{ left: 46, top: 21, width: 12, height: 41 }],
    },
    {
      label: "Go upstairs",
      action: "goUpstairs",
      nextScene: "hallway-upstairs",
      timeCost: 0,
    },
    {
      label: "Go to the basement",
      action: "goBasement",
      nextScene: "basement",
      timeCost: 0,
    },
    {
      label: "Go to the garage",
      action: "goGarage",
      door: true,
      nextScene: "garage",
      timeCost: 0,
    },
    {
      label: "Go outside",
      action: "leaveHouse",
      door: true,
      nextScene: "front-yard",
      timeCost: 5,
    },
  ],
};

export const upstairsHallway: Scene = {
  id: "hallway-upstairs",
  story: [
    narration("You take the stairs."),
    thought("Quiet up here."),
  ],
  location: "Home",
  image: {
    day: "./images/locations/home/homeHallwayUpstairsDay.jpg",
    night: "./images/locations/home/homeHallwayUpstairsNight.png",
    weather: rainArt("./images/locations/home/homeHallwayUpstairsDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "Open the attic hatch",
      action: "openAtticHatch",
      nextScene: "hallway-upstairs-attic-open",
      timeCost: 0,
      hotspots: [{ left: 59, top: 6, width: 3, height: 15 }],
    },
    {
      label: "Go to your room",
      action: "goEthanRoom",
      door: true,
      nextScene: "ethan-room",
      timeCost: 0,
      hotspots: [{ left: 74, top: 18, width: 10, height: 59 }],
    },
    {
      label: "Go to Mom's room",
      action: "goMomRoom",
      door: true,
      nextScene: "mom-room",
      timeCost: 0,
      hotspots: [{ left: 45, top: 21, width: 12, height: 39 }],
    },
    {
      label: "Go to Emily's room",
      action: "goEmilyRoom",
      door: true,
      nextScene: "emily-room",
      timeCost: 0,
      hotspots: [{ left: 64.5, top: 15, width: 4.5, height: 26 }],
    },
    {
      label: "Go to the attic",
      action: "goAttic",
      nextScene: "attic",
      timeCost: 0,
    },
    {
      label: "Go downstairs",
      action: "goDownstairs",
      nextScene: "hallway",
      timeCost: 0,
    },
  ],
};

export const upstairsHallwayAtticOpen: Scene = {
  id: "hallway-upstairs-attic-open",
  story: [
    narration("The hatch swings open. Cold air drops out of the dark."),
    thought("That's open. Dust, and whatever else is up there."),
  ],
  location: "Home",
  image: {
    day: "./images/locations/home/homeHallwayUpstairsDayAtticStairs.png",
    night: "./images/locations/home/homeHallwayUpstairsNightAtticStairs.png",
    weather: rainArt("./images/locations/home/homeHallwayUpstairsDayAtticStairs-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [
    ...upstairsHallway.choices
      .filter((choice) => choice.action !== "openAtticHatch")
      .map((choice) =>
        choice.action === "goAttic"
          ? { ...choice, hotspots: [{ left: 55, top: 1, width: 15, height: 79 }] }
          : choice.action === "goMomRoom"
            ? // The lowered ladder sits just right of Mom's door here.
              { ...choice, hotspots: [{ left: 44, top: 21, width: 10.5, height: 39 }] }
            : choice.action === "goEmilyRoom"
              ? // Emily's door is behind the ladder; it stays a button below.
                { ...choice, hotspots: undefined }
              : choice
      ),
    {
      label: "Close the attic hatch",
      action: "closeAtticHatch",
      nextScene: "hallway-upstairs",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// MADE COFFEE
// ----------------------------------------

export const madeCoffee: Scene = {
  id: "made-coffee",

  story: [
    narration("You put a pot of coffee on."),
    thought("That'll wake me up."),
  ],

  choices: [
    {
      label: "Back to the kitchen",
      action: "goKitchen",
      nextScene: "kitchen",
      timeCost: 0,
    },
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/kitchenDay.png",
    night: "./images/locations/home/kitchenNight.png",
    weather: rainArt("./images/locations/home/kitchenDay-rain.jpg"),
    weatherDayOnly: true,
  },
};

// ----------------------------------------
// FRONT YARD
// ----------------------------------------

export const frontYard: Scene = {
  id: "front-yard",

  story: [
    narration("You step outside. Cold air hits your face."),
    thought("Rain's coming down sideways. Street's empty again.", { weather: RAIN }),
    thought("Every flash, I check the end of the street.", { weather: STORM }),
    thought("Sun's out. Like nothing happened.", { weather: ["Sunny"], from: 360, until: 1080 }),
    thought("Colder than I figured."),
  ],

  location: "Home front yard",

  image: {
    day: "./images/locations/home/homeDayTime.jpg",
    night: "./images/locations/home/HomeNightTime.jpg",
    weather: {
      Rainy: "./images/locations/home/homeOutsideRainy.png",
      "Heavy rain": "./images/locations/home/homeOutsideRainy.png",
      Thunderstorm: "./images/locations/home/homeThunderstorm.png",
    },
  },

  choices: [
    {
      label: "Enter the garage",
      action: "enterGarage",
      door: true,
      nextScene: "garage",
      timeCost: 2,
    },
    {
      label: "Go to the backyard",
      action: "goBackYard",
      nextScene: "back-yard",
      timeCost: 2,
    },
    {
      label: "Look at the light pole",
      action: "lookAtLightPole",
      nextScene: "light-pole",
      timeCost: 1,
    },
    {
      label: "Walk to the Elrod house",
      action: "goElrodHouse",
      nextScene: "elrod-house",
      timeCost: 10,
      /* Availability: the-tape active or rachelMet — gated in useGame. */
    },
    {
      label: "Talk to Rachel",
      action: "talkToRachel",
      nextScene: "front-yard",
      timeCost: 0,
      requirements: { flags: ["walterStationTalk"] },
    },
    {
      label: "Look toward the hill",
      action: "lookAtSanatoriumHill",
      nextScene: "front-yard",
      timeCost: 0,
      closeup: {
        image: "./images/locations/sanatorium/sanatoriumFromTheStreetsNight.png",
        thought: "One window lit. Up on the hill. That place has been dead for years.",
        label: "Light on the hill",
      },
      setsFlags: ["sanatoriumSeenFromStreet"],
      startsQuest: "light-on-the-hill",
    },
    {
      label: "Go back inside",
      action: "goHome",
      door: true,
      nextScene: "hallway",
      timeCost: 5,
    },
  ],
};


export const rachelElrodConversation: Conversation = {
  opening: [npc("Rachel", "Hey, Ethan. You look like hell.")],
  choices: [
    {
      label: "Didn't sleep. Sirens all night.",
      response: [
        ethan("Didn't sleep. Sirens all night."),
        npc("Rachel", "Whole street heard them. I kept waiting for somebody to say it was a mistake."),
      ],
    },
    {
      label: "You okay, Rach?",
      response: [
        ethan("You okay, Rach?"),
        npc("Rachel", "No. She gave us butterscotch every Halloween. Remember?"),
        ethan("Yeah. Every Halloween."),
      ],
    },
    {
      label: "Who'd do this to her?",
      response: [
        ethan("Who'd do this to her?"),
        npc("Rachel", "Somebody who knew the house. Tape doesn't go up this fast for strangers."),
      ],
    },
    {
      label: "This feels like Emily.",
      response: [
        ethan("This feels like Emily."),
        npc("Rachel", "I know. Your mom kept the porch light on for a month after."),
        thought("I'd forgotten about the porch light."),
      ],
    },
    {
      label: "Hang on. Let me look at the tape.",
      excludesStoryFlag: "tapeSeen",
      response: [
        ethan("Hang on. Let me look at the tape."),
        npc("Rachel", "Go on. Look. I'll be right here."),
      ],
      endsConversation: true,
    },
    {
      label: "I saw it. I gotta go.",
      requiresStoryFlag: "tapeSeen",
      response: [
        ethan("I saw it. I gotta go."),
        npc(
          "Rachel",
          "Go see Walter. He knows something. And Ethan? Tell me what he says.",
        ),
        ethan("I will."),
      ],
      endsConversation: true,
      storyFlag: "rachelMet",
      completesQuest: "the-tape",
      questStep: "done",
      startsQuest: "down-to-the-station",
      leadQuest: "down-to-the-station",
    },
  ],
};

export const rachelFrontYardConversation: Conversation = {
  opening: [npc("Rachel", "Been out here an hour. What'd Walter say?")],
  choices: [
    {
      label: "I told him about the hooded man.",
      excludesStoryFlag: "rachelShutOut",
      response: [
        ethan("I told him about the hooded man."),
        npc("Rachel", "...A hood. Okay. Then we find him before he finds you."),
      ],
      storyFlag: ["rachelTrusted", "rachelKnowsHood"],
      completesQuest: "what-walter-said",
      questStep: "done",
      endsConversation: true,
    },
    {
      label: "There was a file. PARKER, E. Still open.",
      requiresStoryFlag: "fileDrawerSeen",
      excludesStoryFlag: "rachelShutOut",
      response: [
        ethan("There was a file. PARKER, E. Still open."),
        npc(
          "Rachel",
          "They stopped looking after a month. So why's he still keeping it in a drawer?",
        ),
        ethan("I don't know. He shut it before I could."),
      ],
      storyFlag: ["rachelTrusted", "rachelKnowsFile"],
      completesQuest: "what-walter-said",
      questStep: "done",
      endsConversation: true,
    },
    {
      label: "I can't tell you, Rach.",
      excludesStoryFlag: "rachelTrusted",
      response: [
        ethan("I can't tell you, Rach."),
        npc("Rachel", "Can't, or won't?"),
        ethan("Both."),
        npc("Rachel", "Fine. I'll find out myself. I always do."),
      ],
      storyFlag: "rachelShutOut",
      completesQuest: "what-walter-said",
      questStep: "shut",
      endsConversation: true,
    },
    {
      label: "He told me to go home.",
      response: [
        ethan("He told me to go home."),
        npc("Rachel", "Walter's been telling people to go home for ten years."),
      ],
    },
    {
      label: "Not now, Rach.",
      response: [
        ethan("Not now, Rach."),
        npc("Rachel", "Fine. But I'm not dropping this, Ethan."),
      ],
      endsConversation: true,
    },
  ],
};

export const elrodHouse: Scene = {
  id: "elrod-house",
  story: [
    narration("You stop at the Elrod house. Yellow tape across the porch."),
    thought("Rain's beating the tape flat. Washing the street clean.", { weather: WET }),
    thought("Her porch light's off. First time in twenty years.", { from: 1080 }),
    thought("Yellow tape and a dead geranium. That's all that's left of her."),
  ],
  location: "Elrod House",
  image: {
    day: "./images/locations/ElrodHouse/ElrodHouseDay.png",
    night: "./images/locations/ElrodHouse/ElrodHouseNight.png",
  },
  characters: [
    {
      name: "Rachel Bennet",
      from: 420,
      until: 1140,
      excludesFlags: ["rachelMet"],
    },
  ],
  conversation: rachelElrodConversation,
  choices: [
    {
      label: "Talk to Rachel",
      action: "talkToRachel",
      nextScene: "elrod-house",
      timeCost: 0,
    },
    {
      label: "Look at the tape",
      action: "lookAtElrodTape",
      nextScene: "elrod-house",
      timeCost: 0,
      closeup: {
        image: "./images/misc/flashbackEthanPovForest.png",
        thought: "Flashlights in the trees. October night. Same night Emily never came home.",
        label: "1972 memory",
      },
      setsFlags: ["tapeSeen"],
      questStep: "rachel",
      hotspots: [{ left: 28, top: 42, width: 44, height: 28 }],
    },
    {
      label: "Go back home",
      action: "leaveElrodHouse",
      nextScene: "front-yard",
      timeCost: 10,
    },
  ],
};

export const DINER_BOARD_HINT =
  "Same old board by the door. Nobody ever takes anything down.";

export const lightPole: Scene = {
  id: "light-pole",
  story: [
    narration("Three hiring flyers, curled and faded, are stapled to the light pole."),
    thought("Mom's covering everything. I need a job."),
  ],
  location: "Home front yard",
  /** The top flyer sits under a top-left caption. Keep the card on the grass. */
  captionPosition: "bottom",
  image: {
    day: "./images/locations/home/lightPoleDay.png",
    night: "./images/locations/home/lightPoleNight.png",
  },
  choices: [
    {
      label: "Read the Needle & Groove flyer",
      action: "chooseNeedleGrooveJob",
      nextScene: "light-pole",
      timeCost: 0,
    },
    {
      label: "Read the gas station flyer",
      action: "chooseGasStationJob",
      nextScene: "light-pole",
      timeCost: 0,
    },
    {
      label: "Read the scrapyard flyer",
      action: "chooseScrapyardJob",
      nextScene: "light-pole",
      timeCost: 0,
    },
    {
      label: "Step away from the light pole",
      action: "leaveLightPole",
      nextScene: "front-yard",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// BACK YARD
// ----------------------------------------

export const backYard: Scene = {
  id: "back-yard",

  story: [
    narration("You come around to the backyard."),
    thought("Mud. Great.", { weather: RAIN }),
    thought("The trees by the woods won't hold still.", { weather: STORM }),
    thought("Out here this late, I always feel watched.", { from: 1080 }),
  ],
  location: "Home back yard",

  image: {
    day: "./images/locations/home/homeBackyardDaytime.jpg",
    night: "./images/locations/home/homeBackyardNightTime.jpg",
    weather: {
      Rainy: "./images/locations/home/homeBackyardRainy.png",
      "Heavy rain": "./images/locations/home/homeBackyardRainy.png",
      Thunderstorm: "./images/locations/home/homeBackyardThunderstorm.png",
    },
  },

  choices: [
    {
      label: "Go to the front yard",
      action: "goFrontYard",
      nextScene: "front-yard",
      timeCost: 2,
    },
    {
      label: "Go to the kitchen",
      action: "goKitchen",
      door: true,
      nextScene: "kitchen",
      timeCost: 5,
    },
  ],
};

// ----------------------------------------
// CONVERSATIONS
// ----------------------------------------

export const momConversation: Conversation = {
  opening: [npc("Linda", "Hey, honey.")],

  choices: [
    {
      label: "Hey, Mom.",

      response: [
        ethan("Hey, Mom."),
        npc("Linda", "You look wrung out."),
      ],
    },

    {
      label: "Didn't sleep much. Kept hearing sirens.",
      requiresChoice: "Hey, Mom.",
      response: [
        ethan("Didn't sleep much. Kept hearing sirens."),
        npc("Linda", "You and me both, kiddo."),
      ],
    },

    {
      label: "How's it going at work?",
      storyFlag: "momJobConcern",
      response: [
        ethan("How's it going at work?"),
        npc(
          "Linda",
          "Not great. Shifts are thin, and everything costs more than it did.",
        ),
      ],
    },

    {
      label: "I'll find a way to help.",
      requiresStoryFlag: "momJobConcern",
      excludesStoryFlag: "willHelpMom",
      requiresNoJob: true,
      storyFlag: "willHelpMom",
      startsQuest: "find-a-job",
      response: [
        ethan("I'll find a way to help."),
        npc(
          "Linda",
          "You're a good kid. Be careful. Don't grab the first thing that pays.",
        ),
      ],
    },

    {
      label: "Heading out. Need anything?",
      excludesStoryFlag: "coffeeErrandHeard",
      response: [
        ethan("Heading out. Need anything?"),
        npc(
          "Linda",
          "We're out of coffee. Run down to Margaret's for me. Put it on my tab.",
        ),
        ethan("I'll get it."),
        npc("Linda", "Thanks, honey."),
      ],
      storyFlag: "coffeeErrandHeard",
      startsQuest: "faded-poster",
      leadQuest: "faded-poster",
    },

    {
      label: "I found Emily's poster at the diner.",
      requiresItem: "Coffee",
      requiresStoryFlag: "posterFound",
      excludesStoryFlag: "posterShownToMom",
      response: [
        ethan("I found Emily's poster at the diner."),
        npc("Linda", "Put that away."),
        ethan("Okay."),
      ],
      storyFlag: ["posterShownToMom", "coffeeDelivered"],
      completesQuest: "faded-poster",
      questStep: "done",
      removesItem: "Coffee",
    },
    {
      label: "I found Emily's poster at the diner.",
      excludesItem: "Coffee",
      requiresStoryFlag: ["posterFound", "coffeeDelivered"],
      excludesStoryFlag: "posterShownToMom",
      response: [
        ethan("I found Emily's poster at the diner."),
        npc("Linda", "Put that away."),
        ethan("Okay."),
      ],
      storyFlag: "posterShownToMom",
      completesQuest: "faded-poster",
      questStep: "done",
    },
    {
      label: "I found Emily's poster at the diner.",
      excludesItem: "Coffee",
      requiresStoryFlag: ["posterFound", "coffeeErrandHeard"],
      excludesStoryFlag: ["posterShownToMom", "coffeeDelivered"],
      response: [
        ethan("I found Emily's poster at the diner."),
        npc("Linda", "...Did you get the coffee?"),
        ethan("Not yet. I'll get it."),
        npc("Linda", "Alright, honey. Don't forget."),
      ],
      storyFlag: "posterShownToMom",
      completesQuest: "faded-poster",
      questStep: "done",
    },
    {
      label: "I found Emily's poster at the diner.",
      excludesItem: "Coffee",
      requiresStoryFlag: "posterFound",
      excludesStoryFlag: ["posterShownToMom", "coffeeErrandHeard"],
      response: [
        ethan("I found Emily's poster at the diner."),
        npc("Linda", "Put that away."),
        ethan("Okay."),
      ],
      storyFlag: "posterShownToMom",
      completesQuest: "faded-poster",
      questStep: "done",
    },
    {
      label: "Got your coffee.",
      requiresItem: "Coffee",
      excludesStoryFlag: "coffeeDelivered",
      response: [
        ethan("Got your coffee."),
        npc("Linda", "Thanks, honey."),
      ],
      storyFlag: "coffeeDelivered",
      removesItem: "Coffee",
    },

    {
      label: "I'm heading out.",

      response: [
        ethan("I'm heading out."),
        npc("Linda", "Alright. Watch yourself out there."),
      ],
      endsConversation: true,
    },

    {
      label: "I'll leave you to it.",

      response: [ethan("I'll leave you to it."), npc("Linda", "Alright, honey.")],
      endsConversation: true,
    },
  ],
};

export const momDeathConversation: Conversation = {
  opening: [
    npc(
      "Linda",
      "I saw you out by the tape last night. Is it true? Mrs. Elrod?",
    ),
  ],
  choices: [
    {
      label: "Yeah. It's true. Walter wouldn't tell me anything else.",
      response: [
        ethan("Yeah. It's true. Walter wouldn't tell me anything else."),
        npc("Linda", "He asked me when I last saw her. It's been a few days."),
      ],
    },
    {
      label: "Yeah. Did you know her well?",
      response: [
        ethan("Yeah. Did you know her well?"),
        npc(
          "Linda",
          "Not really. A word or two when she got the mail.",
        ),
      ],
    },
    {
      label: "Yeah. Do they know who did it?",
      response: [
        ethan("Yeah. Do they know who did it?"),
        npc(
          "Linda",
          "No. They're still putting it together. I'm not going to guess.",
        ),
      ],
    },
    {
      label: "Yeah. I can't believe it.",
      response: [
        ethan("Yeah. I can't believe it."),
        npc(
          "Linda",
          "Me neither. She was alone in that house so much. Be careful. And let the sheriff handle it.",
        ),
      ],
    },
    {
      label: "Exit conversation",
      requiresPriorChoice: true,
      response: [],
      endsConversation: true,
    },
  ],
};

export const johnnyConversation: Conversation = {
  opening: [npc("Johnny", "Hey. Looking for something?")],
  jobOpening: {
    job: "needle-groove",
    opening: [npc("Johnny", "Hey, new guy. These records won't shelve themselves.")],
  },
  choices: [
    {
      label: "Yeah. Just looking around.",
      excludesJob: "needle-groove",
      response: [
        ethan("Yeah. Just looking around."),
        npc("Johnny", "Take your time."),
      ],
    },
    {
      label: "Not really. You own this place?",
      excludesJob: "needle-groove",
      response: [
        ethan("Not really. You own this place?"),
        npc("Johnny", "Yeah. A few years now."),
      ],
    },
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "needle-groove",
      jobOffer: "needle-groove",
      response: [
        ethan("I'm looking for work."),
        npc(
          "Johnny",
          "I can use a hand on stock and the counter. You're hired. Stick around. You'll hear more about this town than you want.",
        ),
      ],
    },
    {
      label: "Thanks, Johnny. When do I start?",
      requiresJob: "needle-groove",
      requiresChoice: "I'm looking for work.",
      response: [
        ethan("Thanks, Johnny. When do I start?"),
        npc("Johnny", "You just did. Grab a box."),
        ethan("Got it."),
      ],
    },
    {
      label: "On it.",
      requiresJob: "needle-groove",
      returningEmployee: true,
      response: [
        ethan("On it."),
        npc("Johnny", "Alphabetical this time. Not by how cool the cover is."),
      ],
    },
    {
      label: "Heard anything interesting lately?",
      requiresJob: "needle-groove",
      requiresAnyChoice: ["On it.", "I'm looking for work."],
      response: [
        ethan("Heard anything interesting lately?"),
        npc(
          "Johnny",
          "Always. Diner, after lunch. People talk louder than they think.",
        ),
      ],
    },
    {
      label: "Nothing.",
      excludesJob: "needle-groove",
      response: [ethan("Nothing."), npc("Johnny", "Suit yourself.")],
      endsConversation: true,
    },
    {
      label: "Catch you later.",
      requiresJob: "needle-groove",
      requiresAnyChoice: ["On it.", "I'm looking for work."],
      response: [ethan("Catch you later."), npc("Johnny", "Don't be late.")],
      endsConversation: true,
    },
  ],
};

export const walterConversation: Conversation = {
  opening: [npc("Walter", "Ethan. Figured you'd turn up.")],
  choices: [
    {
      label: "I'm looking for some information.",
      excludesChoice: "I saw someone last night. End of the street. In a hood.",
      response: [
        ethan("I'm looking for some information."),
        npc("Walter", "Information about what?"),
      ],
    },
    {
      label: "Emily.",
      requiresChoice: "I'm looking for some information.",
      excludesChoice: "I saw someone last night. End of the street. In a hood.",
      response: [
        ethan("Emily."),
        npc("Walter", "That file's been closed ten years, Ethan. Leave it closed."),
      ],
    },
    {
      label: "Forget it.",
      requiresChoice: "I'm looking for some information.",
      excludesAnyChoice: [
        "I saw someone last night. End of the street. In a hood.",
        "Emily.",
      ],
      response: [
        ethan("Forget it."),
        npc("Walter", "Then we're done."),
      ],
      endsConversation: true,
    },
    {
      label: "Anything new on Mrs. Elrod?",
      excludesChoice: "I saw someone last night. End of the street. In a hood.",
      response: [
        ethan("Anything new on Mrs. Elrod?"),
        npc("Walter", "Nothing I can share."),
      ],
    },
    {
      label: "I saw someone last night. End of the street. In a hood.",
      requiresStoryFlag: "rachelMet",
      excludesStoryFlag: "walterStationTalk",
      response: [
        ethan("I saw someone last night. End of the street. In a hood."),
        npc("Walter", "...You tell anyone else that?"),
        ethan("No."),
        npc("Walter", "Keep it that way. Go home, Ethan."),
      ],
      storyFlag: "walterStationTalk",
      completesQuest: "down-to-the-station",
      questStep: "done",
      startsQuest: "what-walter-said",
      leadQuest: "what-walter-said",
      closeup: {
        image: "./images/locations/police_station/filingCabinetOpen.png",
        thought: "PARKER, E. – 1972. Still open. Still there.",
        label: "Open filing drawer",
        setsFlags: ["fileDrawerSeen"],
        next: {
          image: "./images/locations/police_station/filingCabinetClosed.png",
          thought: "He shut it with his boot. Like it was nothing.",
          label: "Closed filing drawer",
        },
      },
    },
    {
      label: "Alright. I'm going.",
      requiresChoice: "I saw someone last night. End of the street. In a hood.",
      response: [ethan("Alright. I'm going.")],
      endsConversation: true,
    },
    {
      label: "Never mind.",
      excludesChoice: "I saw someone last night. End of the street. In a hood.",
      response: [ethan("Never mind."), npc("Walter", "Then we're done.")],
      endsConversation: true,
    },
  ],
};

// ----------------------------------------
// LIVING ROOM
// ----------------------------------------

export const livingRoom: Scene = {
  id: "living-room",
  story: [
    narration("You walk into the living room."),
    thought("Can't sleep. The house is too quiet.", { until: 420 }),
    thought("Quiet in here.", { from: 420, until: 540 }),
    // Weekdays she leaves for work at six. Weekends she stays until ten.
    thought("Mom's in here.", { from: 540, until: 1080, days: WEEKDAYS }),
    thought("Mom's in here.", { from: 540, until: 1320, days: WEEKEND }),
    thought("Quiet again. Mom's at work.", { from: 1080, days: WEEKDAYS }),
    thought("Quiet again.", { from: 1320, days: WEEKEND }),
  ],

  location: "Living room",
  image: {
    day: "./images/locations/home/livingRoomDay.png",
    night: "./images/locations/home/livingRoomNight.png",
    weather: rainArt("./images/locations/home/livingRoomDay-rain.jpg"),
    weatherDayOnly: true,
  },
  characters: [
    {
      name: "Linda",
      from: 540,
      until: 1080,
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      image: "./images/locations/home/LindaParkerHome.jpg",
    },
    {
      name: "Linda",
      from: 540,
      until: 1320,
      days: ["Saturday", "Sunday"],
      image: "./images/locations/home/LindaParkerHome.jpg",
    },
  ],

  choices: [
    {
      label: "Watch TV",
      action: "watchTv",
      nextScene: "living-room",
      timeCost: 0,
      hotspots: [{ left: 64, top: 34, width: 12, height: 16 }],
    },
    {
      label: "Relax on the couch",
      action: "relaxOnCouch",
      nextScene: "living-room-relaxing",
      timeCost: 15,
      effects: { stamina: 15 },
    },
    {
      label: "Talk to Mom",
      action: "talkToMom",
      nextScene: "living-room",
      timeCost: 10,
    },
    {
      label: "Go to the hallway",
      action: "goHome",
      nextScene: "hallway",
      timeCost: 0,
    },
    {
      label: "Go to the kitchen",
      action: "goKitchen",
      nextScene: "kitchen",
      timeCost: 0,
    },
  ],

  conversation: momConversation,
};

export const livingRoomRelaxing: Scene = {
  id: "living-room-relaxing",
  story: [
    narration("You drop onto the couch. The day goes quiet."),
    thought("Yeah. I needed that."),
  ],
  location: "Living room",
  image: {
    day: "./images/characters/EthanParker/EthanRelaxing.png",
    night: "./images/characters/EthanParker/EthanRelaxinNight.png",
  },
  choices: [
    {
      label: "Get up",
      action: "stopRelaxing",
      nextScene: "living-room",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// KITCHEN
// ----------------------------------------

export const kitchen: Scene = {
  id: "kitchen",

  story: [
    narration("You step into the kitchen."),
    thought("Smells like last night's coffee."),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/kitchenDay.png",
    night: "./images/locations/home/kitchenNight.png",
    weather: rainArt("./images/locations/home/kitchenDay-rain.jpg"),
    weatherDayOnly: true,
  },

  characters: [
    {
      name: "Linda",
      from: 450,
      until: 540,
    },
    {
      name: "Linda",
      from: 720,
      until: 1140,
      days: ["Saturday", "Sunday"],
    },
  ],

  choices: [
    {
      label: "Talk to Mom",
      action: "talkToMom",
      nextScene: "kitchen",
      timeCost: 10,
    },
    {
      label: "Check the fridge",
      action: "checkFridge",
      nextScene: "fridge",
      timeCost: 0,
    },
    {
      label: "Go to the backyard",
      action: "goBackYard",
      door: true,
      nextScene: "back-yard",
      timeCost: 5,
    },
    {
      label: "Make some coffee",
      action: "makeCoffee",
      nextScene: "made-coffee",
      timeCost: 10,
      effects: { stamina: 5 },
    },
    {
      label: "Go to the hallway",
      action: "goHome",
      nextScene: "hallway",
      timeCost: 0,
    },
    {
      label: "Go to the living room",
      action: "goLivingRoom",
      nextScene: "living-room",
      timeCost: 0,
    },
  ],
};

kitchen.conversation = momConversation;

export const margaretConversation: Conversation = {
  opening: [npc("Margaret", "Sit anywhere you like, hon.")],
  choices: [
    {
      label: "Mom's coffee. On her tab.",
      requiresStoryFlag: "coffeeErrandHeard",
      excludesItem: "Coffee",
      excludesStoryFlag: "coffeeDelivered",
      response: [
        ethan("Mom's coffee. On her tab."),
        npc("Margaret", "Coming up. Tell Linda I said hey."),
      ],
      givesItem: "Coffee",
      questStep: "coffee",
    },
    {
      label: "Thanks. How's business today?",
      response: [
        ethan("Thanks. How's business today?"),
        npc(
          "Margaret",
          "Slow. Coffee goes cold before anybody orders it.",
        ),
      ],
    },
    {
      label: "People talking about Mrs. Elrod?",
      response: [
        ethan("People talking about Mrs. Elrod?"),
        npc(
          "Margaret",
          "People talk. Not much of it I'd repeat.",
        ),
      ],
    },
    {
      label: "That poster on the board. Emily.",
      requiresStoryFlag: "posterFound",
      response: [
        ethan("That poster on the board. Emily."),
        npc("Margaret", "I know, hon. Nobody ever had the heart to take it down."),
      ],
    },
    {
      label: "Can't stay. Catch you later.",
      response: [
        ethan("Can't stay. Catch you later."),
        npc("Margaret", "You take care now."),
      ],
      endsConversation: true,
    },
  ],
};

export const marleneConversation: Conversation = {
  opening: [
    npc("Marlene", "Ethan. Make it quick. I'm on a shift."),
  ],
  choices: [
    {
      label: "I'll be quick. How's the shift?",
      response: [
        ethan("I'll be quick. How's the shift?"),
        npc("Marlene", "Busy. That's all you get."),
      ],
    },
    {
      label: "I'll get out of your way.",
      response: [
        ethan("I'll get out of your way."),
        npc("Marlene", "Good. Don't make more work for me."),
      ],
      endsConversation: true,
    },
  ],
};

export const fridge: Scene = {
  id: "fridge",
  story: [
    narration("The fridge light hits a few cold bottles."),
    thought("A beer wouldn't hurt."),
  ],
  location: "Kitchen",
  image: {
    day: "./images/locations/home/fridge.png",
    night: "./images/locations/home/fridge.png",
  },
  choices: [
    {
      label: "Take a beer",
      action: "takeBeer",
      nextScene: "fridge",
      timeCost: 0,
      itemToAdd: "Beer",
      hotspots: [
        { left: 15.3, top: 34.5, width: 2.2, height: 17.5 },
        { left: 17.5, top: 34, width: 4.8, height: 18.5 },
        { left: 22.3, top: 34.4, width: 3.5, height: 17.8 },
        { left: 25.8, top: 34, width: 5.8, height: 18.5 },
        { left: 79.7, top: 75.8, width: 6.8, height: 17.4 },
        { left: 86.5, top: 77, width: 3.3, height: 17.4 },
      ],
    },
    {
      label: "Close the fridge",
      action: "closeFridge",
      nextScene: "kitchen",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// BATHROOM
// ----------------------------------------

export const bathroom: Scene = {
  id: "bathroom",

  story: [
    narration("You step into the bathroom."),
    thought("Nothing in here. Good."),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/bathroomDay.png",
    night: "./images/locations/home/bathroomNight.png",
    weather: rainArt("./images/locations/home/bathroomDay-rain.jpg"),
    weatherDayOnly: true,
  },

  choices: [
    {
      label: "Go to the hallway",
      action: "goHome",
      door: true,
      nextScene: "hallway",
      timeCost: 0,
    },
  ],
};
// ----------------------------------------
// OTHER ROOMS
// ----------------------------------------

const returnToHallway = {
  label: "Go back to the hallway",
  action: "goHallway",
  nextScene: "hallway",
  timeCost: 0,
};

const returnToUpstairsHallway = {
  label: "Go back to the upstairs hallway",
  action: "goUpstairsHallway",
  nextScene: "hallway-upstairs",
  timeCost: 0,
};

export const ethanRoom: Scene = {
  id: "ethan-room",
  story: [
    narration("You step into your room."),
    thought("I keep seeing him. Standing in the street like he belonged there."),
  ],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanRoomDay.png",
    night: "./images/locations/home/ethanRoomNight.png",
    // ethanRoomRainy.png is not wired: the pennant says RIVERTON (it has to
    // say Harlow) and the cassette labels are anachronistic. Rainy weather
    // uses the interim rain filter on this room until that art is replaced.
  },
  choices: [
    {
      label: "Go to sleep",
      action: "goToSleep",
      nextScene: "ethan-room",
      timeCost: 0,
      hotspots: [{ left: 3, top: 36, width: 27, height: 38 }],
    },
    {
      label: "Play a record",
      action: "playVinyl",
      nextScene: "ethan-room",
      timeCost: 0,
      hotspots: [{ left: 69, top: 35, width: 14, height: 13 }],
    },
    {
      label: "Look at your desk",
      action: "lookAtDesk",
      nextScene: "ethan-room-desk",
      timeCost: 0,
    },
    { ...returnToUpstairsHallway, door: true },
  ],
};

export const ethanRoomDesk: Scene = {
  id: "ethan-room-desk",
  story: [
    narration("Your desk is the usual mess."),
    thought("Cigarettes ought to be in this clutter."),
  ],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanDeskDay.png",
    night: "./images/locations/home/ethanDeskNight.png",
    weather: rainArt("./images/locations/home/ethanDeskDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "Pick up the cigarettes",
      action: "pickUpCigarettes",
      nextScene: "ethan-room-desk-empty",
      timeCost: 0,
      itemToAdd: "Cigarettes",
    },
    {
      label: "Step away from the desk",
      action: "leaveDesk",
      nextScene: "ethan-room",
      timeCost: 0,
    },
  ],
};

export const momRoom: Scene = {
  id: "mom-room",
  story: [
    narration("You step into Mom's room."),
    thought("I shouldn't hang around in here."),
  ],
  location: "Mom's room",
  image: {
    day: "./images/locations/home/motherRoomDay.png",
    night: "./images/locations/home/MotherRoomNight.png",
    weather: rainArt("./images/locations/home/motherRoomDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [{ ...returnToUpstairsHallway, door: true }],
};

export const emilyRoom: Scene = {
  id: "emily-room",
  story: [
    narration("You step into Emily's room."),
    thought("Rain on her window. She always liked that sound.", { weather: RAIN }),
    thought("She used to count the seconds between the flash and the thunder.", { weather: STORM }),
    thought("Everything's right where she left it."),
  ],
  location: "Emily's room",
  image: {
    day: "./images/locations/home/sisterRoomDay.png",
    night: "./images/locations/home/sisterRoomNight.png",
    weather: rainArt("./images/locations/home/sisterRoomDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [{ ...returnToUpstairsHallway, door: true }],
};

export const attic: Scene = {
  id: "attic",
  story: [
    narration("You climb into the attic."),
    thought("Rain drums on the roof. Right over my head.", { weather: WET }),
    thought("Stale air. And dust."),
  ],
  location: "Attic",
  image: {
    day: "./images/locations/home/atticDay.png",
    night: "./images/locations/home/AtticNight.png",
    weather: rainArt("./images/locations/home/atticDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [returnToUpstairsHallway],
};

export const basement: Scene = {
  id: "basement",
  story: [
    narration("You go down into the basement."),
    thought("Water's seeping in by the wall. Again.", { weather: HEAVY }),
    thought("Darker down here than it ought to be."),
  ],
  location: "Basement",
  image: {
    day: "./images/locations/home/basementDay.png",
    night: "./images/locations/home/basementNight.png",
    weather: rainArt("./images/locations/home/basementDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [returnToHallway],
};

export const garage: Scene = {
  id: "garage",
  story: [
    narration("You step into the garage."),
    thought("Oil and old wood."),
  ],
  location: "Garage",
  image: {
    day: "./images/locations/home/garage.png",
    night: "./images/locations/home/garage.png",
  },
  choices: [
    {
      label: "Look at the bench",
      action: "lookAtGarageBench",
      nextScene: "garage-bench",
      timeCost: 0,
    },
    { ...returnToHallway, door: true },
  ],
};

export const garageBench: Scene = {
  id: "garage-bench",
  story: [
    narration("Old tools and loose bolts cover the bench."),
    thought("Flashlight, right on the edge."),
  ],
  location: "Garage",
  image: {
    day: "./images/locations/home/garageBenchFlashlight.png",
    night: "./images/locations/home/garageBenchFlashlight.png",
  },
  choices: [
    {
      label: "Pick up the flashlight",
      action: "pickUpGarageFlashlight",
      nextScene: "garage-bench-empty",
      timeCost: 0,
      itemToAdd: "Flashlight",
    },
    {
      label: "Leave it",
      action: "leaveGarageBench",
      nextScene: "garage",
      timeCost: 0,
    },
  ],
};

export const garageBenchEmpty: Scene = {
  id: "garage-bench-empty",
  story: [
    narration("The bench is still a mess. The flashlight is gone."),
  ],
  location: "Garage",
  image: {
    day: "./images/locations/home/garageBench.png",
    night: "./images/locations/home/garageBench.png",
  },
  choices: [
    {
      label: "Step away from the bench",
      action: "leaveGarageBench",
      nextScene: "garage",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// SCENE THOUGHT
// ----------------------------------------

// ----------------------------------------
// NEEDLE & GROOVE
// ----------------------------------------

export const needleAndGroove: Scene = {
  id: "needle-and-groove",
  story: [
    narration("You reach Needle & Groove."),
    thought("Johnny's probably got something loud on."),
  ],
  location: "Needle & Groove",
  image: {
    day: "./images/locations/NeedleGroove/vinylShopDay.jpg",
    night: "./images/locations/NeedleGroove/vinylShopNight.jpg",
    weather: {
      Rainy: "./images/locations/NeedleGroove/vinylShopRainy.png",
      "Heavy rain": "./images/locations/NeedleGroove/vinylShopRainy.png",
      Thunderstorm: "./images/locations/NeedleGroove/vinylShopRainy.png",
    },
  },
  choices: [
    {
      label: "Go inside",
      action: "enterNeedleAndGroove",
      door: true,
      nextScene: "needle-and-groove-inside",
      timeCost: 2,
    },
  ],
};

export const needleAndGrooveInside: Scene = {
  id: "needle-and-groove-inside",
  story: [
    narration("You step inside Needle & Groove."),
    thought("Old cardboard and vinyl. I could stay in here."),
  ],
  location: "Needle & Groove",
  image: {
    day: "./images/locations/NeedleGroove/needleGrooveEmpty.png",
    night: "./images/locations/NeedleGroove/needleGrooveEmpty.png",
  },
  characters: [
    {
      name: "Johnny Dalton",
      from: 480,
      until: 840,
      image: "./images/locations/NeedleGroove/johnnyDaltonCounter.png",
    },
  ],
  choices: [
    {
      label: "Work",
      action: "workNeedleGrooveShift",
      nextScene: "needle-and-groove-inside",
      timeCost: 0,
    },
    {
      label: "Shop",
      action: "openNeedleGrooveShop",
      nextScene: "needle-and-groove-inside",
      timeCost: 0,
    },
    {
      label: "Talk to Johnny",
      action: "talkToJohnny",
      nextScene: "needle-and-groove-inside",
      timeCost: 0,
    },
    {
      label: "Enter the back room",
      action: "enterNeedleAndGrooveBackroom",
      door: true,
      nextScene: "needle-and-groove-backroom",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveNeedleAndGroove",
      door: true,
      nextScene: "needle-and-groove",
      timeCost: 0,
    },
  ],
  conversation: johnnyConversation,
};

export const needleAndGrooveBackroom: Scene = {
  id: "needle-and-groove-backroom",
  story: [
    narration("You step into the back room."),
    thought("Boxes of records, stacked to the wall."),
  ],
  location: "Needle & Groove",
  image: {
    day: "./images/locations/NeedleGroove/vinylShopBackroom.png",
    night: "./images/locations/NeedleGroove/vinylShopBackroom.png",
  },
  characters: [
    {
      name: "Johnny Dalton",
      from: 840,
      image: "./images/locations/NeedleGroove/JohnnyBackroom.png",
    },
  ],
  choices: [
    {
      label: "Go back to the shop",
      action: "leaveNeedleAndGrooveBackroom",
      door: true,
      nextScene: "needle-and-groove-inside",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// GAS STATION
// ----------------------------------------

export const rayConversation: Conversation = {
  opening: [npc("Ray", "Hey there. Gas, snacks, or you just looking?")],
  jobOpening: {
    job: "gas-station",
    opening: [npc("Ray", "There's my new hire. Coffee's in the back.")],
  },
  choices: [
    {
      label: "None of that. I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "gas-station",
      jobOffer: "gas-station",
      response: [
        ethan("None of that. I'm looking for work."),
        npc(
          "Ray",
          "I can use somebody reliable. You're hired. Anything in the shop is half price while you work here.",
        ),
      ],
    },
    {
      label: "Just looking.",
      excludesJob: "gas-station",
      response: [
        ethan("Just looking."),
        npc("Ray", "Look all you want. Holler if you need something."),
      ],
    },
    {
      label: "Thanks, Ray. I won't let you down.",
      requiresJob: "gas-station",
      requiresChoice: "None of that. I'm looking for work.",
      response: [
        ethan("Thanks, Ray. I won't let you down."),
        npc("Ray", "Show up on time and we'll get along fine."),
      ],
    },
    {
      label: "Thanks. I'll grab a cup.",
      requiresJob: "gas-station",
      returningEmployee: true,
      response: [
        ethan("Thanks. I'll grab a cup."),
        npc("Ray", "Don't drink it all. It's the only thing keeping me alive."),
      ],
    },
    {
      label: "Nothing today.",
      excludesJob: "gas-station",
      response: [ethan("Nothing today."), npc("Ray", "Drive safe.")],
      endsConversation: true,
    },
    {
      label: "See you, Ray.",
      requiresJob: "gas-station",
      response: [ethan("See you, Ray."), npc("Ray", "See you, kid.")],
      endsConversation: true,
    },
  ],
};

export const gasStation: Scene = {
  id: "gas-station",

  story: [
    narration("You reach the gas station."),
    thought("Pumps dripping. Nobody's filling up in this.", { weather: RAIN }),
    thought("Gas pumps and lightning. Great combination.", { weather: STORM }),
    thought("Quiet out here. For now."),
  ],

  location: "Gas Station",

  image: {
    day: "./images/locations/gas_station/GasStationDay.jpg",
    night: "./images/locations/gas_station/GasStationNight.jpg",
    weather: rainArt(
      "./images/locations/gas_station/GasStationDay-rain.jpg",
      "./images/locations/gas_station/GasStationDay-thunder.jpg",
    ),
    weatherDayOnly: true,
  },

  choices: [
    {
      label: "Go inside",
      action: "enterGasStation",
      door: true,
      nextScene: "gas-station-inside",
      timeCost: 2,
    },
    {
      label: "Go to the garage",
      action: "enterGasStationGarage",
      nextScene: "gas-station-garage",
      timeCost: 1,
    },
  ],
};

export const gasStationInside: Scene = {
  id: "gas-station-inside",

  story: [
    narration("You step inside the gas station."),
    thought("Ray's behind the counter.", { from: 540, until: 1380 }),
    thought("Nobody in here but the cooler."),
  ],

  location: "Gas Station Inside",

  image: {
    day: "./images/locations/gas_station/GasStationInsideDay.png",
    night: "./images/locations/gas_station/GasStationInsideNight.png",
    weather: rainArt("./images/locations/gas_station/GasStationInsideRainy.png"),
    weatherDayOnly: true,
  },

  characters: [
    {
      name: "Ray Mercer",
      from: 540,
      until: 1380,
      image: "./images/locations/gas_station/rayMercerGasStation.png",
      nightImage: "./images/locations/gas_station/rayMercerGasStationNight.png",
      // Rain art for Ray when present is swapped in page.tsx.
    },
  ],
  conversation: rayConversation,

  choices: [
    {
      label: "Talk to Ray",
      action: "talkToRay",
      nextScene: "gas-station-inside",
      timeCost: 0,
    },
    {
      label: "Go to the garage",
      action: "enterGasStationGarage",
      nextScene: "gas-station-garage",
      timeCost: 1,
    },
    {
      label: "Shop",
      action: "openShop",
      nextScene: "gas-station-inside",
      timeCost: 0,
    },
    {
      label: "Go outside",
      action: "leaveGasStation",
      door: true,
      nextScene: "gas-station",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// GAS STATION GARAGE
// ----------------------------------------

export const tommyConversation: Conversation = {
  opening: [
    npc(
      "Tommy",
      "Ethan! Hang on, I'll turn this down. That solo's wasted on these speakers.",
    ),
  ],
  choices: [
    {
      label: "Still playing guitar, or just deafening everybody at work?",
      response: [
        ethan("Still playing guitar, or just deafening everybody at work?"),
        npc(
          "Tommy",
          "Both. Got a new metal riff that'll wake the whole street. Come by sometime. I'll play it.",
        ),
      ],
    },
    {
      label: "Hell of a solo. When do you get off?",
      response: [
        ethan("Hell of a solo. When do you get off?"),
        npc(
          "Tommy",
          "Five. Eight to five, every day. Nine hours of engines, grease, and people yelling about the music.",
        ),
      ],
    },
    {
      label: "Things have been rough. I might need your help.",
      response: [
        ethan("Things have been rough. I might need your help."),
        npc(
          "Tommy",
          "Hey. Whatever it is, you don't face it alone. Call me. I'll come.",
        ),
        ethan("Thanks, man. That means a lot."),
      ],
    },
    {
      label: "I'll let you get back to work.",
      response: [
        ethan("I'll let you get back to work."),
        npc(
          "Tommy",
          "Yeah. This engine won't fix itself. Later, man.",
        ),
      ],
      endsConversation: true,
    },
    {
      label: "Exit conversation",
      response: [],
      endsConversation: true,
    },
  ],
};

export const gasStationGarage: Scene = {
  id: "gas-station-garage",
  story: [
    narration("You step into the station garage. Oil and hot rubber."),
    thought(
      "Tommy's working. Leather jacket by the radio, metal blasting.",
      { from: 480, until: 1020 },
    ),
    thought("Tommy's off. Too quiet without that radio."),
  ],
  location: "Gas Station Garage",
  image: {
    day: "./images/locations/gas_station/gasStationGarageDay.png",
    night: "./images/locations/gas_station/gasStationGarageNight.png",
    weather: rainArt("./images/locations/gas_station/gasStationGarageRainy.png"),
    weatherDayOnly: true,
  },
  characters: [
    {
      name: "Tommy Vance",
      from: 480,
      until: 1020,
      image: "./images/locations/gas_station/TommyVanceWorking.png",
    },
  ],
  conversation: tommyConversation,
  choices: [
    {
      label: "Talk to Tommy",
      action: "talkToTommy",
      nextScene: "gas-station-garage",
      timeCost: 0,
    },
    {
      label: "Go to the shop",
      action: "enterGasStation",
      nextScene: "gas-station-inside",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveGasStationGarage",
      nextScene: "gas-station",
      timeCost: 1,
    },
  ],
};

// ----------------------------------------
// SCRAPYARD
// ----------------------------------------

export const bigRoyConversation: Conversation = {
  opening: [
    npc(
      "Big Roy",
      "Watch your step, kid. This place'll bite you if you let it.",
    ),
  ],
  jobOpening: {
    job: "scrapyard",
    opening: [npc("Big Roy", "Crowbar still in one piece? Good. So are you.")],
  },
  choices: [
    {
      label: "I'll watch my step. Busy day?",
      excludesJob: "scrapyard",
      response: [
        ethan("I'll watch my step. Busy day?"),
        npc(
          "Big Roy",
          "Always. Scrap don't take days off. Neither does the coffee.",
        ),
      ],
    },
    {
      label: "I'll be careful. What do you do here?",
      excludesJob: "scrapyard",
      response: [
        ethan("I'll be careful. What do you do here?"),
        npc(
          "Big Roy",
          "I sort the good junk from the bad. Trick is, both of 'em used to be somebody's.",
        ),
      ],
    },
    {
      label: "I'll watch my step. I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "scrapyard",
      jobOffer: "scrapyard",
      response: [
        ethan("I'll watch my step. I'm looking for work."),
        npc(
          "Big Roy",
          "Then take this crowbar. You're hired. It'll pop a stubborn lock, and it's a weapon if it comes to that.",
        ),
      ],
    },
    {
      label: "Thanks, Roy. I'll put it to good use.",
      requiresJob: "scrapyard",
      requiresChoice: "I'll watch my step. I'm looking for work.",
      response: [
        ethan("Thanks, Roy. I'll put it to good use."),
        npc("Big Roy", "Locks first. Skulls only if you have to."),
      ],
    },
    {
      label: "Still in one piece. Barely.",
      requiresJob: "scrapyard",
      returningEmployee: true,
      response: [
        ethan("Still in one piece. Barely."),
        npc("Big Roy", "That's the whole job description."),
      ],
    },
    {
      label: "Got it. I'll let you get back to it.",
      response: [
        ethan("Got it. I'll let you get back to it."),
        npc("Big Roy", "Appreciate it, kid. Keep your eyes open out there."),
      ],
      endsConversation: true,
    },
    {
      label: "Exit conversation",
      response: [],
      endsConversation: true,
    },
  ],
};

export const scrapyard: Scene = {
  id: "scrapyard",
  story: [
    narration("You reach the scrapyard at the edge of town."),
    thought("Rusted metal, piled up out of sight."),
  ],
  location: "Scrapyard",
  image: {
    day: "./images/locations/scrapyard/ScrapyardDay.png",
    night: "./images/locations/scrapyard/Scrapyardnight.png",
    weather: {
      Rainy: "./images/locations/scrapyard/ScrapyardRainy.png",
      "Heavy rain": "./images/locations/scrapyard/ScrapyardRainy.png",
      Thunderstorm: "./images/locations/scrapyard/ScrapyardThunder.png",
    },
  },
  choices: [
    {
      label: "Enter the scrapyard",
      action: "enterScrapyard",
      door: true,
      nextScene: "scrapyard-inside",
      timeCost: 2,
    },
  ],
};

export const scrapyardInside: Scene = {
  id: "scrapyard-inside",
  story: [
    narration("You pick through wrecked cars and twisted sheet metal."),
    thought("Big Roy's sorting a stack of old parts.", {
      from: 420,
      until: 900,
    }),
    thought("Every sound carries too far out here."),
  ],
  location: "Scrapyard",
  image: {
    day: "./images/locations/scrapyard/ScrapyardInsideDay.png",
    night: "./images/locations/scrapyard/ScrapyardInsideNight.png",
    weather: rainArt("./images/locations/scrapyard/ScrapyardInsideRainy.png"),
    weatherDayOnly: true,
  },
  characters: [
    {
      name: "Big Roy",
      from: 420,
      until: 900,
      image: "./images/locations/scrapyard/bigRoyWorking.png",
      // Rain art for Roy when present is swapped in page.tsx.
    },
  ],
  conversation: bigRoyConversation,
  choices: [
    {
      label: "Talk to Big Roy",
      action: "talkToBigRoy",
      nextScene: "scrapyard-inside",
      timeCost: 0,
    },
    {
      label: "Look at the desk",
      action: "lookAtScrapyardDesk",
      nextScene: "scrapyard-desk",
      timeCost: 0,
    },
    {
      label: "Go back outside",
      action: "leaveScrapyard",
      nextScene: "scrapyard",
      timeCost: 1,
    },
  ],
};

export const scrapyardDesk: Scene = {
  id: "scrapyard-desk",
  story: [
    narration("An old desk sits under a cracked window."),
    thought("Somebody left a knife here."),
  ],
  location: "Scrapyard",
  image: {
    day: "./images/locations/scrapyard/scrapyardKnifeOnDesk.png",
    night: "./images/locations/scrapyard/scrapyardKnifeOnDeskNight.png",
  },
  choices: [
    {
      label: "Take the knife",
      action: "takeScrapyardKnife",
      nextScene: "scrapyard-desk-empty",
      timeCost: 0,
      itemToAdd: "Knife",
    },
    {
      label: "Leave it",
      action: "leaveScrapyardDesk",
      nextScene: "scrapyard-inside",
      timeCost: 0,
    },
  ],
};

export const scrapyardDeskEmpty: Scene = {
  id: "scrapyard-desk-empty",
  story: [narration("The desk is bare.")],
  location: "Scrapyard",
  image: {
    day: "./images/locations/scrapyard/scrapyardDesk.png",
    night: "./images/locations/scrapyard/scrapyardDeskNight.png",
  },
  choices: [
    {
      label: "Step away from the desk",
      action: "leaveScrapyardDesk",
      nextScene: "scrapyard-inside",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// POLICE STATION
// ----------------------------------------

export const policeStation: Scene = {
  id: "police-station",
  story: [
    narration("You reach the police station."),
    thought("A few cars out front. Nobody in a hurry."),
  ],
  location: "Police Station",
  image: {
    day: "./images/locations/police_station/police_station_day.jpg",
    night: "./images/locations/police_station/police_station_night.jpg",
    weather: {
      Rainy: "./images/locations/police_station/policeStationOutsideRainy.png",
      "Heavy rain":
        "./images/locations/police_station/policeStationOutsideRainy.png",
      Thunderstorm:
        "./images/locations/police_station/policeStationOutsideRainy.png",
    },
  },
  choices: [
    {
      label: "Go inside",
      action: "enterPoliceStation",
      door: true,
      nextScene: "police-station-inside",
      timeCost: 2,
    },
  ],
};

export const policeStationInside: Scene = {
  id: "police-station-inside",
  story: [
    narration("You step inside the police station."),
    thought("Quieter than I figured a station would be."),
  ],
  location: "Police Station Inside",
  image: {
    day: "./images/locations/police_station/policeStationInsideDay.png",
    night: "./images/locations/police_station/policeStationInsideNight.png",
    weather: rainArt("./images/locations/police_station/policeStationInsideRainy.png"),
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "Go outside",
      action: "leavePoliceStation",
      door: true,
      nextScene: "police-station",
      timeCost: 0,
    },
    {
      label: "Go to the sheriff's office",
      action: "goToSheriffOffice",
      door: true,
      nextScene: "sheriff-office",
      timeCost: 2,
    },
  ],
};

export const sheriffOffice: Scene = {
  id: "sheriff-office",

  story: [
    narration("You step into the sheriff's office."),
    thought("Walter's not in yet. His shift starts at eight.", { until: 480 }),
    thought("Sheriff's in.", { from: 480, until: 960 }),
    thought("Nobody in. Just a desk full of paper.", { from: 960, until: 1080 }),
    thought("I shouldn't be in here this late.", { from: 1080 }),
  ],

  location: "Sheriff's office",

  image: {
    day: "./images/locations/police_station/walterOfficeDay.png",
    night: "./images/locations/police_station/walterOfficeNight.png",
    weather: {
      Rainy: "./images/locations/police_station/walterOfficeRain.png",
      "Heavy rain": "./images/locations/police_station/walterOfficeRain.png",
      Thunderstorm: "./images/locations/police_station/walterOfficeRain.png",
    },
    weatherDayOnly: true,
  },

  characters: [
    {
      name: "Walter Harrington",
      from: 480,
      until: 960,
      image: "./images/locations/police_station/WalterHarringtonOffice.jpg",
    },
  ],
  conversation: walterConversation,
  choices: [
    {
      label: "Go back to the station",
      action: "leaveSheriffOffice",
      door: true,
      nextScene: "police-station-inside",
      timeCost: 0,
    },
    {
      label: "Talk to Walter",
      action: "talkToWalter",
      nextScene: "sheriff-office",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// CEMETERY
// ----------------------------------------

export const cementary: Scene = {
  id: "cementary",
  story: [
    narration("You reach the cemetery."),
    thought("Rain pooling on the graves.", { weather: RAIN }),
    thought("Lightning over a graveyard. Real subtle, Harlow.", { weather: STORM }),
    thought("That gate's complaining in the wind."),
  ],
  location: "Cemetery",
  image: {
    day: "./images/locations/Cementary/cementaryDay.png",
    night: "./images/locations/Cementary/cementaryNight.png",
    weather: {
      Rainy: "./images/locations/Cementary/cementaryRain.png",
      "Heavy rain": "./images/locations/Cementary/cementaryRain.png",
      Thunderstorm: "./images/locations/Cementary/cementaryLightning.png",
    },
  },
  choices: [
    {
      label: "Enter the cemetery",
      action: "enterCemetery",
      door: true,
      nextScene: "cementary-inside",
      timeCost: 1,
    },
    {
      label: "Walk around to the back of the church",
      action: "goCemeteryBackside",
      nextScene: "cementary-backside",
      timeCost: 2,
    },
  ],
};

export const cementaryInside: Scene = {
  id: "cementary-inside",
  story: [
    narration("You walk the rows of old headstones."),
    thought("Quieter here than anywhere in town."),
  ],
  location: "Cemetery",
  image: {
    day: "./images/locations/Cementary/cementaryInsideDay.png",
    night: "./images/locations/Cementary/cementaryInsideNight.png",
  },
  choices: [
    {
      label: "Walk toward the back",
      action: "goCemeteryBackside",
      door: true,
      nextScene: "cementary-backside",
      timeCost: 2,
    },
    {
      label: "Go back to the entrance",
      action: "leaveCemetery",
      door: true,
      nextScene: "cementary",
      timeCost: 1,
    },
  ],
};

export const cementaryBackside: Scene = {
  id: "cementary-backside",
  story: [
    narration("You come around the back of the cemetery."),
    thought("I don't like it back here."),
  ],
  location: "Cemetery",
  image: {
    day: "./images/locations/Cementary/cementaryBacksideDay.png",
    night: "./images/locations/Cementary/cementaryBacksideNight.png",
    weather: {
      Rainy: "./images/locations/Cementary/cementaryBacksideRain.png",
      "Heavy rain": "./images/locations/Cementary/cementaryBacksideRain.png",
      Thunderstorm:
        "./images/locations/Cementary/cementaryBacksideLightning.png",
    },
  },
  choices: [
    {
      label: "Go back inside",
      action: "leaveCemeteryBackside",
      door: true,
      nextScene: "cementary-inside",
      timeCost: 2,
    },
  ],
};

// ----------------------------------------
// HOSPITAL
// ----------------------------------------

export const hospital: Scene = {
  id: "hospital",
  story: [
    narration("You reach the hospital."),
    thought("Too quiet for a hospital."),
  ],
  location: "Hospital",
  image: {
    day: "./images/locations/hospital/HospitalDay.jpg",
    night: "./images/locations/hospital/HospitalNight.jpg",
  },
  choices: [
    {
      label: "Go inside",
      action: "enterHospital",
      door: true,
      nextScene: "hospital-reception",
      timeCost: 2,
    },
  ],
};

export const hospitalReception: Scene = {
  id: "hospital-reception",
  story: [
    narration("You step inside the hospital."),
    thought("Disinfectant. Same smell as always."),
  ],
  location: "Hospital",
  image: {
    day: "./images/locations/hospital/hospitalReception.png",
    night: "./images/locations/hospital/hospitalReception.png",
  },
  characters: [
    {
      name: "Marlene",
      image: "./images/locations/hospital/marleneWorking.png",
    },
  ],
  conversation: marleneConversation,
  choices: [
    {
      label: "Go to the counter",
      action: "goToMarleneCounter",
      nextScene: "hospital-reception",
      timeCost: 0,
    },
    {
      label: "Talk to Marlene",
      action: "talkToMarlene",
      nextScene: "hospital-reception",
      timeCost: 0,
    },
    {
      label: "Go back",
      action: "leaveMarleneCounter",
      nextScene: "hospital-reception",
      timeCost: 0,
    },
    {
      label: "Go to the elevator",
      action: "goToHospitalRoom",
      nextScene: "hospital-elevator",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveHospital",
      door: true,
      nextScene: "hospital",
      timeCost: 0,
    },
  ],
};

export const earlConversation: Conversation = {
  opening: [
    npc("Earl", "You need a room, or are you just in my way?"),
  ],
  choices: [
    {
      label: "Just looking.",
      excludesStoryFlag: "earlLookElsewhere",
      storyFlag: "earlLookElsewhere",
      response: [
        ethan("Just looking."),
        npc("Earl", "Then look somewhere else. I've got work."),
      ],
    },
    {
      label: "How much for a room?",
      response: [
        ethan("How much for a room?"),
        npc("Earl", "Fifteen a night. Cash. You live across town, kid."),
        ethan("Just asking."),
        npc("Earl", "Then you're in my way again."),
      ],
    },
    {
      label: "No room. I'll get out of your way.",
      response: [ethan("No room. I'll get out of your way."), npc("Earl", "That's what I thought.")],
      endsConversation: true,
    },
  ],
};

export const hospitalElevator: Scene = {
  id: "hospital-elevator",
  story: [
    narration("You wait by the hospital elevator."),
    thought("Doors at the end of the hall. Not moving."),
  ],
  location: "Hospital",
  image: {
    day: "./images/locations/hospital/hospitalElevator.png",
    night: "./images/locations/hospital/hospitalElevator.png",
  },
  choices: [
    {
      label: "Go to Room 312",
      action: "goToHospitalRoom312",
      nextScene: "hospital-room-312",
      timeCost: 1,
    },
    {
      label: "Go back to reception",
      action: "returnToHospitalReception",
      nextScene: "hospital-reception",
      timeCost: 1,
    },
  ],
};

export const hospitalRoom312: Scene = {
  id: "hospital-room-312",
  story: [
    narration("You step into Room 312."),
    thought("Still. Too still."),
  ],
  location: "Hospital",
  image: {
    day: "./images/locations/hospital/hospitalRoomDay.png",
    night: "./images/locations/hospital/hospitalRoomNight.png",
  },
  choices: [
    {
      label: "Go back to reception",
      action: "returnToHospitalReception",
      nextScene: "hospital-reception",
      timeCost: 1,
    },
  ],
};

export const busStop: Scene = {
  id: "bus-stop",
  story: [
    narration("You wait at the stop, watching the road for headlights."),
    thought("Bus ought to be along."),
  ],
  location: "Bus Stop",
  image: {
    day: "./images/Travel/busStop.png",
    night: "./images/Travel/busStopNight.png",
  },
  choices: [
    {
      label: "Leave the bus stop",
      action: "leaveBusStop",
      nextScene: "front-yard",
      timeCost: 0,
    },
  ],
};

export const ethanRoomDeskEmpty: Scene = {
  id: "ethan-room-desk-empty",
  story: [narration("The desk is clear where the cigarettes were.")],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanDeskEmptyDay.png",
    night: "./images/locations/home/ethanDeskEmptyNight.png",
    weather: rainArt("./images/locations/home/ethanDeskEmptyDay-rain.jpg"),
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "Step away from the desk",
      action: "leaveDesk",
      nextScene: "ethan-room",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// MOTEL
// ----------------------------------------

export const motel: Scene = {
  id: "motel",
  story: [
    narration("You reach the motel off the road."),
    thought("The vacancy sign buzzes through the storm. Of course it does.", { weather: STORM }),
    thought("The vacancy sign won't stay lit."),
  ],
  location: "Motel",
  image: {
    day: "./images/locations/motel/motelOutsideDay.png",
    night: "./images/locations/motel/motelOutsideNight.png",
    weather: {
      Thunderstorm: "./images/locations/motel/motelOutsideThunder.png",
    },
  },
  choices: [
    {
      label: "Go inside",
      action: "enterMotel",
      door: true,
      nextScene: "motel-inside",
      timeCost: 1,
    },
  ],
};

export const motelInside: Scene = {
  id: "motel-inside",
  story: [
    narration("You step into the motel office."),
    thought("Earl's on the desk.", { from: 480, until: 1020 }),
    thought("Nobody on the desk."),
  ],
  location: "Motel",
  image: {
    day: "./images/locations/motel/motelInsideDay.png",
    night: "./images/locations/motel/MotelInsideNight.png",
  },
  characters: [
    {
      name: "Earl",
      from: 480,
      until: 1020,
      image: "./images/locations/motel/motelInsideEarlWorking.png",
    },
  ],
  conversation: earlConversation,
  choices: [
    {
      label: "Talk to Earl",
      action: "talkToEarl",
      nextScene: "motel-inside",
      timeCost: 0,
    },
    {
      label: "Go to your room",
      action: "goToMotelRoom",
      nextScene: "motel-room-203",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveMotel",
      door: true,
      nextScene: "motel",
      timeCost: 0,
    },
  ],
};

export const motelRoom203: Scene = {
  id: "motel-room-203",
  story: [
    narration("You step into Room 203."),
    thought("Quiet. For now."),
  ],
  location: "Motel",
  image: {
    day: "./images/locations/motel/motelRoom203.png",
    night: "./images/locations/motel/motelRoom203.png",
    noNightVariant: true,
  },
  choices: [
    {
      label: "Return to reception",
      action: "returnToMotelReception",
      nextScene: "motel-inside",
      timeCost: 1,
    },
  ],
};

// ----------------------------------------
// DINER
// ----------------------------------------

export const diner: Scene = {
  id: "diner",
  story: [
    narration("You reach the diner. Neon hums over the door."),
    thought("Windows all fogged up. Can't see who's inside.", { weather: RAIN }),
    thought("The lights inside flicker every time the sky cracks.", { weather: STORM }),
    thought("I could eat."),
  ],
  location: "Diner",
  image: {
    day: "./images/locations/diner/dinerDay.png",
    night: "./images/locations/diner/dinerNight.png",
    weather: rainArt(
      "./images/locations/diner/dinerDay-rain.jpg",
      "./images/locations/diner/dinerDay-thunder.jpg",
    ),
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "Go inside",
      action: "enterDiner",
      door: true,
      nextScene: "diner-inside",
      timeCost: 1,
    },
  ],
};

export const dinerInside: Scene = {
  id: "diner-inside",
  story: [
    narration("You step into the diner. Coffee and fried food."),
    thought("Margaret's working the floor.", { from: 420, until: 900 }),
    thought("Dead in here, this hour."),
  ],
  location: "Diner",
  image: {
    day: "./images/locations/diner/dinerInsideDay.png",
    night: "./images/locations/diner/dinerInsideNight.png",
  },
  characters: [
    {
      name: "Margaret Sullivan",
      from: 420,
      until: 900,
      image: "./images/locations/diner/maragetSullivanAtWork.png",
    },
  ],
  choices: [
    {
      label: "Talk to Margaret",
      action: "talkToMargaret",
      nextScene: "diner-inside",
      timeCost: 0,
    },
    {
      label: "Look at the bulletin board",
      action: "lookAtDinerBulletin",
      nextScene: "diner-inside",
      timeCost: 0,
      hotspots: [{ left: 8, top: 18, width: 14, height: 42 }],
      closeup: {
        image: "./images/misc/EmilyMissingPoster.png",
        thought: "Emily Parker. Seventeen. October 1972. Ten years.",
        label: "Missing poster",
      },
      setsFlags: ["posterFound"],
      itemToAdd: "Missing Poster",
      questStep: "poster",
    },
    {
      label: "Go outside",
      action: "leaveDiner",
      door: true,
      nextScene: "diner",
      timeCost: 0,
    },
  ],
  conversation: margaretConversation,
};

// ----------------------------------------
// SANATORIUM
// ----------------------------------------

export const sanatorium: Scene = {
  id: "sanatorium",
  story: [
    narration("You reach the sanatorium. The building sits there, windows dark."),
    thought("I don't want to go in."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumDay.png",
    night: "./images/locations/sanatorium/sanatoriumNight.png",
  },
  choices: [
    {
      label: "Approach the entrance",
      action: "approachSanatorium",
      nextScene: "sanatorium-entrance",
      timeCost: 2,
    },
  ],
};

export const sanatoriumEntrance: Scene = {
  id: "sanatorium-entrance",
  story: [
    narration("You stop at the sanatorium entrance."),
    thought("I could still turn around."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumUpCloseDay.png",
    night: "./images/locations/sanatorium/sanatoriumUpCloseNight.png",
  },
  choices: [
    {
      label: "Go inside",
      action: "enterSanatorium",
      door: true,
      nextScene: "sanatorium-main-floor",
      timeCost: 1,
    },
    {
      label: "Return to the road",
      action: "leaveSanatoriumEntrance",
      nextScene: "sanatorium",
      timeCost: 2,
    },
  ],
};

export const sanatoriumMainFloor: Scene = {
  id: "sanatorium-main-floor",
  story: [
    narration("You step onto the main floor. Your footsteps come back at you."),
    thought("Everything's louder in here."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumMainFloorDay.png",
    night: "./images/locations/sanatorium/sanatoriumMainFloorNight.png",
  },
  choices: [
    {
      label: "Explore the hallway",
      action: "enterSanatoriumHallway",
      nextScene: "sanatorium-hallway",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveSanatorium",
      door: true,
      nextScene: "sanatorium-entrance",
      timeCost: 1,
    },
  ],
};

export const sanatoriumHallway: Scene = {
  id: "sanatorium-hallway",
  story: [
    narration("You walk the hall and stop by the doors."),
    thought("Do I really want what's behind these?"),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumHallwayDay.png",
    night: "./images/locations/sanatorium/sanatoriumHallwayNight.png",
  },
  choices: [
    {
      label: "Enter the first room",
      action: "enterSanatoriumRoom1",
      door: true,
      nextScene: "sanatorium-room-1",
      timeCost: 1,
    },
    {
      label: "Enter the second room",
      action: "enterSanatoriumRoom2",
      door: true,
      nextScene: "sanatorium-room-2",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveSanatoriumHallway",
      door: true,
      nextScene: "sanatorium-entrance",
      timeCost: 1,
    },
    {
      label: "Back to the main floor",
      action: "returnToSanatoriumMainFloor",
      nextScene: "sanatorium-main-floor",
      timeCost: 1,
    },
  ],
};

export const sanatoriumRoom1: Scene = {
  id: "sanatorium-room-1",
  story: [
    narration("You ease the first door open and step in."),
    thought("Who stayed in here? I'd rather not know."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumRoom1Day.png",
    night: "./images/locations/sanatorium/sanatoriumRoom1Night.png",
  },
  choices: [
    {
      label: "Return to the hallway",
      action: "leaveSanatoriumRoom1",
      door: true,
      nextScene: "sanatorium-hallway",
      timeCost: 1,
    },
  ],
};

export const sanatoriumRoom2: Scene = {
  id: "sanatorium-room-2",
  story: [
    narration("You step into the second room and listen past the door."),
    thought("Ash on the sill."),
    thought("Just my footsteps. I think."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumRoom2Day.png",
    night: "./images/locations/sanatorium/sanatoriumRoom2Night.png",
  },
  choices: [
    {
      label: "Look at the sill",
      action: "lookAtSanatoriumCigarette",
      nextScene: "sanatorium-room-2",
      timeCost: 0,
      closeup: {
        image: "./images/locations/sanatorium/sanatoriumRoom2NightCigarette.png",
        thought: "Still warm. Someone was just here.",
        label: "Cigarette",
      },
      setsFlags: ["sanatoriumCigaretteSeen", "chapter1Complete"],
      effects: { courage: 1 },
      completesQuest: "light-on-the-hill",
      questStep: "done",
      hotspots: [{ left: 40, top: 55, width: 18, height: 20 }],
    },
    {
      label: "Return to the hallway",
      action: "leaveSanatoriumRoom2",
      door: true,
      nextScene: "sanatorium-hallway",
      timeCost: 1,
    },
  ],
};

export function getSceneThought(
  sceneId: string,
  time: number,
  weather: Weather,
  day?: DayOfWeek,
) {
  const scene = scenes[sceneId as keyof typeof scenes];

  if (!scene) {
    return null;
  }

  // The first thought whose time, weather, and weekday match is shown, so
  // weather lines are listed before a scene's everyday thought.
  const thoughtEntry = scene.story.find(
    (entry) => entry.type === "thought" && storyEntryApplies(entry, time, weather, day),
  );

  return thoughtEntry?.type === "thought" ? thoughtEntry.text : null;
}

// ----------------------------------------
// SCENE LIST
// ----------------------------------------

export const scenes = {
  hallway,
  "hallway-upstairs": upstairsHallway,
  "hallway-upstairs-attic-open": upstairsHallwayAtticOpen,
  "made-coffee": madeCoffee,
  "front-yard": frontYard,
  "elrod-house": elrodHouse,
  "light-pole": lightPole,
  "back-yard": backYard,
  "living-room": livingRoom,
  "living-room-relaxing": livingRoomRelaxing,
  kitchen,
  fridge,
  bathroom,
  "ethan-room": ethanRoom,
  "ethan-room-desk": ethanRoomDesk,
  "ethan-room-desk-empty": ethanRoomDeskEmpty,
  "mom-room": momRoom,
  "emily-room": emilyRoom,
  attic,
  basement,
  garage,
  "garage-bench": garageBench,
  "garage-bench-empty": garageBenchEmpty,
  "needle-and-groove": needleAndGroove,
  "needle-and-groove-inside": needleAndGrooveInside,
  "needle-and-groove-backroom": needleAndGrooveBackroom,
  "gas-station": gasStation,
  "gas-station-inside": gasStationInside,
  "gas-station-garage": gasStationGarage,
  scrapyard,
  "scrapyard-inside": scrapyardInside,
  "scrapyard-desk": scrapyardDesk,
  "scrapyard-desk-empty": scrapyardDeskEmpty,
  "police-station": policeStation,
  "police-station-inside": policeStationInside,
  "sheriff-office": sheriffOffice,
  cementary,
  "cementary-inside": cementaryInside,
  "cementary-backside": cementaryBackside,
  hospital,
  "hospital-reception": hospitalReception,
  "hospital-elevator": hospitalElevator,
  "hospital-room-312": hospitalRoom312,
  "bus-stop": busStop,
  motel,
  "motel-inside": motelInside,
  "motel-room-203": motelRoom203,
  diner,
  "diner-inside": dinerInside,
  sanatorium,
  "sanatorium-entrance": sanatoriumEntrance,
  "sanatorium-main-floor": sanatoriumMainFloor,
  "sanatorium-hallway": sanatoriumHallway,
  "sanatorium-room-1": sanatoriumRoom1,
  "sanatorium-room-2": sanatoriumRoom2,
};
