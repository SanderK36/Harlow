import {
  MILLER_ARRIVAL,
  MILLER_CABIN,
  MILLER_CAMP,
  MILLER_FALLBACK,
  MILLER_PLATES,
} from "@/game/slasher";
import { narration, thought } from "@/game/story";

import type { Scene } from "./types";
import { rainArt } from "./weather";

/** The shore is the water. The quest finishes in the cabin. There is no dock. */
export const millerLake: Scene = {
  id: "miller-lake",
  story: [
    narration("The road gives out at the water."),
    thought(MILLER_ARRIVAL),
  ],
  location: "Miller Lake",
  image: {
    day: MILLER_PLATES.shore,
    night: MILLER_PLATES.shoreNight,
    weather: rainArt(MILLER_PLATES.shoreRain, MILLER_PLATES.shoreThunder),
    fallback: MILLER_FALLBACK.shore,
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "The old camp",
      action: "goMillerCamp",
      nextScene: "miller-camp",
      timeCost: 5,
    },
  ],
};

export const millerCamp: Scene = {
  id: "miller-camp",
  story: [
    narration("A sign is still nailed to the post. The paint is gone."),
    thought(MILLER_CAMP),
  ],
  location: "Miller Lake",
  image: {
    day: MILLER_PLATES.camp,
    night: MILLER_PLATES.campNight,
    weather: rainArt(MILLER_PLATES.campRain, MILLER_PLATES.campThunder),
    fallback: MILLER_FALLBACK.camp,
    weatherDayOnly: true,
  },
  choices: [
    {
      label: "The cabin",
      action: "enterMillerCabin",
      door: true,
      nextScene: "miller-cabin",
      timeCost: 2,
    },
    {
      label: "Back to the shore",
      action: "leaveMillerCamp",
      nextScene: "miller-lake",
      timeCost: 5,
    },
  ],
};

export const millerCabin: Scene = {
  id: "miller-cabin",
  story: [
    narration("One room. A cot. The door doesn't quite shut."),
    thought(MILLER_CABIN),
  ],
  location: "Miller Lake",
  image: {
    day: MILLER_PLATES.cabin,
    night: MILLER_PLATES.cabin,
    fallback: MILLER_FALLBACK.cabin,
    noNightVariant: true,
  },
  choices: [
    {
      label: "Back outside",
      action: "leaveMillerCabin",
      door: true,
      nextScene: "miller-camp",
      timeCost: 2,
    },
  ],
};
