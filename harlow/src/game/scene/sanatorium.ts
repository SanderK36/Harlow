import {
  narration,
  thought,
} from "../story";
import type { Scene } from "./types";
import { isNightTime } from "../utils";

// ----------------------------------------
// SANATORIUM
// ----------------------------------------

export const SANATORIUM_ARRIVAL =
  "You reach the sanatorium. The building sits there, windows dark.";
export const SANATORIUM_NIGHT_ARRIVAL =
  "You reach the sanatorium. One window still lit. The rest are dark.";

/** Night, until Light on the Hill is completed — including before it starts. */
export function sanatoriumNarration(time: number, hillCompleted: boolean) {
  if (isNightTime(time) && !hillCompleted) return SANATORIUM_NIGHT_ARRIVAL;
  return SANATORIUM_ARRIVAL;
}

/** The hill close-up: one lit window. Used as the sanatorium plate until the quest is done. */
export const SANATORIUM_ONE_WINDOW =
  "./images/locations/sanatorium/sanatoriumFromTheStreetsNight.png";

export function sanatoriumShowsOneWindow(time: number, hillCompleted: boolean) {
  return isNightTime(time) && !hillCompleted;
}

export const sanatorium: Scene = {
  id: "sanatorium",
  story: [
    narration(SANATORIUM_ARRIVAL),
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
    thought("Ash on the floor tiles."),
    thought("Just my footsteps. I think."),
  ],
  location: "Sanatorium",
  image: {
    day: "./images/locations/sanatorium/sanatoriumRoom2Day.png",
    night: "./images/locations/sanatorium/sanatoriumRoom2Night.png",
  },
  choices: [
    {
      label: "Look at the ash",
      action: "lookAtSanatoriumCigarette",
      nextScene: "sanatorium-room-2",
      timeCost: 0,
      closeup: {
        image: "./images/locations/sanatorium/sanatoriumRoom2NightCigarette.png",
        thought: "Still burning. Someone was just here.",
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
