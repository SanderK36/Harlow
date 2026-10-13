import type { Inscription } from "@/components/ImageText/imageText";
import type { TrustPerson } from "@/game/trust";

/**
 * Chapter 1 clues. A clue with an image is a polaroid on the corkboard;
 * a clue without one is a note with a pin. Connections only produce a
 * thought and, for one pair, Ask-about questions. They never move a quest.
 */

export const CLUE_IDS = [
  "man-in-a-hood",
  "faded-poster",
  "parker-e",
  "cigarette",
  "boot-print",
  "walt-and-me",
  "the-gazette",
] as const;

export type ClueId = (typeof CLUE_IDS)[number];

export type ClueDef = {
  id: ClueId;
  name: string;
  note: string;
  /** Public image path. Omitted clues are pinned notes. */
  image?: string;
};

export const CLUE_DEFS: Record<ClueId, ClueDef> = {
  "man-in-a-hood": {
    id: "man-in-a-hood",
    name: "Man in a hood",
    note: "End of the street. Just standing there. Watching.",
  },
  "faded-poster": {
    id: "faded-poster",
    name: "Faded Poster",
    note: "Emily's face on Margaret's board. Ten years, and nobody took it down.",
    image: "/images/misc/emilyMissingPoster.png",
  },
  "parker-e": {
    id: "parker-e",
    name: "PARKER, E.",
    note: "Her file. Closed ten years. Still in Walter's drawer.",
  },
  cigarette: {
    id: "cigarette",
    name: "Cigarette",
    note: "Still burning. Someone was just here.",
    image: "/images/locations/sanatorium/sanatoriumRoom2NightCigarette.png",
  },
  "boot-print": {
    id: "boot-print",
    name: "Boot print",
    note: "A boot print by the porch steps. Pine needles in the mud.",
    image: "/images/locations/neighbourhood/elrod_house/elrodHouseBackyardFootprintSunny.png",
  },
  "walt-and-me": {
    id: "walt-and-me",
    name: "Walt & me",
    note: "Miller Lake, '64. Walter's already a cop. Dad's face is scratched out.",
    image: "/images/misc/oldPhotoWalterFishing.png",
  },
  "the-gazette": {
    id: "the-gazette",
    name: "The Gazette",
    note: "Front page. \"Stay calm.\" Sure.",
    image: "/images/misc/newspaperElrod.png",
  },
};

export const CONNECTION_IDS = ["hood-boot", "walt-parker"] as const;

export type ClueConnectionId = (typeof CONNECTION_IDS)[number];

export type ClueConnection = {
  id: ClueConnectionId;
  a: ClueId;
  b: ClueId;
  thought: string;
};

export const CLUE_CONNECTIONS: readonly ClueConnection[] = [
  {
    id: "hood-boot",
    a: "boot-print",
    b: "man-in-a-hood",
    thought: "He came down from the hill.",
  },
  {
    id: "walt-parker",
    a: "walt-and-me",
    b: "parker-e",
    thought: "He knew Dad. And he kept her file.",
  },
];

export const WRONG_CONNECTION_LINES = [
  "Doesn't connect.",
  "No. I'm reaching.",
  "That's not it.",
] as const;

export type AskedAbout = Partial<Record<TrustPerson, ClueId[]>>;

export type ClueSave = {
  clues?: readonly string[] | null;
  clueConnections?: readonly string[] | null;
  cluesSeen?: readonly string[] | null;
  askedAbout?: Partial<Record<string, readonly string[] | undefined>> | null;
  storyFlags?: Partial<Record<string, boolean>>;
};

const FLAG_CLUES: Record<string, ClueId> = {
  posterFound: "faded-poster",
  fileDrawerSeen: "parker-e",
  sanatoriumCigaretteSeen: "cigarette",
  bootPrintSeen: "boot-print",
  waltPhotoSeen: "walt-and-me",
  gazetteFound: "the-gazette",
};

export function isClueId(value: string): value is ClueId {
  return (CLUE_IDS as readonly string[]).includes(value);
}

export function isConnectionId(value: string): value is ClueConnectionId {
  return (CONNECTION_IDS as readonly string[]).includes(value);
}

export function clueForFlag(flag: string): ClueId | null {
  return FLAG_CLUES[flag] ?? null;
}

export function collectClue(owned: readonly ClueId[], id: ClueId): { clues: ClueId[]; added: boolean } {
  if (owned.includes(id)) return { clues: [...owned], added: false };
  return { clues: [...owned, id], added: true };
}

export function connectionBetween(a: ClueId, b: ClueId): ClueConnection | null {
  return CLUE_CONNECTIONS.find(
    (link) => (link.a === a && link.b === b) || (link.a === b && link.b === a),
  ) ?? null;
}

export function wrongConnectionLine(index: number): string {
  const count = WRONG_CONNECTION_LINES.length;
  const wrapped = ((Math.trunc(index) % count) + count) % count;
  return WRONG_CONNECTION_LINES[wrapped];
}

export type ConnectResult =
  | { status: "linked"; thought: string; connections: ClueConnectionId[]; added: boolean }
  | { status: "rejected"; line: string };

/**
 * Link two clues Ethan already has. A real pair keeps its thread and thought.
 * Anything else pulls back with one of the wrong-connection lines.
 */
export function tryConnect(
  a: ClueId,
  b: ClueId,
  owned: readonly ClueId[],
  existing: readonly ClueConnectionId[],
  roll = 0,
): ConnectResult {
  const link = a !== b && owned.includes(a) && owned.includes(b)
    ? connectionBetween(a, b)
    : null;
  if (!link) return { status: "rejected", line: wrongConnectionLine(roll) };
  const added = !existing.includes(link.id);
  return {
    status: "linked",
    thought: link.thought,
    connections: added ? [...existing, link.id] : [...existing],
    added,
  };
}

export function unseenClues(owned: readonly ClueId[], seen: readonly ClueId[]): ClueId[] {
  return owned.filter((id) => !seen.includes(id));
}

export function waltAskUnlocked(connections: readonly ClueConnectionId[]): boolean {
  return connections.includes("walt-parker");
}

/** The boot print by the porch steps is hidden from 03:00 until 07:00. */
export function bootPrintHotspotHidden(time: number): boolean {
  return time >= 3 * 60 && time < 7 * 60;
}

const WET_WEATHER = new Set(["Rainy", "Heavy rain", "Thunderstorm"]);

/** Sunny plate unless the yard is wet. The corkboard keeps the sunny print. */
export function bootPrintImage(weather: string): string {
  return WET_WEATHER.has(weather)
    ? "/images/locations/neighbourhood/elrod_house/elrodHouseBackyardFootprintRainy.png"
    : "/images/locations/neighbourhood/elrod_house/elrodHouseBackyardFootprintSunny.png";
}

/** Dad's box is not in the attic until Emily's note has been read. */
export function atticHotspotVisible(flags: { emilyNoteRead?: boolean }): boolean {
  return Boolean(flags.emilyNoteRead);
}

/** Saturday morning, on the porch step, until Ethan picks the paper up. */
export function gazetteOnPorch(
  day: string,
  time: number,
  found: boolean,
): boolean {
  return day === "Saturday" && time >= 6 * 60 && time < 12 * 60 && !found;
}

function sanitizeAsked(value: ClueSave["askedAbout"]): AskedAbout {
  const asked: AskedAbout = {};
  if (!value) return asked;
  const people: TrustPerson[] = ["rachel", "linda", "walter", "margaret"];
  for (const person of people) {
    const list = value[person];
    if (!Array.isArray(list)) continue;
    const clues = list.filter((id): id is ClueId => typeof id === "string" && isClueId(id));
    if (clues.length) asked[person] = [...new Set(clues)];
  }
  return asked;
}

function cluesFromFlags(flags: Partial<Record<string, boolean>> | undefined, into: ClueId[]) {
  const next = [...into];
  for (const [flag, id] of Object.entries(FLAG_CLUES)) {
    if (flags?.[flag] && !next.includes(id)) next.push(id);
  }
  return next;
}

/**
 * Old saves have no clue fields. The opening already happened, so the hooded
 * man is written down, and anything Ethan had already found comes from flags.
 * A save that stores `clues` (including an empty list) keeps that list.
 */
export function migrateClues(save: ClueSave | null | undefined): {
  clues: ClueId[];
  connections: ClueConnectionId[];
  cluesSeen: ClueId[];
  askedAbout: AskedAbout;
} {
  if (!save) {
    return { clues: [], connections: [], cluesSeen: [], askedAbout: {} };
  }

  const base: ClueId[] = Array.isArray(save.clues)
    ? save.clues.filter((id): id is ClueId => typeof id === "string" && isClueId(id))
    : ["man-in-a-hood"];
  const clues = cluesFromFlags(save.storyFlags, base);

  const connections = (Array.isArray(save.clueConnections) ? save.clueConnections : [])
    .filter((id): id is ClueConnectionId => typeof id === "string" && isConnectionId(id))
    .filter((id, index, list) => list.indexOf(id) === index)
    .filter((id) => {
      const link = CLUE_CONNECTIONS.find((item) => item.id === id);
      return Boolean(link && clues.includes(link.a) && clues.includes(link.b));
    });

  const seenSource = Array.isArray(save.cluesSeen) ? save.cluesSeen : [];
  const cluesSeen = seenSource
    .filter((id): id is ClueId => typeof id === "string" && isClueId(id))
    .filter((id) => clues.includes(id));

  return {
    clues,
    connections,
    cluesSeen,
    askedAbout: sanitizeAsked(save.askedAbout),
  };
}

export const CORK_TEXTURE = "/images/ui/corkboard.png";

export const NEWSPAPER = {
  image: "/images/misc/newspaperElrod.png",
  headline: "ELDERLY WOMAN FOUND DEAD IN HER HOME",
  subline: "Police ask residents to stay calm",
  body: "Mrs. Elrod was found dead in her home early Saturday. Sheriff Walter Harrington called the death \"under investigation\" and asked residents to stay calm and keep their doors locked.",
};

export const NEWSPAPER_INSCRIPTIONS: Inscription[] = [
  {
    id: "headline",
    kind: "headline",
    text: NEWSPAPER.headline,
    top: 8,
    left: 6,
    width: 88,
  },
  {
    id: "subline",
    kind: "subline",
    text: NEWSPAPER.subline,
    top: 24,
    left: 6,
    width: 84,
  },
  {
    id: "body",
    kind: "body",
    text: NEWSPAPER.body,
    top: 34,
    left: 7,
    width: 86,
  },
];

export const EMILY_THOUGHTS = {
  musicBox: "She'd had it since she was little. Still wound it every night. It still plays.",
  polaroid: "Summer '71. I was too slow, so she carried me. She always did.",
  note: "Her handwriting. Ten years, and I never found it. Dad's box... the attic.",
  photo: "Walter was already a cop. Dad's face is scratched out.",
} as const;

export const EMILY_OVERLAYS = {
  polaroid: "Em & Ethan, summer '71",
  note: "Dad's box is in the attic. Don't tell Mom. – E",
  photo: "Walt & me, Miller Lake '64",
} as const;

export const PLATES = {
  gazette: {
    image: NEWSPAPER.image,
    thought: CLUE_DEFS["the-gazette"].note,
    label: "The Harlow Gazette",
    inscriptions: NEWSPAPER_INSCRIPTIONS,
  },
  bootPrint: {
    image: "/images/locations/neighbourhood/elrod_house/elrodHouseBackyardFootprintSunny.png",
    thought: CLUE_DEFS["boot-print"].note,
    label: "Boot print",
  },
  musicBox: {
    image: "/images/misc/emilyMusicBox.png",
    thought: EMILY_THOUGHTS.musicBox,
    label: "Music box",
  },
  polaroid: {
    image: "/images/misc/oldEmilyEthanPhoto.png",
    thought: EMILY_THOUGHTS.polaroid,
    label: "Polaroid",
    inscriptions: [
      {
        id: "caption",
        kind: "caption" as const,
        text: EMILY_OVERLAYS.polaroid,
        top: 78,
        left: 8,
        width: 84,
      },
    ],
  },
  note: {
    image: "/images/misc/emilyLetter.png",
    thought: EMILY_THOUGHTS.note,
    label: "Emily's note",
    inscriptions: [
      {
        id: "note",
        kind: "note" as const,
        text: EMILY_OVERLAYS.note,
        top: 28,
        left: 12,
        width: 76,
      },
    ],
  },
  photo: {
    image: "/images/misc/oldPhotoWalterFishing.png",
    thought: EMILY_THOUGHTS.photo,
    label: "Walt & me",
    inscriptions: [
      {
        id: "caption",
        kind: "caption" as const,
        text: EMILY_OVERLAYS.photo,
        top: 80,
        left: 8,
        width: 84,
      },
    ],
  },
  lobbyFigure: {
    image: "/images/locations/sanatorium/sanatoriumMainFloorNightShadow.png",
    thought: "Someone's here.",
    label: "Someone in the lobby",
  },
};
