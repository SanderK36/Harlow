import type { ChoiceEffects } from "./choices";
import type { StoryEntry } from "./story";
import { ethan, npc } from "./story";

/**
 * Hidden relationship score. Never render the number, a bar, or a colour
 * for it. It only swaps lines.
 *
 * Margaret stays at 0..+2 and starts at +1: Ethan is already a regular.
 * Everyone else is -2..+2 and starts at 0.
 */
export const TRUST_PEOPLE = ["rachel", "linda", "walter", "margaret"] as const;

export type TrustPerson = (typeof TRUST_PEOPLE)[number];

export type TrustMap = Record<TrustPerson, number>;

export type TrustCondition = {
  person: TrustPerson;
  min?: number;
  max?: number;
};

/** One choice's trust change. `oncePerDay` limits positive gains to a single step per in-game day. */
export type TrustStep = {
  person: TrustPerson;
  amount: number;
  oncePerDay?: boolean;
};

const TRUST_MIN: Record<TrustPerson, number> = {
  rachel: -2,
  linda: -2,
  walter: -2,
  margaret: 0,
};

const TRUST_MAX: Record<TrustPerson, number> = {
  rachel: 2,
  linda: 2,
  walter: 2,
  margaret: 2,
};

/** Net trust change allowed for one person inside a single conversation. */
export const CONVERSATION_TRUST_STEP = 1;

/** Paid diner coffee. Free once Margaret is at +2. */
export const DINER_COFFEE_PRICE = 1;

/** Handwriting reveal for a notebook line that just changed. */
export const HANDWRITING_MS = 600;

const SPEAKER: Record<TrustPerson, string> = {
  rachel: "Rachel",
  linda: "Linda",
  walter: "Walter",
  margaret: "Margaret",
};

export const NOTEBOOK_NAME: Record<TrustPerson, string> = {
  rachel: "Rachel Bennett",
  linda: "Mom",
  walter: "Walter Harrington",
  margaret: "Margaret",
};

const NOTEBOOK_LINES: Record<TrustPerson, Record<number, string>> = {
  rachel: {
    2: "She tells me things. I owe her the same.",
    1: "Still the girl from down the street. Still on my side.",
    0: "Lives a few houses down. Remembers Emily.",
    [-1]: "She asked. I didn't answer.",
    [-2]: "She's stopped asking.",
  },
  linda: {
    2: "She almost said Emily's name today.",
    1: "She smiled. First time in a while.",
    0: "Covering everything. Says she's fine.",
    [-1]: "She changes the subject faster than I can bring it up.",
    [-2]: "We live in the same house. That's about it.",
  },
  walter: {
    2: "He looks at me like I might be useful.",
    1: "Walter listened. Didn't say much. Didn't throw me out either.",
    0: "Sheriff. Knew Dad, back before Dad left.",
    [-1]: "He watched me leave. All the way to the corner.",
    [-2]: "Walter's keeping an eye on me. I'd better keep one on him.",
  },
  margaret: {
    2: "Coffee's on the house. So is the gossip.",
    1: "She knows how I take my coffee.",
    0: "Runs the diner. Never takes anything down.",
  },
};

/** Return-visit lines. Trust 0 keeps the conversation's existing opening. */
const RETURN_GREETINGS: Record<TrustPerson, Partial<Record<number, string>>> = {
  rachel: {
    2: "Ethan. Good. I was hoping you'd come by.",
    1: "Hey, you. Any news?",
    [-1]: "Oh. It's you.",
    [-2]: "What do you want, Ethan?",
  },
  linda: {
    2: "There's my boy. Come sit with me a minute.",
    1: "Hey, honey. You eat anything today?",
    [-1]: "Oh. Hi, honey.",
    [-2]: "Not now, honey. I'm tired.",
  },
  walter: {
    2: "Shut the door, kid.",
    1: "Ethan. Sit down.",
    [-1]: "You again. Make it quick.",
    [-2]: "Back again? Funny how you keep showing up.",
  },
  margaret: {
    2: "There he is. Sit, this one's on me. And you didn't hear this from me…",
    1: "Ethan! Your usual's already on.",
  },
};

export function defaultTrust(): TrustMap {
  return { rachel: 0, linda: 0, walter: 0, margaret: 1 };
}

export function clampTrust(person: TrustPerson, value: number): number {
  if (!Number.isFinite(value)) return person === "margaret" ? 1 : 0;
  return Math.min(TRUST_MAX[person], Math.max(TRUST_MIN[person], Math.trunc(value)));
}

export function meetsTrust(trust: TrustMap, condition: TrustCondition): boolean {
  const value = trust[condition.person];
  if (condition.min !== undefined && value < condition.min) return false;
  if (condition.max !== undefined && value > condition.max) return false;
  return true;
}

export type TrustLedger = {
  trust: TrustMap;
  /** Net change already applied in this conversation, per person. */
  spent: Partial<Record<TrustPerson, number>>;
  /** In-game dayNumber on which a once-per-day gain last landed. */
  gainedOnDay: Partial<Record<TrustPerson, number>>;
};

/**
 * Apply one choice. The conversation's net change per person stays within
 * ±1: a -1 and a later +1 land on 0, and a second +1 does not stack.
 * Positive `oncePerDay` steps also refuse a second gain on the same day,
 * including in a later conversation.
 */
export function applyConversationTrust(
  ledger: TrustLedger,
  step: TrustStep,
  dayNumber: number,
): TrustLedger & { applied: number } {
  const person = step.person;
  const spentNow = ledger.spent[person] ?? 0;
  let amount = step.amount;
  if (step.oncePerDay && amount > 0 && ledger.gainedOnDay[person] === dayNumber) {
    amount = 0;
  }

  const nextNet = Math.min(
    CONVERSATION_TRUST_STEP,
    Math.max(-CONVERSATION_TRUST_STEP, spentNow + amount),
  );
  const roomApplied = nextNet - spentNow;
  const nextValue = clampTrust(person, ledger.trust[person] + roomApplied);
  const applied = nextValue - ledger.trust[person];

  return {
    trust: { ...ledger.trust, [person]: nextValue },
    spent: { ...ledger.spent, [person]: spentNow + applied },
    gainedOnDay:
      applied > 0 && step.oncePerDay
        ? { ...ledger.gainedOnDay, [person]: dayNumber }
        : ledger.gainedOnDay,
    applied,
  };
}

export function personFromSpeaker(name: string): TrustPerson | null {
  const key = name.toLowerCase();
  if (key === "rachel" || key === "linda" || key === "walter" || key === "margaret") {
    return key;
  }
  return null;
}

export function personFromOpening(opening: StoryEntry[]): TrustPerson | null {
  for (const entry of opening) {
    if (entry.type === "conversation" && entry.character !== "Ethan") {
      return personFromSpeaker(entry.character);
    }
  }
  return null;
}

/** Null on a first meeting, and on a return visit at trust 0. */
export function returnGreeting(
  person: TrustPerson,
  trust: number,
  returning: boolean,
): string | null {
  if (!returning) return null;
  return RETURN_GREETINGS[person][trust] ?? null;
}

export function notebookLine(person: TrustPerson, trust: number): string {
  const level = clampTrust(person, trust);
  return NOTEBOOK_LINES[person][level] ?? NOTEBOOK_LINES[person][0];
}

/**
 * Mom is already in the notebook. Other people appear after Ethan meets them,
 * in that order, so the page is never an empty list.
 */
export function notebookPeople(met: readonly TrustPerson[]): TrustPerson[] {
  return ["linda", ...met.filter((person) => person !== "linda")];
}

/**
 * Trust the notebook already treats as read. A missing note is the value
 * trust already has: Margaret's +1, or Rachel's score from an old save.
 * A number written down here is what Ethan last read, so a later step can
 * still mark the page.
 */
export function migratePeopleSeen(
  save: { peopleSeenTrust?: Partial<TrustMap> | null } | null | undefined,
  trust: TrustMap,
): Partial<TrustMap> {
  const recorded = save?.peopleSeenTrust;
  const seen: Partial<TrustMap> = {};
  for (const person of TRUST_PEOPLE) {
    const value = recorded?.[person];
    seen[person] = typeof value === "number" ? value : trust[person];
  }
  return seen;
}

/** People whose notebook line changed after the last time the page was opened. */
export function unseenNotebookPeople(
  shown: readonly TrustPerson[],
  trust: TrustMap,
  seen: Partial<TrustMap>,
): TrustPerson[] {
  return shown.filter((person) => seen[person] !== trust[person]);
}

export function notebookPortrait(person: TrustPerson): string {
  switch (person) {
    case "rachel":
      return "/images/characters/rachelBennett/rachelBennett.png";
    case "linda":
      return "/images/characters/lindaParker/lindaParker.png";
    case "walter":
      return "/images/characters/walterHarrington/walterHarrington.jpg";
    case "margaret":
      return "/images/characters/margaretSullivan/margaretSullivan.png";
  }
}

/**
 * How many characters of a changed notebook line are inked at `elapsedMs`.
 * Reduced motion shows the whole line immediately.
 */
export function handwritingCount(length: number, elapsedMs: number, reduced: boolean): number {
  if (length <= 0) return 0;
  if (reduced || elapsedMs >= HANDWRITING_MS) return length;
  if (elapsedMs <= 0) return 0;
  return Math.min(length, Math.ceil((elapsedMs / HANDWRITING_MS) * length));
}

export function applyReturnGreeting(
  opening: StoryEntry[],
  speaker: string,
  greeting: string | null,
  mode: "replace" | "prepend",
): StoryEntry[] {
  if (!greeting) return opening;
  if (mode === "prepend") return [npc(speaker, greeting), ...opening];
  let replaced = false;
  return opening.map((entry) => {
    if (replaced || entry.type !== "conversation" || entry.character === "Ethan") return entry;
    replaced = true;
    return { ...entry, text: greeting };
  });
}

/** Spoken once, the first return visit after Margaret reaches +2. */
export function margaretGossipLines(): StoryEntry[] {
  return [
    npc(
      "Margaret",
      "Mrs. Elrod sat right there. Said she heard footsteps in her yard, the night before she was killed. I thought she was imagining it.",
    ),
    ethan("Did she tell Walter?"),
    npc("Margaret", "Honey, she told everybody. Nobody listened."),
  ];
}

export function buildNpcOpening(input: {
  opening: StoryEntry[];
  person: TrustPerson | null;
  trust: number;
  returning: boolean;
  mode?: "replace" | "prepend";
  gossipHeard?: boolean;
  /** Repeat-visit line is already the opening. Leave it, and skip gossip. */
  skipGreeting?: boolean;
}): { opening: StoryEntry[]; gossipShown: boolean } {
  if (input.skipGreeting) return { opening: input.opening, gossipShown: false };
  const greeting = input.person
    ? returnGreeting(input.person, input.trust, input.returning)
    : null;
  const withGreeting = applyReturnGreeting(
    input.opening,
    input.person ? SPEAKER[input.person] : "",
    greeting,
    input.mode ?? "replace",
  );
  const showGossip = Boolean(
    input.person === "margaret"
    && input.returning
    && input.trust >= 2
    && greeting
    && !input.gossipHeard,
  );
  if (!showGossip) return { opening: withGreeting, gossipShown: false };
  return { opening: [...withGreeting, ...margaretGossipLines()], gossipShown: true };
}

/** Money a priced reply actually takes. Margaret's coffee is free at +2. */
export function pricedEffects(
  choice: { price?: number; freeWhen?: TrustCondition; effects?: ChoiceEffects },
  trust: TrustMap,
): ChoiceEffects | undefined {
  if (choice.price == null) return choice.effects;
  if (choice.freeWhen && meetsTrust(trust, choice.freeWhen)) {
    if (!choice.effects) return undefined;
    const rest = { ...choice.effects };
    delete rest.money;
    return Object.keys(rest).length ? rest : undefined;
  }
  return { ...choice.effects, money: (choice.effects?.money ?? 0) - choice.price };
}

export function canAffordPricedChoice(
  choice: { price?: number; freeWhen?: TrustCondition },
  trust: TrustMap,
  money: number,
): boolean {
  if (choice.price == null) return true;
  if (choice.freeWhen && meetsTrust(trust, choice.freeWhen)) return true;
  return money >= choice.price;
}

type LegacySave = {
  trust?: Partial<Record<TrustPerson, number>> | null;
  met?: readonly string[] | null;
  momTalked?: boolean;
  storyFlags?: Partial<Record<string, boolean>>;
  quests?: { id: string; status: string; step?: string }[];
};

/**
 * Old saves have no `trust` field. Margaret still starts at +1.
 * If What Walter Said is already completed, Rachel starts at +1 on the
 * Told her path and -1 on Shut her out.
 */
export function migrateTrust(save: LegacySave | null | undefined): TrustMap {
  const base = defaultTrust();
  if (!save) return base;
  if (save.trust) {
    return {
      rachel: clampTrust("rachel", save.trust.rachel ?? 0),
      linda: clampTrust("linda", save.trust.linda ?? 0),
      walter: clampTrust("walter", save.trust.walter ?? 0),
      margaret: clampTrust("margaret", save.trust.margaret ?? 1),
    };
  }

  const quest = save.quests?.find((item) => item.id === "what-walter-said");
  const completed = quest?.status === "completed";
  let rachel = 0;
  if (completed) {
    const shut = Boolean(save.storyFlags?.rachelShutOut) || quest?.step === "shut";
    const told = Boolean(save.storyFlags?.rachelTrusted) || quest?.step === "done";
    if (shut) rachel = -1;
    else if (told) rachel = 1;
  }
  return { ...base, rachel };
}

/** People Ethan has already met, oldest first. Missing on old saves: infer from flags. */
export function migrateMet(save: LegacySave | null | undefined): TrustPerson[] {
  if (!save) return [];
  if (Array.isArray(save.met)) {
    const seen = new Set<TrustPerson>();
    const ordered: TrustPerson[] = [];
    for (const name of save.met) {
      const person = TRUST_PEOPLE.find((candidate) => candidate === name);
      if (!person || seen.has(person)) continue;
      seen.add(person);
      ordered.push(person);
    }
    return ordered;
  }

  const met: TrustPerson[] = [];
  const talk = save.quests?.find((quest) => quest.id === "talk-to-mom");
  const lindaMet = save.momTalked === true
    || talk?.status === "completed"
    || (save.momTalked === undefined && !save.quests);
  if (lindaMet) met.push("linda");
  if (save.storyFlags?.rachelMet) met.push("rachel");
  if (save.storyFlags?.walterStationTalk) met.push("walter");
  return met;
}

/** Sleep sets rachelWaited when he promised to come back and has not. */
export function shouldMarkRachelWaited(flags: {
  rachelComebackAsked?: boolean;
  rachelFollowedUp?: boolean;
}): boolean {
  return Boolean(flags.rachelComebackAsked) && !flags.rachelFollowedUp;
}
