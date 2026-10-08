import {
  type Conversation,
  narration,
  thought,
  npc,
  ethan,
} from "../story";
import type { Scene } from "./types";
import { rainArt, RAIN, STORM } from "./weather";

export const johnnyConversation: Conversation = {
  opening: [npc("Johnny", "Hey. Looking for something?")],
  jobOpening: {
    job: "needle-groove",
    opening: [
      npc("Johnny", "Hey, new guy. These records won't shelve themselves."),
    ],
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
  captionPosition: "bottom",
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
          "I can use somebody reliable. You're hired. Anything in the shop is half-price while you work here.",
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
    weather: rainArt(
      "./images/locations/gas_station/GasStationInsideRainy.png",
    ),
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
        npc("Tommy", "Yeah. This engine won't fix itself. Later, man."),
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
    thought("Tommy's working. Leather jacket by the radio, metal blasting.", {
      from: 480,
      until: 1020,
    }),
    thought("Tommy's off. Too quiet without that radio."),
  ],
  location: "Gas Station Garage",
  image: {
    day: "./images/locations/gas_station/gasStationGarageDay.png",
    night: "./images/locations/gas_station/gasStationGarageNight.png",
    weather: rainArt(
      "./images/locations/gas_station/gasStationGarageRainy.png",
    ),
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
