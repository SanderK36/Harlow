/**
 * The new-game prologue: the night Mrs. Elrod is found, told over full-frame
 * art between the studio film and the HARLOW title card. Played by
 * src/components/Prologue/Prologue.tsx.
 */

export type PrologueBeat =
  | "comic"
  | "bed"
  | "window"
  | "stairs"
  | "porch"
  | "walter"
  | "behind"
  | "street"
  | "strike"
  | "aftermath";

export type PrologueLine =
  | { kind: "narration"; text: string }
  | {
      kind: "say";
      speaker: "Ethan" | "Walter";
      text: string;
      /** Hold the typewriter after this many characters (a silent beat). */
      pause?: { after: number; ms: number };
    }
  | { kind: "thought"; text: string };

export type PrologueChoice = {
  label: string;
  /** What follows once Ethan has said the line. */
  reply: PrologueLine[];
};

export type PrologueNode =
  | ({ beat: PrologueBeat } & PrologueLine)
  | { beat: PrologueBeat; kind: "choice"; options: PrologueChoice[] };

const IMAGE_ROOT = "/images/intro";

/** Which picture each layer shows. "street" is reused after the strike. */
export const PROLOGUE_IMAGES = {
  comic: `${IMAGE_ROOT}/EthanPickingUpComic.jpg`,
  bed: `${IMAGE_ROOT}/EthanInBedRedAndBlue.jpg`,
  window: `${IMAGE_ROOT}/EthanLookingAtWindow.jpg`,
  stairs: `${IMAGE_ROOT}/ethanWalkingDownTheStairs.jpg`,
  porch: `${IMAGE_ROOT}/EthanWalkingOut.jpg`,
  walter: `${IMAGE_ROOT}/ethanTalkingToWalter.jpg`,
  behind: `${IMAGE_ROOT}/ethanLookingBehind.jpg`,
  street: `${IMAGE_ROOT}/emptyStreet.jpg`,
  killer: `${IMAGE_ROOT}/lightningKiller.jpg`,
} as const;

export type PrologueImage = keyof typeof PROLOGUE_IMAGES;

/** The family photo on the stairway wall (percent of the 1448×1086 art). */
export const FAMILY_PHOTO_HOTSPOT = { left: 17.1, top: 11.3, width: 7.4, height: 14.5 };

/** The beats that happen out of doors (for the night ambience). */
export const OUTDOOR_BEATS: PrologueBeat[] = ["porch", "walter", "behind", "street", "strike", "aftermath"];

const LOCK_YOUR_DOOR: PrologueLine = {
  kind: "say",
  speaker: "Walter",
  text: "Lock your door. And Ethan? Shoes next time.",
};

export const PROLOGUE: PrologueNode[] = [
  {
    beat: "comic",
    kind: "narration",
    text: "Harlow, October 1982. Another night the town pretends nothing ever happens here.",
  },
  { beat: "comic", kind: "say", speaker: "Ethan", text: "Web Runner, issue twelve... I've read this a hundred times." },

  { beat: "bed", kind: "say", speaker: "Ethan", text: "Just one more page." },
  { beat: "bed", kind: "narration", text: "Red. Blue. Red. The colors crawl across the walls." },

  { beat: "window", kind: "say", speaker: "Ethan", text: "Sirens? On our street?" },

  // Shown by clicking the family photo on the wall (or simply continuing).
  { beat: "stairs", kind: "thought", text: "Ten years, Em. The house still feels like it's waiting for you." },

  { beat: "porch", kind: "narration", text: "The rain has stopped, but the air still smells like it." },

  { beat: "walter", kind: "say", speaker: "Walter", text: "Ethan. Get back inside." },
  {
    beat: "walter",
    kind: "choice",
    options: [
      {
        label: "What happened to Mrs. Elrod?",
        reply: [
          { kind: "say", speaker: "Walter", text: "Somebody hurt her. That's all you need to know tonight." },
        ],
      },
      {
        label: "Is she... is she dead?",
        reply: [
          // "(beat)": Walter says nothing for a moment before he answers.
          { kind: "say", speaker: "Walter", text: "… Go home, son.", pause: { after: 1, ms: 1300 } },
        ],
      },
    ],
  },
  {
    beat: "walter",
    kind: "say",
    speaker: "Ethan",
    text: "She gave me a dollar every Halloween. She lived alone. Who'd do that?",
  },
  { beat: "walter", kind: "say", speaker: "Walter", text: "That's my job to find out. Not yours." },
  {
    beat: "walter",
    kind: "choice",
    options: [
      {
        label: "You said that about Emily, too.",
        reply: [{ kind: "say", speaker: "Walter", text: "...Don't. Not tonight." }, LOCK_YOUR_DOOR],
      },
      { label: "Okay. I'm going.", reply: [LOCK_YOUR_DOOR] },
    ],
  },
  { beat: "walter", kind: "thought", text: "Walter looks scared. I've never seen Walter scared." },

  { beat: "behind", kind: "thought", text: "Someone's watching me." },

  { beat: "street", kind: "say", speaker: "Ethan", text: "Hey..." },

  {
    beat: "strike",
    kind: "narration",
    text: "Lightning. And for one white second, he is there. Then the dark takes him back.",
  },

  { beat: "aftermath", kind: "thought", text: "That's how it felt the night Emily disappeared." },
];
