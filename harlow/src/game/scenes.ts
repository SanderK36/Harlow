import type { Location, Weather } from "./types";
import type { Choice } from "./choices";

import {
  type StoryEntry,
  type Conversation,
  npc,
  ethan,
  narration,
  thought,
} from "./story";

export type SceneThought = {
  /** Show this thought only while game time is within this range (in minutes). */
  from?: number;
  until?: number;
  text: string;
};

export type SceneCharacter = {
  /** NPC overlay shown in this scene. Add their portrait path in `image`. */
  name: string;
  from?: number;
  until?: number;
  image?: string;
  /** Alternative scene artwork used when the character is present at night. */
  nightImage?: string;
};

export type Scene = {
  /**
   * Blueprint for one playable location/state.
   * To add a scene: create a Scene object, add it to `scenes` below, then point
   * another choice's `nextScene` at its id. Use image day/night paths from /public.
   */
  id: string;
  story: StoryEntry[];
  thoughts?: SceneThought[];
  location: Location;
  image: {
    day: string;
    night: string;
    weather?: Partial<Record<Weather, string>>;
  };
  choices: Choice[];
  conversation?: Conversation;
  characters?: SceneCharacter[];
};

// Destinations listed here automatically appear in the walk and bus menus.
// Add an exterior scene here after it has been added to `scenes` below.
const exteriorDestinations = [
  { id: "front-yard", label: "Home", walkMinutes: 30 },
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
      label: `Walk to ${destination.label} (${destination.walkMinutes}min)`,
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
      label: `Take the bus to ${destination.label} ($7 & 10min)`,
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
    narration("Rain ticks against the windows."),
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
      nextScene: "garage",
      timeCost: 0,
    },
    {
      label: "Go outside",
      action: "leaveHouse",
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
      nextScene: "ethan-room",
      timeCost: 0,
    },
    {
      label: "Go to Mom's room",
      action: "goMomRoom",
      nextScene: "mom-room",
      timeCost: 0,
    },
    {
      label: "Go to Emily's room",
      action: "goEmilyRoom",
      nextScene: "emily-room",
      timeCost: 0,
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
  },
  choices: [
    ...upstairsHallway.choices
      .filter((choice) => choice.action !== "openAtticHatch")
      .map((choice) =>
        choice.action === "goAttic"
          ? { ...choice, hotspots: [{ left: 55, top: 1, width: 15, height: 79 }] }
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
// LOOKING AROUND THE HOUSE
// ----------------------------------------

export const lookingAroundHouse: Scene = {
  id: "looking-around-house",

  story: [
    narration("You look through the house. Nothing's out of place."),
    thought("Too many memories in these rooms."),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/homeHallway.jpg",
    night: "./images/locations/home/homeHallway.jpg",
  },

  choices: [
    {
      label: "Make some coffee",
      action: "makeCoffee",
      nextScene: "made-coffee",
      timeCost: 10,

      effects: {
        stamina: 5,
      },
    },
    {
      label: "Go back to the hallway",
      action: "goHome",
      nextScene: "hallway",
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
  },
};

// ----------------------------------------
// FRONT YARD
// ----------------------------------------

export const frontYard: Scene = {
  id: "front-yard",

  story: [
    narration("You step outside. Cold air hits your face."),
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
      label: "Go back inside",
      action: "goHome",
      nextScene: "hallway",
      timeCost: 5,
    },
  ],
};

export const lightPole: Scene = {
  id: "light-pole",
  story: [
    narration("Three hiring flyers, curled and faded, are stapled to the light pole."),
    thought("Mom's covering everything. I need a job."),
  ],
  location: "Home front yard",
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

  story: [narration("You come around to the backyard.")],

  thoughts: [
    { until: 1080, text: "" },
    {
      from: 1080,
      text: "Out here this late, I always feel watched.",
    },
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
      nextScene: "kitchen",
      timeCost: 5,
    },
  ],
};

// ----------------------------------------
// CONVERSATIONS
// ----------------------------------------

export const momConversation: Conversation = {
  opening: [npc("Linda", "Morning, honey.")],

  choices: [
    {
      label: "Morning, Mom.",

      response: [
        ethan("Morning, Mom."),
        npc("Linda", "You look wrung out. You sleep any?"),
      ],
    },

    {
      label: "Did you sleep well?",

      response: [
        ethan("Did you sleep well?"),
        npc("Linda", "Some. Kept waking up."),
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
      response: [
        ethan("I'll find a way to help."),
        npc(
          "Linda",
          "You're a good kid. Be careful. Don't grab the first thing that pays.",
        ),
      ],
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
      label: "Never mind.",

      response: [ethan("Never mind. It was nothing."), npc("Linda", "Alright, honey.")],
      endsConversation: true,
    },
  ],
};

export const momDeathConversation: Conversation = {
  opening: [
    npc(
      "Linda",
      "Did you hear? The sheriff found Mrs. Elrod at home this morning. A few houses down. They don't know what happened.",
    ),
  ],
  choices: [
    {
      label: "They found her dead?",
      response: [
        ethan("They found her dead?"),
        npc(
          "Linda",
          "That's what he said. Asked when I last saw her. Been a few days.",
        ),
      ],
    },
    {
      label: "Did you know her well?",
      response: [
        ethan("Did you know her well?"),
        npc(
          "Linda",
          "Not really. A word or two when she got the mail.",
        ),
      ],
    },
    {
      label: "Do they know what happened?",
      response: [
        ethan("Do they know what happened?"),
        npc(
          "Linda",
          "No. They're still putting it together. I'm not going to guess.",
        ),
      ],
    },
    {
      label: "I'm sorry, Mom. That's awful.",
      response: [
        ethan("I'm sorry, Mom. That's awful."),
        npc(
          "Linda",
          "I know. She was alone in that house so much. Be careful. And let the sheriff handle it.",
        ),
      ],
      completesMomQuest: true,
    },
    {
      label: "Exit Conversation",
      response: [],
      endsConversation: true,
    },
  ],
};

export const johnnyConversation: Conversation = {
  opening: [npc("Johnny", "Hey. Looking for something?")],
  choices: [
    {
      label: "Just looking around.",
      response: [
        ethan("Yeah. Just looking around."),
        npc("Johnny", "Take your time."),
      ],
    },
    {
      label: "You own this place?",
      response: [
        ethan("You own this place?"),
        npc("Johnny", "Yeah. Few years now."),
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
      label: "Heard anything interesting?",
      requiresJob: "needle-groove",
      response: [
        ethan("Heard anything interesting?"),
        npc(
          "Johnny",
          "Always. Diner, after lunch. People talk louder than they think.",
        ),
      ],
    },
    {
      label: "Never mind.",
      response: [ethan("Never mind."), npc("Johnny", "Suit yourself.")],
      endsConversation: true,
    },
  ],
};

export const walterConversation: Conversation = {
  opening: [npc("Walter", "Something I can do for you?")],
  choices: [
    {
      label: "I'm looking for some information.",
      response: [
        ethan("I'm looking for some information."),
        npc("Walter", "Information about what?"),
      ],
    },
    {
      label: "Has anything happened around town?",
      response: [
        ethan("Has anything happened around town lately?"),
        npc("Walter", "Nothing that concerns you."),
      ],
    },
    {
      label: "Never mind.",
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
    thought("Mom's in here.", { from: 540, until: 1080 }),
    thought("Quiet again. Mom's at work.", { from: 1080 }),
  ],

  location: "Living room",
  image: {
    day: "./images/locations/home/livingRoomDay.png",
    night: "./images/locations/home/livingRoomNight.png",
  },
  characters: [
    {
      name: "Linda",
      from: 540,
      until: 1080,
      image: "./images/locations/home/LindaParkerHome.jpg",
    },
  ],

  choices: [
    {
      label: "Watch the TV",
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
      label: "Talk to mom",
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
  },

  characters: [
    {
      name: "Linda",
      from: 450,
      until: 540,
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
      label: "How's business today?",
      response: [
        ethan("How's business today?"),
        npc(
          "Margaret",
          "Slow. Coffee goes cold before anybody orders it.",
        ),
      ],
    },
    {
      label: "Anything happening around town?",
      response: [
        ethan("Anything happening around town?"),
        npc(
          "Margaret",
          "People talk. Not much of it I'd repeat.",
        ),
      ],
    },
    {
      label: "See you later.",
      response: [
        ethan("See you later."),
        npc("Margaret", "You take care now."),
      ],
    },
    {
      label: "Exit Conversation",
      response: [],
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
      label: "How's your shift going?",
      response: [
        ethan("How's your shift going?"),
        npc("Marlene", "Busy. That's all you get."),
      ],
    },
    {
      label: "Never mind.",
      response: [
        ethan("Never mind."),
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
  },

  choices: [
    {
      label: "Go to the hallway",
      action: "goHome",
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
    thought("I still don't know what happened last night."),
  ],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanRoomDay.png",
    night: "./images/locations/home/ethanRoomNight.png",
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
    returnToUpstairsHallway,
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
  },
  choices: [
    {
      label: "Pick up cigarettes",
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
  },
  choices: [returnToUpstairsHallway],
};

export const emilyRoom: Scene = {
  id: "emily-room",
  story: [
    narration("You step into Emily's room."),
    thought("Everything's right where she left it."),
  ],
  location: "Emily's room",
  image: {
    day: "./images/locations/home/sisterRoomDay.png",
    night: "./images/locations/home/sisterRoomNight.png",
  },
  choices: [returnToUpstairsHallway],
};

export const attic: Scene = {
  id: "attic",
  story: [
    narration("You climb into the attic."),
    thought("Stale air. And dust."),
  ],
  location: "Attic",
  image: {
    day: "./images/locations/home/atticDay.png",
    night: "./images/locations/home/AtticNight.png",
  },
  choices: [returnToUpstairsHallway],
};

export const basement: Scene = {
  id: "basement",
  story: [
    narration("You go down into the basement."),
    thought("Darker down here than it ought to be."),
  ],
  location: "Basement",
  image: {
    day: "./images/locations/home/basementDay.png",
    night: "./images/locations/home/basementNight.png",
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
    returnToHallway,
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
      label: "Pick up flashlight",
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
      label: "Enter the backroom",
      action: "enterNeedleAndGrooveBackroom",
      nextScene: "needle-and-groove-backroom",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveNeedleAndGroove",
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
      nextScene: "needle-and-groove-inside",
      timeCost: 0,
    },
  ],
};

// ----------------------------------------
// GAS STATION
// ----------------------------------------

export const rayConversation: Conversation = {
  opening: [npc("Ray", "Afternoon. Gas, snacks, or you just looking?")],
  choices: [
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "gas-station",
      jobOffer: "gas-station",
      response: [
        ethan("I'm looking for work."),
        npc(
          "Ray",
          "I can use somebody reliable. You're hired. Anything in the shop is half price while you work here.",
        ),
      ],
    },
    {
      label: "Just looking around.",
      response: [
        ethan("Just looking around."),
        npc("Ray", "Look all you want. Holler if you need something."),
      ],
    },
    {
      label: "Never mind.",
      response: [ethan("Never mind."), npc("Ray", "Drive safe.")],
      endsConversation: true,
    },
  ],
};

export const gasStation: Scene = {
  id: "gas-station",

  story: [
    narration("You reach the gas station."),
    thought("Quiet out here. For now."),
  ],

  location: "Gas Station",

  image: {
    day: "./images/locations/gas_station/GasStationDay.jpg",
    night: "./images/locations/gas_station/GasStationNight.jpg",
  },

  choices: [
    {
      label: "Go inside",
      action: "enterGasStation",
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
    thought("Nobody in here but the cooler.", { from: 540 }),
  ],

  location: "Gas Station Inside",

  image: {
    day: "./images/locations/gas_station/GasStationInsideDay.png",
    night: "./images/locations/gas_station/GasStationInsideNight.png",
  },

  characters: [
    {
      name: "Ray Mercer",
      from: 540,
      until: 1380,
      image: "./images/locations/gas_station/rayMercerGasStation.png",
      nightImage: "./images/locations/gas_station/rayMercerGasStationNight.png",
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
      label: "Still playing guitar?",
      response: [
        ethan("Still playing guitar, or just deafening everybody at work?"),
        npc(
          "Tommy",
          "Both. Got a new metal riff that'll wake the whole street. Come by sometime. I'll play it.",
        ),
      ],
    },
    {
      label: "When do you get off work?",
      response: [
        ethan("When do you get off work?"),
        npc(
          "Tommy",
          "Eight in the morning till five. Nine hours of engines, grease, and people yelling about the music.",
        ),
      ],
    },
    {
      label: "Things have been rough lately.",
      response: [
        ethan("Things have been rough lately. I might need your help."),
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
    },
    {
      label: "Exit Conversation",
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
      "Morning. Watch your step. This place'll bite you if you let it.",
    ),
  ],
  choices: [
    {
      label: "Busy day?",
      response: [
        ethan("Busy day?"),
        npc(
          "Big Roy",
          "Always. Scrap don't take days off. Neither does the coffee.",
        ),
      ],
    },
    {
      label: "What do you do here?",
      response: [
        ethan("What do you do here?"),
        npc(
          "Big Roy",
          "Sort the good junk from the bad. Trick is, both of 'em used to be somebody's.",
        ),
      ],
    },
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "scrapyard",
      jobOffer: "scrapyard",
      response: [
        ethan("I'm looking for work."),
        npc(
          "Big Roy",
          "Then take this crowbar. You're hired. It'll pop a stubborn lock, and it's a weapon if it comes to that.",
        ),
      ],
    },
    {
      label: "I'll let you get back to it.",
      response: [
        ethan("I'll let you get back to it."),
        npc("Big Roy", "Appreciate it, kid. Keep your eyes open out there."),
      ],
    },
    {
      label: "Exit Conversation",
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
  },
  choices: [
    {
      label: "Enter the scrapyard",
      action: "enterScrapyard",
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
  },
  characters: [
    {
      name: "Big Roy",
      from: 420,
      until: 900,
      image: "./images/locations/scrapyard/bigRoyWorking.png",
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
  },
  choices: [
    {
      label: "Go outside",
      action: "leavePoliceStation",
      nextScene: "police-station",
      timeCost: 0,
    },
    {
      label: "Go to the sheriff's office",
      action: "goToSheriffOffice",
      nextScene: "sheriff-office",
      timeCost: 2,
    },
  ],
};

export const sheriffOffice: Scene = {
  id: "sheriff-office",

  story: [
    narration("You step into the sheriff's office."),
    thought("Sheriff's in.", { from: 460, until: 960 }),
    thought("Nobody in. Just a desk full of paper.", { from: 960, until: 1080 }),
    thought("I shouldn't be in here this late.", { from: 1080 }),
  ],

  location: "Sheriff's office",

  image: {
    day: "./images/locations/police_station/walterOfficeDay.png",
    night: "./images/locations/police_station/walterOfficeNight.png",
  },

  characters: [
    {
      name: "Walter Harrington",
      from: 480,
      until: 960,
      image: "./images/locations/police_station/WalterHarringtonOffice.jpg",
    },
    {
      name: "Walter Harrington",
      from: 960,
      until: 1080,
      image: "./images/locations/police_station/walterOfficeDay.png",
    },
    {
      name: "Walter Harrington",
      from: 1080,
      image: "./images/locations/police_station/walterOfficeNight.png",
    },
  ],
  conversation: walterConversation,
  choices: [
    {
      label: "Go back to the station",
      action: "leaveSheriffOffice",
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
    thought("That gate's complaining in the wind."),
  ],
  location: "Cementary",
  image: {
    day: "./images/locations/cementary/cementaryDay.png",
    night: "./images/locations/cementary/cementaryNight.png",
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
  location: "Cementary",
  image: {
    day: "./images/locations/cementary/cementaryInsideDay.png",
    night: "./images/locations/cementary/cementaryInsideNight.png",
  },
  choices: [
    {
      label: "Walk toward the back",
      action: "goCemeteryBackside",
      nextScene: "cementary-backside",
      timeCost: 2,
    },
    {
      label: "Go back to the entrance",
      action: "leaveCemetery",
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
  location: "Cementary",
  image: {
    day: "./images/locations/cementary/cementaryBacksideDay.png",
    night: "./images/locations/cementary/cementaryBacksideNight.png",
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
    day: "./images/locations/hospital/hospitalDay.jpg",
    night: "./images/locations/hospital/hospitalNight.jpg",
  },
  choices: [
    {
      label: "Go inside",
      action: "enterHospital",
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
      label: "Just looking around.",
      response: [
        ethan("Just looking around."),
        npc("Earl", "Then look somewhere else. I've got work."),
      ],
    },
    {
      label: "Never mind.",
      response: [ethan("Never mind."), npc("Earl", "That's what I thought.")],
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
    thought("I could eat."),
  ],
  location: "Diner",
  image: {
    day: "./images/locations/diner/dinerDay.png",
    night: "./images/locations/diner/dinerNight.png",
  },
  choices: [
    {
      label: "Go inside",
      action: "enterDiner",
      nextScene: "diner-inside",
      timeCost: 1,
    },
  ],
};

export const dinerInside: Scene = {
  id: "diner-inside",
  story: [
    narration("You step into the diner. Coffee and fried food."),
    thought("Margaret's working the floor.", { from: 660, until: 900 }),
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
      from: 660,
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
      label: "Go outside",
      action: "leaveDiner",
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
      nextScene: "sanatorium-room-1",
      timeCost: 1,
    },
    {
      label: "Enter the second room",
      action: "enterSanatoriumRoom2",
      nextScene: "sanatorium-room-2",
      timeCost: 1,
    },
    {
      label: "Go outside",
      action: "leaveSanatoriumHallway",
      nextScene: "sanatorium-entrance",
      timeCost: 1,
    },
    {
      label: "Back to main floor",
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
      nextScene: "sanatorium-hallway",
      timeCost: 1,
    },
  ],
};

export const sanatoriumRoom2: Scene = {
  id: "sanatorium-room-2",
  story: [
    narration("You step into the second room and listen past the door."),
    thought("Just my footsteps. I think."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumRoom2Day.png",
    night: "./images/locations/sanatorium/sanatoriumRoom2Night.png",
  },
  choices: [
    {
      label: "Return to the hallway",
      action: "leaveSanatoriumRoom2",
      nextScene: "sanatorium-hallway",
      timeCost: 1,
    },
  ],
};

export function getSceneThought(sceneId: string, time: number) {
  const scene = scenes[sceneId as keyof typeof scenes];

  if (!scene) {
    return null;
  }

  const thoughtEntry = scene.story.find((entry) => {
    if (entry.type !== "thought") {
      return false;
    }

    const condition = entry.condition;

    if (!condition) {
      return true;
    }

    const afterStart = condition.from === undefined || time >= condition.from;

    const beforeEnd = condition.until === undefined || time < condition.until;

    return afterStart && beforeEnd;
  });

  return thoughtEntry?.type === "thought" ? thoughtEntry.text : null;
}

// ----------------------------------------
// SCENE LIST
// ----------------------------------------

export const scenes = {
  hallway,
  "hallway-upstairs": upstairsHallway,
  "hallway-upstairs-attic-open": upstairsHallwayAtticOpen,
  "looking-around-house": lookingAroundHouse,
  "made-coffee": madeCoffee,
  "front-yard": frontYard,
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
