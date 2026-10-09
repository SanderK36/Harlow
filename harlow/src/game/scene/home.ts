import {
  type Conversation,
  narration,
  thought,
  npc,
  ethan,
} from "../story";
import type { Scene } from "./types";
import { rainArt, RAIN, STORM, WET, DRY, HEAVY, WEEKDAYS, WEEKEND } from "./weather";

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
  story: [narration("You take the stairs."), thought("Quiet up here.")],
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
    weather: rainArt(
      "./images/locations/home/homeHallwayUpstairsDayAtticStairs-rain.jpg",
    ),
    weatherDayOnly: true,
  },
  choices: [
    ...upstairsHallway.choices
      .filter((choice) => choice.action !== "openAtticHatch")
      .map((choice) =>
        choice.action === "goMomRoom"
          ? // The lowered ladder sits just right of Mom's door here.
            {
              ...choice,
              hotspots: [{ left: 44, top: 21, width: 10.5, height: 39 }],
            }
          : choice.action === "goEmilyRoom"
            ? // Emily's door is behind the ladder; it stays a button below.
              { ...choice, hotspots: undefined }
            : choice,
      ),
    {
      label: "Go to the attic",
      action: "goAttic",
      nextScene: "attic",
      timeCost: 0,
      hotspots: [{ left: 55, top: 1, width: 15, height: 79 }],
    },
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
// CONVERSATIONS
// ----------------------------------------

export const momConversation: Conversation = {
  opening: [npc("Linda", "Hey, honey.")],

  choices: [
    {
      label: "Hey, Mom.",

      response: [ethan("Hey, Mom."), npc("Linda", "You look wrung out.")],
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
          "We're out of coffee. Run down to Margaret's for me. Tell her to put it on my tab and I'll pay her next time i'm there.",
        ),
        ethan("Sure mom, I'll get it for you."),
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
      requiresStoryFlag: "posterFound",
      excludesStoryFlag: "coffeeDelivered",
      response: [ethan("Got your coffee."), npc("Linda", "Thanks, honey.")],
      storyFlag: "coffeeDelivered",
      removesItem: "Coffee",
    },
    {
      label: "Got your coffee.",
      requiresItem: "Coffee",
      excludesStoryFlag: ["coffeeDelivered", "posterFound"],
      response: [
        ethan("Got your coffee."),
        npc("Linda", "Thanks, honey. Did Margaret ever take that old board down?"),
        ethan("Don't think so."),
        npc("Linda", "No. She wouldn't."),
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

      response: [
        ethan("I'll leave you to it."),
        npc("Linda", "Alright, honey."),
      ],
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
      label: "It's true. Walter wouldn't tell me anything else.",
      response: [
        ethan("It's true. Walter wouldn't tell me anything else."),
        npc("Linda", "He asked me when I last saw her. It was a few days ago."),
      ],
    },
    {
      label: "Did you know her well?",
      response: [
        ethan("Did you know her well?"),
        npc("Linda", "Not really. A word or two when she got the mail."),
      ],
    },
    {
      label: "Do they know who did it?",
      response: [
        ethan("Do they know who did it?"),
        npc(
          "Linda",
          "No. They're still putting it together. I'm not going to guess.",
        ),
      ],
    },
    {
      label: "I can't believe it.",
      response: [
        ethan("I can't believe it."),
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
    thought(
      "I keep seeing him. Standing in the street like he belonged there.",
    ),
  ],
  location: "Ethan's room",
  image: {
    day: "./images/locations/home/ethanRoomDay.png",
    night: "./images/locations/home/ethanRoomNight.png",
    weather: rainArt("./images/locations/home/ethanRoomRainy.png"),
    weatherDayOnly: true,
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
      closeup: {
        image: "./images/locations/home/ethanDeskDay.png",
        video: "./images/animations/grabbingSmokePack.mp4",
        thought: "",
        label: "Picking up the cigarettes",
      },
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
    thought("Rain on her window. She always liked that sound.", {
      weather: RAIN,
    }),
    thought(
      "She used to count the seconds between the flash and the thunder.",
      { weather: STORM },
    ),
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
  captionPosition: "bottom",
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
  captionPosition: "bottom",
  story: [narration("You step into the garage."), thought("Oil and old wood.")],
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
  story: [narration("The bench is still a mess. The flashlight is gone.")],
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
