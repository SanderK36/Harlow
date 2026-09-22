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
];

export function isExteriorScene(sceneId: string): boolean {
  // Used by the page to decide whether to show travel controls.
  return (
    sceneId === "bus-stop" ||
    exteriorDestinations.some(
      (destination) => destination.id === sceneId
    )
  );
}

export function createWalkingChoices(originId: string): Choice[] {
  // Generates choices instead of repeating travel links in every exterior scene.
  return exteriorDestinations
    .filter((destination) => destination.id !== originId)
    .map((destination) => ({
      label: `Walk to ${destination.label} (${destination.walkMinutes}min)`,
      action: `walkTo${destination.id}`,
      nextScene: destination.id,
      timeCost: destination.walkMinutes,
      travel: true,
    }));
}

export function createBusChoices(): Choice[] {
  // Bus pricing and travel time are defined here for every destination.
  return exteriorDestinations.map((destination) => ({
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
    narration(
      "The rain taps softly against the windows."
    ),
    thought(
      "I should probably get going."
    ),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/homeHallway.jpg",
    night: "./images/locations/home/homeHallway.jpg",
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

// ----------------------------------------
// LOOKING AROUND THE HOUSE
// ----------------------------------------

export const lookingAroundHouse: Scene = {
  id: "looking-around-house",

  story: [
    narration(
      "You spend some time looking around the house. Everything seems normal."
    ),
    thought(
      "A lot of memories in here..."
    ),
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
    narration(
      "You felt a bit drowsy, so you made yourself some coffee."
    ),
    thought(
      "Just what I needed."
    ),
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
    narration("You step outside into the rain. The cold air hits your face."),
    thought("It's colder than I expected."),
  ],

  location: "Home front yard",

  image: {
    day: "./images/locations/home/homeDayTime.jpg",
    night: "./images/locations/home/homeNightTime.jpg",
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
    narration("Three weathered hiring flyers are stapled to the light pole."),
    thought("I feel bad that mom is paying for everything, i need to get a job to help her"),
  ],
  location: "Home front yard",
  image: {
    day: "./images/locations/home/lightPoleDay.png",
    night: "./images/locations/home/lightPoleNight.png",
  },
  choices: [
    { label: "Read the Needle & Groove flyer", action: "chooseNeedleGrooveJob", nextScene: "light-pole", timeCost: 0 },
    { label: "Read the gas station flyer", action: "chooseGasStationJob", nextScene: "light-pole", timeCost: 0 },
    { label: "Read the scrapyard flyer", action: "chooseScrapyardJob", nextScene: "light-pole", timeCost: 0 },
    { label: "Step away from the light pole", action: "leaveLightPole", nextScene: "front-yard", timeCost: 0 },
  ],
};

// ----------------------------------------
// BACK YARD
// ----------------------------------------

export const backYard: Scene = {
  id: "back-yard",

  story: [
    narration(
      "You walk around to the backyard."
    ),
  ],
  
  thoughts: [
    { until: 1080, text: "",},
    { from: 1080, text: "I always feel like i'm being watched being out here this late...", },
  ],
  location: "Home back yard",

  image: {
    day: "./images/locations/home/homeBackyardDaytime.jpg",
    night: "./images/locations/home/homeBackyardNightTime.jpg",
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
  opening: [
    npc(
      "Linda",
      "Morning, honey."
    ),
  ],

  choices: [
    {
      label: "Morning, Mom.",

      response: [
        ethan("Morning, Mom."),
        npc(
          "Linda",
          "You look tired. Did you sleep alright?"
        ),
      ],
    },

    {
      label: "Did you sleep well?",

      response: [
        ethan(
          "Did you sleep well?"
        ),
        npc(
          "Linda",
          "I slept alright. Just a little restless."
        ),
      ],
    },

    {
      label: "I'm heading out.",

      response: [
        ethan(
          "I'm heading out."
        ),
        npc(
          "Linda",
          "Alright, honey. Be careful out there."
        ),
      ],

      endsConversation: true,
    },

    {
      label: "Nevermind.",

      response: [
        ethan(
          "Nevermind. It was nothing."
        ),
        npc(
          "Linda",
          "Alright."
        ),
      ],

      endsConversation: true,
    },
  ],
};

export const johnnyConversation: Conversation = {
  opening: [
    npc(
      "Johnny",
      "Hey. Looking for something?"
    ),
  ],
  choices: [
    {
      label: "Just browsing.",
      response: [
        ethan("Yeah. Just looking around."),
        npc(
          "Johnny",
          "Take your time."
        ),
      ],
    },
    {
      label: "Do you own this place?",
      response: [
        ethan("You own the shop?"),
        npc(
          "Johnny",
          "Sure do. Been running it for a few years now."
        ),
      ],
    },
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "needle-groove",
      jobOffer: "needle-groove",
      response: [
        ethan("I'm looking for work."),
        npc("Johnny", "I can use a hand with stock and the counter. Welcome aboard—stick close and you'll hear plenty about this town."),
      ],
      endsConversation: true,
    },
    {
      label: "Heard anything interesting?",
      requiresJob: "needle-groove",
      response: [
        ethan("Heard anything interesting?"),
        npc("Johnny", "Always. Start with the diner after lunch—people there talk louder than they think."),
      ],
    },
    {
      label: "Nevermind.",
      response: [
        ethan("Nevermind."),
        npc(
          "Johnny",
          "Alright."
        ),
      ],
      endsConversation: true,
    },
  ],
};

export const walterConversation: Conversation = {
  opening: [
    npc(
      "Walter",
      "Can I help you?"
    ),
  ],
  choices: [
    {
      label: "I'm looking for some information.",
      response: [
        ethan(
          "I'm looking for some information."
        ),
        npc(
          "Walter",
          "What kind of information?"
        ),
      ],
    },
    {
      label: "Has anything happened around town?",
      response: [
        ethan(
          "Has anything happened around town lately?"
        ),
        npc(
          "Walter",
          "Nothing you need to concern yourself with."
        ),
      ],
    },
    {
      label: "Nevermind.",
      response: [
        ethan("Nevermind."),
        npc(
          "Walter",
          "Alright."
        ),
      ],
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
    thought("Mom is here.", { until: 1080 }),
    thought("It's quiet in here when Mom's at work.", { from: 1080 })
  ],

  location: "Living room",
  image: {
    day: "./images/locations/home/LindaParkerHome.jpg",
    night: "./images/locations/home/livingRoomNight.png",
  },

  choices: [
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
    {
      label: "Go to the bathroom",
      action: "goBathroom",
      nextScene: "bathroom",
      timeCost: 0,
    },
    {
      label: "Go outside",
      action: "leaveHouse",
      nextScene: "front-yard",
      timeCost: 5,
    },
  ],

  conversation: momConversation,
};

export const livingRoomRelaxing: Scene = {
  id: "living-room-relaxing",
  story: [
    narration("You sink into the couch and let the noise of the day fade away."),
    thought("I needed that."),
  ],
  location: "Living room",
  image: {
    day: "./images/characters/EthanParker/EthanRelaxing.png",
    night: "./images/characters/EthanParker/EthanRelaxing.png",
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
    narration(
      "You step into the kitchen."
    ),
    thought(
      "The house is quiet."
    ),
  ],

  location: "Home",

  image: {
    day: "./images/locations/home/kitchenDay.png",
    night: "./images/locations/home/kitchenNight.png",
  },

  choices: [
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
    {
      label: "Go to the bathroom",
      action: "goBathroom",
      nextScene: "bathroom",
      timeCost: 0,
    },
  ],
};

export const margaretConversation: Conversation = {
  opening: [
    npc("Margaret", "Take a seat anywhere you like, hon."),
  ],
  choices: [
    {
      label: "How's business today?",
      response: [
        ethan("How's business today?"),
        npc("Margaret", "Quiet so far. That usually means the coffee gets cold before it gets poured."),
      ],
    },
    {
      label: "Anything happening around town?",
      response: [
        ethan("Anything happening around town?"),
        npc("Margaret", "Folks have been talking, but nobody's saying much worth repeating."),
      ],
    },
    {
      label: "See you later.",
      response: [
        ethan("See you later."),
        npc("Margaret", "You take care now."),
      ],
      endsConversation: true,
    },
  ],
};

export const marleneConversation: Conversation = {
  opening: [
    npc("Marlene", "Ethan. Make it quick, I'm in the middle of a shift."),
  ],
  choices: [
    {
      label: "How's your shift going?",
      response: [
        ethan("How's your shift going?"),
        npc("Marlene", "Busy enough. That's all you need to know."),
      ],
    },
    {
      label: "Nevermind.",
      response: [
        ethan("Nevermind."),
        npc("Marlene", "Fine. Try not to make more work for me."),
      ],
      endsConversation: true,
    },
  ],
};

export const fridge: Scene = {
  id: "fridge",
  story: [
    narration("You open the fridge. A few bottles are still cold."),
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
    narration(
      "You step into the bathroom."
    ),
    thought(
      "Nothing unusual."
    ),
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
      label: "Go outside",
      action: "leaveHouse",
      nextScene: "front-yard",
      timeCost: 5,
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

export const ethanRoom: Scene = {
  id: "ethan-room",
  story: [
    narration("You step into your room."),
    thought("I should keep this place organized."),
  ],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanRoomDay.png",
    night: "./images/locations/home/ethanRoomNight.png",
  },
  choices: [
    {
      label: "Look at your desk",
      action: "lookAtDesk",
      nextScene: "ethan-room-desk",
      timeCost: 0,
    },
    returnToHallway,
  ],
};

export const ethanRoomDesk: Scene = {
  id: "ethan-room-desk",
  story: [
    narration("You look over the clutter on your desk."),
    thought("I left a pack of cigarettes here."),
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
    narration("You enter Mom's room."),
    thought("It feels strange being in here."),
  ],
  location: "Mom's room",
  image: {
    day: "./images/locations/home/motherRoomDay.png",
    night: "./images/locations/home/MotherRoomNight.png",
  },
  choices: [returnToHallway],
};

export const emilyRoom: Scene = {
  id: "emily-room",
  story: [
    narration("You enter Emily's room."),
    thought("Everything is exactly where she left it."),
  ],
  location: "Emily's room",
  image: {
    day: "./images/locations/home/sisterRoomDay.png",
    night: "./images/locations/home/sisterRoomNight.png",
  },
  choices: [returnToHallway],
};

export const attic: Scene = {
  id: "attic",
  story: [
    narration("You climb up into the attic."),
    thought("The air is stale up here."),
  ],
  location: "Attic",
  image: {
    day: "./images/locations/home/atticDay.png",
    night: "./images/locations/home/AtticNight.png",
  },
  choices: [returnToHallway],
};

export const basement: Scene = {
  id: "basement",
  story: [
    narration("You head down into the basement."),
    thought("It's darker down here than it should be."),
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
    narration("You walk into the garage."),
    thought("It smells like oil and old wood."),
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
    narration("The workbench is covered in old tools and loose bolts."),
    thought("A flashlight is sitting near the edge."),
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
    narration("The workbench is still cluttered, but the flashlight is gone."),
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
    narration("You make your way to Needle & Groove."),
    thought("The record store is just down the street."),
  ],
  location: "Needle & Groove",
  image: {
    day: "./images/locations/NeedleGroove/vinylShopDay.jpg",
    night: "./images/locations/NeedleGroove/vinylShopNight.jpg",
    weather: {
      "Rainy": "./images/locations/NeedleGroove/vinylShopRainy.png",
      "Heavy rain": "./images/locations/NeedleGroove/vinylShopRainy.png",
      "Thunderstorm": "./images/locations/NeedleGroove/vinylShopRainy.png",
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
    thought("The smell of old records fills the shop."),
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
    narration("You step into the backroom."),
    thought("Boxes of records are stacked against the walls."),
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
  opening: [npc("Ray", "Afternoon. Need fuel, snacks, or a little advice?")],
  choices: [
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "gas-station",
      jobOffer: "gas-station",
      response: [
        ethan("I'm looking for work."),
        npc("Ray", "I could use reliable help. You're hired—and anything from the shop is half price while you're with us."),
      ],
      endsConversation: true,
    },
    {
      label: "Just looking around.",
      response: [ethan("Just looking around."), npc("Ray", "No rush. Let me know if you need anything.")],
    },
    {
      label: "Never mind.",
      response: [ethan("Never mind."), npc("Ray", "Take care.")],
      endsConversation: true,
    },
  ],
};

export const gasStation: Scene = {
  id: "gas-station",

  story: [
    narration(
      "You make your way to the gas station."
    ),
    thought(
      "The place looks quiet."
    ),
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
  ],
};

export const gasStationInside: Scene = {
  id: "gas-station-inside",

  story: [
    narration("You step inside the gas station."),
    thought("Ray is here", { from: 540, until: 1380 }),
    thought("It's quiet in here.", { from: 540 })
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
// SCRAPYARD
// ----------------------------------------

export const bigRoyConversation: Conversation = {
  opening: [
    npc("Big Roy", "Morning! Watch your step—this place bites, but only if you look tasty."),
  ],
  choices: [
    {
      label: "Busy day?",
      response: [
        ethan("Busy day?"),
        npc("Big Roy", "Always. Metal never takes a day off, and neither does my coffee cup."),
      ],
    },
    {
      label: "What do you do here?",
      response: [
        ethan("What do you do here?"),
        npc("Big Roy", "I sort the good junk from the bad junk. The trick is knowing they're both somebody's treasure."),
      ],
    },
    {
      label: "I'm looking for work.",
      requiresNoJob: true,
      requiresJobQuestTarget: "scrapyard",
      jobOffer: "scrapyard",
      response: [
        ethan("I'm looking for work."),
        npc("Big Roy", "Then grab this crowbar and welcome aboard! It'll open stubborn locks, and it's a fine argument in a pinch."),
      ],
      endsConversation: true,
    },
    {
      label: "I'll let you get back to it.",
      response: [
        ethan("I'll let you get back to it."),
        npc("Big Roy", "Much appreciated, kid. Stay shiny out there!"),
      ],
      endsConversation: true,
    },
  ],
};

export const scrapyard: Scene = {
  id: "scrapyard",
  story: [
    narration("You arrive at the scrapyard on the edge of town."),
    thought("The piles of rusted metal seem to go on forever."),
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
    narration("You step between the wrecked cars and twisted sheets of metal."),
    thought("Big Roy is sorting through a stack of old parts.", { from: 420, until: 900 }),
    thought("Every sound carries farther than it should."),
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
    narration("An old desk sits beneath a cracked window."),
    thought("Someone left a knife here."),
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
  story: [
    narration("The desk is bare now."),
  ],
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
    narration("You arrive at the police station."),
    thought("There are a few cars parked outside."),
  ],
  location: "Police Station",
  image: {
    day: "./images/locations/police_station/police_station_day.jpg",
    night: "./images/locations/police_station/police_station_night.jpg",
    weather: {
      "Rainy": "./images/locations/police_station/policeStationOutsideRainy.png",
      "Heavy rain": "./images/locations/police_station/policeStationOutsideRainy.png",
      "Thunderstorm": "./images/locations/police_station/policeStationOutsideRainy.png",
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
    thought("The station is quieter than you expected."),
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
    thought("The Sheriff is here.", { from: 460, until: 960 }),
    thought("No one is here at the moment.", { from: 960, until: 1080 }),
    thought("I shouldn't be here this late.", { from: 1080}),
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
      image: "./images/locations/police_station/WalterHarringtonOffice.jpg"
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
    narration("You arrive at the cemetery."),
    thought("The gate creaks softly in the wind."),
  ],
  location: "Cementary",
  image: {
    day: "./images/locations/cementary/cementaryDay.png",
    night: "./images/locations/cementary/cementaryNight.png",
    weather: {
      "Rainy": "./images/locations/Cementary/cementaryRain.png",
      "Heavy rain": "./images/locations/Cementary/cementaryRain.png",
      "Thunderstorm": "./images/locations/Cementary/cementaryLightning.png",
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
    narration("You walk between the old headstones."),
    thought("It is quieter here than anywhere else in town."),
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
    narration("You reach the back of the cemetery."),
    thought("Something about this place makes you uneasy."),
  ],
  location: "Cementary",
  image: {
    day: "./images/locations/cementary/cementaryBacksideDay.png",
    night: "./images/locations/cementary/cementaryBacksideNight.png",
    weather: {
      "Rainy": "./images/locations/Cementary/cementaryBacksideRain.png",
      "Heavy rain": "./images/locations/Cementary/cementaryBacksideRain.png",
      "Thunderstorm": "./images/locations/Cementary/cementaryBacksideLightning.png",
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
    narration("You arrive at the hospital."),
    thought("The building is quiet."),
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
    thought("The smell of disinfectant hangs in the air."),
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
    npc("Earl", "Yeah? You need a room, or are you just blocking my counter?"),
  ],
  choices: [
    {
      label: "Just looking around.",
      response: [
        ethan("Just looking around."),
        npc("Earl", "Then look with your feet. I've got work to do."),
      ],
    },
    {
      label: "Nevermind.",
      response: [
        ethan("Nevermind."),
        npc("Earl", "That's what I thought."),
      ],
      endsConversation: true,
    },
  ],
};

export const hospitalElevator: Scene = {
  id: "hospital-elevator",
  story: [
    narration("You wait by the hospital elevator."),
    thought("The doors stand quietly at the end of the corridor."),
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
    thought("The room is still and quiet."),
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
    narration("You wait at the bus stop, watching the road for headlights."),
    thought("The next bus should be here soon."),
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
  story: [
    narration("You pick up the pack of cigarettes from your desk."),
  ],
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
    narration("You arrive at the roadside motel."),
    thought("The vacancy sign flickers above the office."),
  ],
  location: "Motel",
  image: {
    day: "./images/locations/motel/motelOutsideDay.png",
    night: "./images/locations/motel/motelOutsideNight.png",
    weather: {
      "Thunderstorm": "./images/locations/motel/motelOutsideThunder.png",
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
    narration("You step into the motel reception."),
    thought("Earl is working the front desk.", { from: 480, until: 1020 }),
    thought("The front desk is unattended."),
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
    thought("For the moment, it is quiet."),
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
    narration("You arrive at the diner. The neon sign hums above the door."),
    thought("A warm meal sounds good right now."),
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
    narration("You step into the diner. The air smells of coffee and fried food."),
    thought("Margaret is working the floor.", { from: 660, until: 900 }),
    thought("The diner is quiet at this hour."),
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

export function getSceneThought(
  sceneId: string,
  time: number
) {
  const scene =
    scenes[
      sceneId as keyof typeof scenes
    ];

  if (!scene) {
    return null;
  }

  const thoughtEntry =
    scene.story.find(
      (entry) => {
        if (entry.type !== "thought") {
          return false;
        }

        const condition =
          entry.condition;

        if (!condition) {
          return true;
        }

        const afterStart =
          condition.from === undefined ||
          time >= condition.from;

        const beforeEnd =
          condition.until === undefined ||
          time < condition.until;

        return afterStart && beforeEnd;
      }
    );

  return thoughtEntry?.type === "thought"
    ? thoughtEntry.text
    : null;
}

// ----------------------------------------
// SCENE LIST
// ----------------------------------------

export const scenes = {
  hallway,
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
};
