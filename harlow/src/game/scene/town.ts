import {
  type Conversation,
  narration,
  thought,
  npc,
  ethan,
} from "../story";
import type { Scene } from "./types";
import { rainArt, RAIN, STORM } from "./weather";

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
      trust: { person: "walter", amount: -1 },
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
      trust: { person: "walter", amount: 0 },
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
        ethan("I saw someone last night. Down by the end of the street. In a hood."),
        npc("Walter", "A man in a hood? Ethan, there were a lot of people out last night. Could've been anybody."),
        ethan("No. He wasn't just passing by. He was standing there, watching the house."),
        npc("Walter", "You sure he was watching the house, or did he just happen to be looking that way?"),
        ethan("He looked right at me."),
        npc("Walter", "You see his face? Hear him say anything?"),
        ethan("No. It was too dark. I looked away for a second and he was gone."),
        npc("Walter", "So you don't know who it was, or where he went."),
        ethan("No. But I know what I saw."),
        npc("Walter", "Have you told anyone else about this?"),
        ethan("No."),
        npc("Walter", "Good. Don't go looking for him. Go home, Ethan."),
      ],
      storyFlag: "walterStationTalk",
      trust: { person: "walter", amount: 1 },
      completesQuest: "down-to-the-station",
      questStep: "done",
      startsQuest: "what-walter-said",
      leadQuest: "what-walter-said",
      closeup: {
        image: "./images/locations/policeStation/filingCabinetOpen.png",
        thought: "PARKER, E. — 1972. Closed ten years. Still in his drawer.",
        label: "Open filing drawer",
        setsFlags: ["fileDrawerSeen"],
        next: {
          image: "./images/locations/policeStation/filingCabinetClosed.png",
          thought: "He shut it with his boot. Like it was nothing.",
          label: "Closed filing drawer",
        },
      },
    },
    {
      label: "...Fine",
      requiresChoice: "I saw someone last night. End of the street. In a hood.",
      response: [ethan("...Fine")],
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

export const margaretConversation: Conversation = {
  opening: [
    npc(
      "Margaret",
      "Ethan, there you are. Sit wherever you like, honey. It's quiet enough that I can keep an eye on you.",
    ),
  ],
  choices: [
    {
      label: "Mom sent me for coffee. She said to put it on her tab.",
      requiresStoryFlag: "coffeeErrandHeard",
      excludesItem: "Coffee",
      excludesStoryFlag: "coffeeDelivered",
      response: [
        ethan("Mom sent me for coffee. She said to put it on her tab."),
        npc(
          "Margaret",
          "Of course she did. Your mother has a talent for remembering coffee only after the last drop is gone.",
        ),
        ethan("She said she'd settle up next time she comes in."),
        npc("Margaret", "I know where to find her. Give me a minute and I'll have it wrapped up."),
      ],
      givesItem: "Coffee",
      questStep: "coffee",
    },
    {
      label: "Thanks. It looks quiet today.",
      response: [
        ethan("Thanks. It looks quiet today."),
        npc(
          "Margaret",
          "Quiet enough to hear the refrigerator complain. Most folks are staying home with this weather.",
        ),
        ethan("Probably not the worst day for that."),
        npc("Margaret", "Maybe not. But a diner feels wrong when nobody's in it."),
      ],
    },
    {
      label: "Coffee.",
      repeatable: true,
      price: 1,
      freeWhen: { person: "margaret", min: 2 },
      trust: { person: "margaret", amount: 1, oncePerDay: true },
      response: [ethan("Coffee.")],
    },
    {
      label: "Have people been talking about Mrs. Elrod?",
      response: [
        ethan("Have people been talking about Mrs. Elrod?"),
        npc(
          "Margaret",
          "They have. Half the town is whispering, and the other half is pretending it hasn't heard anything.",
        ),
        ethan("Did you hear something useful?"),
        npc(
          "Margaret",
          "Nothing I'd call useful. Just frightened people filling in the blanks with whatever scares them most.",
        ),
      ],
    },
    {
      label: "That poster on the board. Emily Parker.",
      requiresStoryFlag: "posterFound",
      response: [
        ethan("That poster on the board. Emily Parker. It's been there all this time?"),
        npc(
          "Margaret",
          "I know, honey. Nobody ever had the heart to take it down, and after a while taking it down felt worse.",
        ),
        ethan("Did you know her?"),
        npc(
          "Margaret",
          "Only enough to remember her coming in with her friends. She was just a kid. That's what stays with you.",
        ),
      ],
    },
    {
      label: "Can't stay. Catch you later.",
      response: [
        ethan("Can't stay. Catch you later."),
        npc("Margaret", "Take care, Ethan. And tell Linda I'll put her coffee aside if she comes by."),
      ],
      endsConversation: true,
    },
  ],
};

export const marleneConversation: Conversation = {
  opening: [npc("Marlene", "Ethan. Make it quick. I'm on a shift.")],
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
    day: "./images/locations/policeStation/policeStationDay.jpg",
    night: "./images/locations/policeStation/policeStationNight.jpg",
    weather: {
      Rainy: "./images/locations/policeStation/policeStationOutsideRainy.png",
      "Heavy rain":
        "./images/locations/policeStation/policeStationOutsideRainy.png",
      Thunderstorm:
        "./images/locations/policeStation/policeStationOutsideRainy.png",
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
  captionPosition: "bottom",
  story: [
    narration("You step inside the police station."),
    thought("Quieter than I figured a station would be."),
  ],
  location: "Police Station Inside",
  image: {
    day: "./images/locations/policeStation/policeStationInsideDay.png",
    night: "./images/locations/policeStation/policeStationInsideNight.png",
    weather: rainArt(
      "./images/locations/policeStation/policeStationInsideRainy.png",
    ),
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
    thought("Nobody in. Just a desk full of paper.", {
      from: 960,
      until: 1080,
    }),
    thought("I shouldn't be in here this late.", { from: 1080 }),
  ],

  location: "Sheriff's office",

  image: {
    day: "./images/locations/policeStation/walterOfficeDay.png",
    night: "./images/locations/policeStation/walterOfficeNight.png",
    weather: {
      Rainy: "./images/locations/policeStation/walterOfficeRain.png",
      "Heavy rain": "./images/locations/policeStation/walterOfficeRain.png",
      Thunderstorm: "./images/locations/policeStation/walterOfficeRain.png",
    },
    weatherDayOnly: true,
  },

  characters: [
    {
      name: "Walter Harrington",
      from: 480,
      until: 960,
      image: "./images/locations/policeStation/walterHarringtonOffice.jpg",
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
    {
      // Spare plate emilyFolderOnDeskOpen.png stays in this folder, unused.
      label: "Folder",
      action: "lookAtEmilyFolder",
      nextScene: "sheriff-office",
      timeCost: 0,
      hotspots: [{ left: 35, top: 44, width: 30, height: 32 }],
      closeup: {
        image: "./images/locations/policeStation/emilyFolderOnDeskClosedUpClose.png",
        thought: "He'd kill me if he walked in right now.",
        label: "Closed file",
        next: {
          image: "./images/locations/policeStation/emilyFolderOnDeskOpenUpClose.png",
          thought: "PARKER, E. He had it out.",
          label: "Open file",
          setsFlags: ["emilyFileOpened"],
        },
      },
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
    thought("Lightning over a graveyard. Real subtle, Harlow.", {
      weather: STORM,
    }),
    thought("That gate's complaining in the wind."),
  ],
  location: "Cemetery",
  image: {
    day: "./images/locations/cemetery/cemeteryDay.png",
    night: "./images/locations/cemetery/cemeteryNight.png",
    weather: {
      Rainy: "./images/locations/cemetery/cemeteryRain.png",
      "Heavy rain": "./images/locations/cemetery/cemeteryRain.png",
      Thunderstorm: "./images/locations/cemetery/cemeteryLightning.png",
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

export const walterAtStoneConversation: Conversation = {
  opening: [
    ethan("Didn't know you came here."),
    npc("Walter", "Every Sunday. Somebody should."),
  ],
  choices: [
    {
      label: "Listen.",
      requiresTrust: { person: "walter", min: 2 },
      response: [
        npc("Walter", "Your dad would've looked harder. I should've–"),
        npc("Walter", "Go home, kid. Please."),
      ],
      storyFlag: ["everySundayHeard", "oldFriendsDone"],
      completesQuest: "old-friends",
      questStep: "done",
      endsConversation: true,
    },
    {
      label: "Listen.",
      requiresTrust: { person: "walter", min: 1, max: 1 },
      response: [
        npc("Walter", "She used to wave at my cruiser. Every time."),
        npc("Walter", "Some things don't stay closed, Ethan."),
      ],
      storyFlag: ["everySundayHeard", "oldFriendsDone"],
      completesQuest: "old-friends",
      questStep: "done",
      endsConversation: true,
    },
    {
      label: "Listen.",
      requiresTrust: { person: "walter", min: 0, max: 0 },
      response: [
        npc("Walter", "Just paying respects. That allowed?"),
      ],
      storyFlag: ["everySundayHeard", "oldFriendsDone"],
      completesQuest: "old-friends",
      questStep: "done",
      endsConversation: true,
    },
    {
      label: "Listen.",
      requiresTrust: { person: "walter", max: -1 },
      response: [
        npc("Walter", "Go home, kid."),
      ],
      storyFlag: ["everySundayHeard", "oldFriendsDone"],
      completesQuest: "old-friends",
      questStep: "done",
      endsConversation: true,
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
    day: "./images/locations/cemetery/cemeteryInsideDay.png",
    night: "./images/locations/cemetery/cemeteryInsideNight.png",
  },
  characters: [
    {
      name: "Walter Harrington",
      from: 14 * 60,
      until: 17 * 60,
      minDay: 3,
      requiresFlags: ["waltParkerLinked"],
      excludesFlags: ["oldFriendsDone"],
    },
  ],
  conversation: walterAtStoneConversation,
  choices: [
    {
      label: "Talk to Walter",
      action: "talkToWalterAtStone",
      nextScene: "cementary-inside",
      timeCost: 0,
    },
    {
      label: "Emily's stone",
      action: "lookAtEmilyStone",
      nextScene: "cementary-inside",
      timeCost: 0,
      closeup: {
        image: "./images/locations/cemetery/cemeteryInsideDay.png",
        thought: "No second date. Mom wouldn't let them carve one.",
        label: "Emily's stone",
        next: {
          image: "./images/locations/cemetery/cemeteryInsideDay.png",
          thought: "Fresh. Somebody was here today.",
          label: "Fresh flowers",
          setsFlags: ["freshFlowersSeen", "emilyStoneSeen"],
        },
      },
      completesQuest: "emilys-stone",
      questStep: "done",
    },
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
    day: "./images/locations/cemetery/cemeteryBacksideDay.png",
    night: "./images/locations/cemetery/cemeteryBacksideNight.png",
    weather: {
      Rainy: "./images/locations/cemetery/cemeteryBacksideRain.png",
      "Heavy rain": "./images/locations/cemetery/cemeteryBacksideRain.png",
      Thunderstorm:
        "./images/locations/cemetery/cemeteryBacksideLightning.png",
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
    day: "./images/locations/hospital/hospitalDay.jpg",
    night: "./images/locations/hospital/hospitalNight.jpg",
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
  opening: [npc("Earl", "You need a room, or are you just in my way?")],
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
      response: [
        ethan("No room. I'll get out of your way."),
        npc("Earl", "That's what I thought."),
      ],
      endsConversation: true,
    },
    {
      label: "Show him the boot print.",
      requiresAnyClue: ["boot-print", "man-in-a-hood"],
      excludesStoryFlag: "room6Heard",
      response: [
        npc("Earl", "Fella checked in Friday. Paid cash, no name I'd believe. Boots caked in mud. Tracked it all over my carpet."),
        ethan("Which room?"),
        npc("Earl", "Six. Don't knock. He doesn't like it."),
      ],
      storyFlag: "room6Heard",
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
  story: [narration("You step into Room 312."), thought("Still. Too still.")],
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
    day: "./images/travel/busStop.png",
    night: "./images/travel/busStopNight.png",
    weather: rainArt(
      "./images/travel/busStopRain.png",
      "./images/travel/busStopThunder.png",
    ),
    // Both weather plates are daytime. After dark the night plate wins,
    // and the interim filter carries the rain.
    weatherDayOnly: true,
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

// ----------------------------------------
// MOTEL
// ----------------------------------------

export const motel: Scene = {
  id: "motel",
  story: [
    narration("You reach the motel off the road."),
    thought("The vacancy sign buzzes through the storm. Of course it does.", {
      weather: STORM,
    }),
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
  captionPosition: "bottom",
  story: [
    narration("You step into the motel office."),
    thought("Earl's on the desk.", { from: 480, until: 1020 }),
    thought("Nobody on the desk."),
  ],
  location: "Motel",
  image: {
    day: "./images/locations/motel/motelInsideDay.png",
    night: "./images/locations/motel/motelInsideNight.png",
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
      label: "Room 6",
      action: "lookAtRoom6",
      nextScene: "motel-inside",
      timeCost: 0,
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
  story: [narration("You step into Room 203."), thought("Quiet. For now.")],
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
    thought("Windows all fogged up. Can't see who's inside.", {
      weather: RAIN,
    }),
    thought("The lights inside flicker every time the sky cracks.", {
      weather: STORM,
    }),
    thought("I could eat."),
  ],
  location: "Diner",
  image: {
    day: "./images/locations/diner/dinerDay.png",
    night: "./images/locations/diner/dinerNight.png",
    weather: rainArt(
      "./images/locations/diner/dinerDayRain.jpg",
      "./images/locations/diner/dinerDayThunder.jpg",
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
      hotspots: [{ left: 82, top: 30, width: 16, height: 42 }],
    },
  ],
};

export const dinerInside: Scene = {
  id: "diner-inside",
  story: [
    narration("You step into the diner. Coffee and fried food."),
    thought("Margaret's working the floor.", { from: 420, until: 900 }),
    thought("Dead in here. Margaret must be off.", { from: 900 }),
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
      image: "./images/locations/diner/margaretSullivanAtWork.png",
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
      excludesStoryFlag: "posterFound",
      hotspots: [{ left: 8, top: 18, width: 14, height: 42 }],
      closeup: {
        image: "./images/misc/emilyMissingPoster.png",
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
