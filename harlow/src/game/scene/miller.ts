import type { Inscription } from "@/components/ImageText/imageText";
import {
  MILLER_ARRIVAL,
  MILLER_BOOK,
  MILLER_CABIN,
  MILLER_CAMP,
  MILLER_CHECK,
  MILLER_DOCK,
  MILLER_FALLBACK,
  MILLER_PLATES,
  MILLER_RECENT,
} from "@/game/slasher";
import { narration, thought } from "@/game/story";

import type { Scene } from "./types";
import { rainArt } from "./weather";

const EMILY_P: Inscription = {
  id: "emily-p",
  kind: "note",
  text: "Emily P.",
  top: 58,
  left: 18,
  width: 64,
};

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
    {
      label: "Down by the water",
      action: "goMillerDock",
      nextScene: "miller-dock",
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
    night: MILLER_PLATES.camp,
    fallback: MILLER_FALLBACK.camp,
    noNightVariant: true,
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

export const millerDock: Scene = {
  id: "miller-dock",
  story: [
    narration("The dock is half in the water."),
    thought(MILLER_DOCK),
  ],
  location: "Miller Lake",
  image: {
    day: MILLER_PLATES.dock,
    night: MILLER_PLATES.dock,
    fallback: MILLER_FALLBACK.dock,
    noNightVariant: true,
  },
  choices: [
    {
      label: MILLER_CHECK,
      action: "checkMillerDock",
      nextScene: "miller-dock",
      timeCost: 5,
      closeup: {
        image: MILLER_PLATES.tackle,
        fallbackImage: MILLER_FALLBACK.tackle,
        thought: MILLER_BOOK,
        label: "Tackle box",
        inscriptions: [EMILY_P],
        next: {
          image: MILLER_PLATES.tackle,
          fallbackImage: MILLER_FALLBACK.tackle,
          thought: MILLER_RECENT,
          label: "Tackle box",
          setsFlags: ["algebraBookFound"],
        },
      },
      completesQuest: "miller-lake",
      questStep: "done",
      excludesStoryFlag: "algebraBookFound",
    },
    {
      label: "Back to the shore",
      action: "leaveMillerDock",
      nextScene: "miller-lake",
      timeCost: 5,
    },
  ],
};
