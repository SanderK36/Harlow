import {
  type Conversation,
  narration,
  thought,
  npc,
  ethan,
} from "../story";
import type { Scene } from "./types";
import { rainArt, RAIN, STORM, WET } from "./weather";

// ----------------------------------------
// FRONT YARD
// ----------------------------------------

export const frontYard: Scene = {
  id: "front-yard",

  story: [
    narration("You step outside. Cold air hits your face."),
    thought("Rain's coming down sideways. Street's empty again.", {
      weather: RAIN,
    }),
    thought("Every flash, I check the end of the street.", { weather: STORM }),
    thought("Sun's out. Like nothing happened.", {
      weather: ["Sunny"],
      from: 360,
      until: 1080,
    }),
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
      label: "Go to the streets",
      action: "goToStreets",
      nextScene: "street",
      timeCost: 5,
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
        image:
          "./images/locations/sanatorium/sanatoriumFromTheStreetsNight.png",
        thought:
          "One window lit. Up on the hill. That place has been dead for years.",
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
  opening: [npc("Rachel", "Hey, Ethan. You look rough.")],
  choices: [
    {
      label: "Didn't sleep. Sirens all night.",
      response: [
        ethan("Didn't sleep. Sirens all night."),
        npc(
          "Rachel",
          "The whole street heard them. I kept waiting for somebody to say it was a mistake.",
        ),
      ],
    },
    {
      label: "You okay, Rach?",
      response: [
        ethan("You okay, Rach?"),
        npc(
          "Rachel",
          "No. She gave us butterscotch every Halloween. Remember?",
        ),
        ethan("Yeah. Every Halloween."),
      ],
    },
    {
      label: "Who'd do this to her?",
      response: [
        ethan("Who'd do this to her?"),
        npc(
          "Rachel",
          "Someone who knew the house. Tape doesn't go up that fast for strangers.",
        ),
      ],
    },
    {
      label: "This feels like Emily all over again.",
      response: [
        ethan("This feels like Emily all over again."),
        npc("Rachel", "I know. Your mom left the porch light on for a month."),
        thought("I'd forgotten about that."),
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
      label: "There was a file. PARKER, E. Still in his drawer.",
      requiresStoryFlag: "fileDrawerSeen",
      excludesStoryFlag: "rachelShutOut",
      response: [
        ethan("There was a file. PARKER, E. Still in his drawer."),
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

export const street: Scene = {
  id: "street",
  story: [
    narration("You head down the block. The houses sit in the cold, dark hush."),
    thought("The whole street looks waiting."),
    thought("That porch light at the end of the block still feels wrong.", {
      weather: RAIN,
    }),
  ],
  location: "Neighbourhood",
  image: {
    day: "./images/locations/neighbourhood/neighbourhood.png",
    night: "./images/locations/neighbourhood/neighbourhoodNight.png",
    weather: {
      Rainy: "./images/locations/neighbourhood/neighbourhoodRainy.png",
      "Heavy rain": "./images/locations/neighbourhood/neighbourhoodRainy.png",
      Thunderstorm: "./images/locations/neighbourhood/neighbourhoodThunder.png",
    },
  },
  choices: [
    {
      label: "Go back home",
      action: "goHome",
      nextScene: "front-yard",
      timeCost: 5,
    },
    {
      label: "Light pole",
      action: "lookAtLightPole",
      nextScene: "light-pole",
      timeCost: 1,
      hotspots: [{ left: 2, top: 18, width: 13, height: 70 }],
    },
    {
      label: "Elrod house",
      action: "goElrodHouse",
      nextScene: "elrod-house",
      timeCost: 10,
      hotspots: [{ left: 42, top: 45, width: 22, height: 20 }],
    },
  ],
};

export const elrodHouse: Scene = {
  id: "elrod-house",
  story: [
    narration("You stop at the Elrod house. Yellow tape across the porch."),
    // Off on every plate, including the night plate. Only the street lamp is lit.
    thought("Her porch light's off. First time in twenty years.", {
      from: 1080,
    }),
    thought("Rain's beating the tape flat. Washing the street clean.", {
      weather: WET,
    }),
    thought("Yellow tape and a dead geranium. That's all that's left of her."),
  ],
  location: "Elrod House",
  image: {
    day: "./images/locations/neighbourhood/ElrodHouse/ElrodHouseDay.png",
    night: "./images/locations/neighbourhood/ElrodHouse/ElrodHouseNight.png",
    weather: rainArt(
      "./images/locations/neighbourhood/ElrodHouse/ElrodHouseRainy.png",
      "./images/locations/neighbourhood/ElrodHouse/ElrodHouseThunder.png",
    ),
    // Both weather plates are daytime. After dark the night plate wins.
    weatherDayOnly: true,
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
        thought:
          "The police tapes reminds me of that night. Same night Emily disappeared... I remember watching the police looking for her. I remember the rain. I remember the woods. For some reason this feels exactly like that night.",
        label: "1972 memory",
        disableWeatherFilter: true,
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
    narration(
      "Three hiring flyers, curled and faded, are stapled to the light pole.",
    ),
    thought("Mom's covering everything. I need a job."),
  ],
  location: "Home front yard",
  /** The top flyer sits under a top-left caption. Keep the card on the grass. */
  captionPosition: "bottom",
  image: {
    day: "./images/locations/neighbourhood/lightPoleDay.png",
    night: "./images/locations/neighbourhood/lightPoleNight.png",
    weather: rainArt("./images/locations/neighbourhood/lightPoleRainy.png"),
    // Both weather plates are daytime. After dark the night plate wins.
    weatherDayOnly: true,
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
