import type { ClueConnectionId, ClueId } from "@/game/clues";
import {
  isQuestCompleted,
  startQuest,
  type QuestProgress,
  type StoryFlag,
} from "@/game/quests";
import { narration, ethan, type StoryEntry } from "@/game/story";
import type { Weather } from "@/game/types";

/** Chapter 1 opens Saturday, October 2, 1982. Day 2 is Sunday, October 3. */
export const OPENING_DAY_NUMBER = 2;
export const OPENING_WEEKDAY = "Saturday" as const;
export const OPENING_MONTH = "October" as const;
export const OPENING_YEAR = 1982;

/** Side-panel date, also the title card's top-left line. */
export function sidePanelDate(dayOfWeek: string, month: string, dayNumber: number) {
  return `${dayOfWeek}, ${month} ${dayNumber}`;
}

/** Centered title-card line. */
export function titleCardDate(dayOfWeek: string, month: string, dayNumber: number) {
  return `${sidePanelDate(dayOfWeek, month, dayNumber)}, ${OPENING_YEAR}`;
}

/** Full-screen morning card. "SUNDAY, OCTOBER 3, 1982". */
export function dayCardLine(dayOfWeek: string, month: string, dayNumber: number) {
  return `${dayOfWeek}, ${month} ${dayNumber}, ${OPENING_YEAR}`.toUpperCase();
}

/** Calendar dayNumber 3 is Sunday, October 3 — chapter day 2. Later days stay open. */
export function isChapterDay2(dayNumber: number) {
  return dayNumber >= 3;
}

export const RACHEL_FROM = 7 * 60;
export const RACHEL_UNTIL = 18 * 60;

/**
 * Rachel is on the Elrod porch only while Talk can reach her.
 * Before the first meeting, and again once Walter has been told, through 18:00.
 */
export function rachelDrawn(input: {
  time: number;
  rachelMet?: boolean;
  walterStationTalk?: boolean;
  quests: QuestProgress[];
}) {
  if (input.time < RACHEL_FROM || input.time >= RACHEL_UNTIL) return false;
  if (!input.rachelMet) return true;
  if (!input.walterStationTalk) return false;
  return (
    input.quests.some((quest) => quest.id === "what-walter-said" && quest.status === "active")
    || isQuestCompleted(input.quests, "what-walter-said")
  );
}

const HOME_SCENES = new Set([
  "ethan-room",
  "ethan-room-desk",
  "ethan-room-desk-empty",
  "hallway-upstairs",
  "hallway-upstairs-attic-open",
  "mom-room",
  "emily-room",
  "attic",
  "hallway",
  "kitchen",
  "living-room",
  "bathroom",
  "basement",
  "garage",
  "front-yard",
  "living-room-relaxing",
  "made-coffee",
  "fridge",
  "back-yard",
  "garage-bench",
  "garage-bench-empty",
]);

export function isHomeScene(sceneId: string) {
  return HOME_SCENES.has(sceneId);
}

export const NIGHT_CALL_MINUTE = 2 * 60;

/**
 * The first night's 02:00 is Sunday morning (dayNumber 3).
 * A jump from Saturday into Sunday morning counts. A later night does not.
 */
export function crossesFirstTwoAm(input: {
  fromTime: number;
  toTime: number;
  fromDay: number;
  toDay: number;
}) {
  if (input.fromDay === 2 && input.toDay === 3 && input.toTime >= NIGHT_CALL_MINUTE) return true;
  return (
    input.fromDay === 3
    && input.toDay === 3
    && input.fromTime < NIGHT_CALL_MINUTE
    && input.toTime >= NIGHT_CALL_MINUTE
  );
}

/** Rings only if Ethan is home on both sides of the minute the clock passes 02:00. */
export function nightCallRings(input: {
  heard: boolean;
  fromTime: number;
  toTime: number;
  fromDay: number;
  toDay: number;
  fromScene: string;
  toScene: string;
}) {
  if (input.heard) return false;
  if (!crossesFirstTwoAm(input)) return false;
  return isHomeScene(input.fromScene) && isHomeScene(input.toScene);
}

export const PHONE_THOUGHT = "Two in the morning. Nobody calls at two in the morning.";
export const PHONE_ANSWER_THOUGHT = "It's not raining here.";
export const PHONE_IGNORE_THOUGHT = "Twelve rings. Then nothing. Somehow that's worse.";
export const PHONE_SILENCE_MS = 1500;

export const PHONE_ANSWER_LINES: StoryEntry[] = [
  ethan("Hello?"),
  ethan("Who is this?"),
  narration("Click."),
];

const WET = new Set<Weather>(["Rainy", "Heavy rain", "Thunderstorm"]);

/** After he answers, the house stays dry until morning. The town can still be wet. */
export function homeNightWeather(
  weather: Weather,
  sceneId: string,
  time: number,
  cleared: boolean,
): Weather {
  if (!cleared || time >= 7 * 60 || !isHomeScene(sceneId)) return weather;
  if (WET.has(weather)) return "Cloudy";
  return weather;
}

export const PINE_NEEDLE_LINES = [
  "Pine needles. In the mud by our door.",
  "Nobody walks up our steps from the woods.",
] as const;

/** First front-yard visit on Sunday morning. Later days do not catch up. */
export function porchNeedlesDue(input: {
  sceneId: string;
  dayNumber: number;
  time: number;
  seen: boolean;
}) {
  return (
    input.sceneId === "front-yard"
    && input.dayNumber === 3
    && input.time < 12 * 60
    && !input.seen
  );
}

export const HILL_DARK_TONIGHT = "The hill's dark tonight.";

/** Saturday evening in the yard, before the hill quest is allowed to start. */
export function hillDarkDue(input: {
  sceneId: string;
  dayNumber: number;
  time: number;
  heard: boolean;
}) {
  return (
    input.sceneId === "front-yard"
    && input.dayNumber === OPENING_DAY_NUMBER
    && input.time >= 18 * 60
    && !input.heard
  );
}

export const FIGURE_THOUGHT = "There. By the trees. Same hood.";
export const FIGURE_FOLLOW = "Gone. Just broken branches, going up.";
export const FIGURE_STAY = "Smart, Ethan. Real smart. So why do I feel worse?";

export function daytimeFigureDue(input: {
  sceneId: string;
  dayNumber: number;
  time: number;
  bootPrintSeen: boolean;
  seen: boolean;
}) {
  return (
    input.sceneId === "elrod-backyard"
    && isChapterDay2(input.dayNumber)
    && input.time >= 15 * 60
    && input.time < 17 * 60
    && input.bootPrintSeen
    && !input.seen
  );
}

export const FOLDER_CAUGHT_LINES: StoryEntry[] = [
  { type: "conversation", character: "Walter", text: "Find what you were looking for?" },
  ethan("I was just–"),
  { type: "conversation", character: "Walter", text: "Out. Now." },
];

export const FOLDER_LOCKED_LINE = "Not a chance, kid.";
export const FOLDER_RINGS_LINE = "His desk. Nothing on it but coffee rings.";
export const FOLDER_GONE_LINE = "The folder's gone. He moved it.";
export const RACHEL_FOLDER_LINE = "Leave Walter to me. You get five minutes.";

export type FolderLook = "hidden" | "open" | "caught" | "locked" | "rings" | "gone";

/** Safe before 17:30. Walter comes back after that. Rachel can buy one look. */
export function folderLook(input: {
  time: number;
  fileDrawerSeen?: boolean;
  emilyFileOpened?: boolean;
  folderLockedToday?: boolean;
  rachelFolderCover?: boolean;
}): FolderLook {
  if (!input.fileDrawerSeen) return "hidden";
  if (input.emilyFileOpened) return "gone";
  if (input.folderLockedToday && !input.rachelFolderCover) return "locked";
  const inWindow = input.time >= 16 * 60 && input.time < 18 * 60;
  if (!inWindow) return "rings";
  if (input.time >= 17 * 60 + 30 && !input.rachelFolderCover) return "caught";
  return "open";
}

/** Optional quests that wait on a day or a corkboard link. Trust never starts them. */
export function syncChapterQuests(
  quests: QuestProgress[],
  dayNumber: number,
  connections: readonly string[],
): QuestProgress[] {
  let next = quests;
  if (connections.includes("walt-parker")) next = startQuest(next, "old-friends");
  if (isChapterDay2(dayNumber) && isQuestCompleted(next, "emilys-room")) {
    next = startQuest(next, "before-everything");
  }
  if (isChapterDay2(dayNumber) && isQuestCompleted(next, "what-walter-said")) {
    next = startQuest(next, "rachel-remembers");
  }
  return next;
}

export function flagsForConnections(
  flags: Partial<Record<StoryFlag, boolean>>,
  connections: readonly string[],
): Partial<Record<StoryFlag, boolean>> {
  if (!connections.includes("walt-parker") || flags.waltParkerLinked) return flags;
  return { ...flags, waltParkerLinked: true };
}

export const HAIR_TIE_THOUGHTS = [
  "Next to the cigarette. A hair tie. Pink, little flowers.",
  "That's hers.",
  "Ten years. Somebody kept it ten years.",
] as const;

export const HAIR_TIE_LEFT = "/images/misc/oldEmilyEthanPhoto.png";
export const HAIR_TIE_RIGHT = "/images/locations/sanatorium/sanatoriumRoom2NightCigarette.png";
export const FIGURE_PLATE = "/images/locations/sanatorium/sanatoriumMainFloorNightShadow.png";

const ENDING_LINES: Partial<Record<ClueId, string>> = {
  "every-sunday": "Every Sunday. He still goes.",
  "fresh-flowers": "Fresh flowers. Not from Mom.",
  "year-1966": "Spring of '66. He came home and stopped talking.",
  "the-woods-road": "She was walking up. Not down.",
  "trail-up-the-hill": "Broken branches. Straight up.",
  "room-6": "Room 6. Mud on the carpet. Friday.",
};

/** One line per optional clue, in the order Ethan would turn them over. */
export function endingThoughts(clues: readonly ClueId[]): string[] {
  const order: ClueId[] = [
    "every-sunday",
    "fresh-flowers",
    "year-1966",
    "the-woods-road",
    "trail-up-the-hill",
    "room-6",
  ];
  return order.flatMap((id) => {
    if (!clues.includes(id)) return [];
    const line = ENDING_LINES[id];
    return line ? [line] : [];
  });
}

export type EndingFrame = {
  image: string;
  thought: string;
  label: string;
  split?: { left: string; right: string };
  flags?: StoryFlag[];
};

/** After the cigarette: hair tie, the figure, then whatever optional clues he kept. */
export function endingFrames(clues: readonly ClueId[]): EndingFrame[] {
  const hair = HAIR_TIE_THOUGHTS.map((thought, index) => ({
    image: HAIR_TIE_RIGHT,
    thought,
    label: "Hair tie",
    split: { left: HAIR_TIE_LEFT, right: HAIR_TIE_RIGHT },
    flags: index === 0 ? ["hairTieFound" as const] : undefined,
  }));
  const figure: EndingFrame = {
    image: FIGURE_PLATE,
    thought: "Someone's here.",
    label: "Someone in the lobby",
  };
  const after = endingThoughts(clues).map((thought) => ({
    image: FIGURE_PLATE,
    thought,
    label: "Ethan",
  }));
  return [...hair, figure, ...after];
}

export function connectionStartsOldFriends(id: ClueConnectionId) {
  return id === "walt-parker";
}

export const EMILY_DOOR_THOUGHT = "Her door's open. I closed it.";
export const EMILY_BOX_THOUGHT = "The lid's up. Somebody opened it and didn't wind it.";

const UPSTAIRS_HALLS = new Set(["hallway-upstairs", "hallway-upstairs-attic-open"]);

/**
 * Night 2 is Sunday after 20:00 (dayNumber 3). The upstairs hall only.
 * Later nights do not catch up. Seeing the door locks nothing.
 */
export function emilyDoorAjarDue(input: {
  sceneId: string;
  dayNumber: number;
  time: number;
  seen: boolean;
}) {
  return (
    UPSTAIRS_HALLS.has(input.sceneId)
    && input.dayNumber === 3
    && input.time >= 20 * 60
    && !input.seen
  );
}

export const HILL_LIGHT_OUT = "It went out. Like it saw me looking.";
/** The glow stays lit, then cuts. The thought follows half a second later. */
export const HILL_LIGHT_ON_MS = 2000;
export const HILL_LIGHT_THOUGHT_DELAY_MS = 500;

export const GRAVEL_LINES = [
  "Footsteps. Behind me, in the gravel.",
  "They stop when I stop.",
  "Don't turn around. Just walk.",
] as const;

export const GRAVEL_LINE_MS = 2600;
/** Footsteps keep going a moment after the last line, then stop. */
export const GRAVEL_TAIL_MS = 1600;

/**
 * First trip home from the sanatorium road, while Light on the Hill is still
 * active, if he has not gone inside. Going in skips this for good.
 */
export function gravelWalkDue(input: {
  fromScene: string;
  toScene: string;
  hillActive: boolean;
  entered: boolean;
  heard: boolean;
}) {
  return (
    input.fromScene === "sanatorium"
    && input.toScene === "front-yard"
    && input.hillActive
    && !input.entered
    && !input.heard
  );
}
