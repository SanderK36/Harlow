import type { ClueId, AskedAbout, ClueConnectionId } from "@/game/clues";
import { waltAskUnlocked } from "@/game/clues";
import { ethan, npc, type StoryEntry } from "@/game/story";
import type { TrustMap, TrustPerson } from "@/game/trust";

/** The conversation choice that opens the clue notes. */
export const ASK_ABOUT_LABEL = "Ask about…";

/** Ethan says this, then the ordinary choices come back. */
export const NEVER_MIND_LINE = "Never mind.";

const ASK_AGAIN: Record<"rachel" | "linda" | "walter", string> = {
  rachel: "You already asked me that, Ethan.",
  linda: "We talked about this, honey.",
  walter: "I heard you the first time.",
};

const SPEAKER: Record<TrustPerson, string> = {
  rachel: "Rachel",
  linda: "Linda",
  walter: "Walter",
  margaret: "Margaret",
};

const BOOT_PROMPT = "Somebody left a boot print by Mrs. Elrod's gate.";
const WALT_WALTER = "I found a picture of you and Dad. Miller Lake, '64.";
const WALT_LINDA = "I found a picture of Dad and Walter at Miller Lake.";

export type TrustBand = "high" | "mid" | "low";

/** >= +1, 0, and <= -1. The number itself is never shown. */
export function trustBand(trust: number): TrustBand {
  if (trust >= 1) return "high";
  if (trust <= -1) return "low";
  return "mid";
}

/**
 * Clues this person can be asked about. Walt & me waits for the corkboard
 * connection with PARKER, E. Boot print only needs the clue.
 */
export function askTopicsFor(
  person: TrustPerson,
  clues: readonly ClueId[],
  connections: readonly ClueConnectionId[],
): ClueId[] {
  const topics: ClueId[] = [];
  if ((person === "rachel" || person === "walter") && clues.includes("boot-print")) {
    topics.push("boot-print");
  }
  if ((person === "walter" || person === "linda") && waltAskUnlocked(connections)) {
    topics.push("walt-and-me");
  }
  return topics;
}

export function alreadyAsked(asked: AskedAbout, person: TrustPerson, clue: ClueId): boolean {
  return Boolean(asked[person]?.includes(clue));
}

export function markAsked(asked: AskedAbout, person: TrustPerson, clue: ClueId): AskedAbout {
  const current = asked[person] ?? [];
  if (current.includes(clue)) return asked;
  return { ...asked, [person]: [...current, clue] };
}

/** Asking Rachel or Walter about the boot print finishes The Gate, whatever they answer. */
export function askCompletesGate(person: TrustPerson, clue: ClueId): boolean {
  return clue === "boot-print" && (person === "rachel" || person === "walter");
}

function bootLines(person: "rachel" | "walter", band: TrustBand): StoryEntry[] {
  const speaker = SPEAKER[person];
  if (person === "rachel") {
    if (band === "high") {
      return [
        ethan(BOOT_PROMPT),
        npc(speaker, "Pine needles? Nothing like that on this street. That's from up on the hill."),
        ethan("The woods by the sanatorium."),
        npc(speaker, "Ethan. Don't go up there alone."),
      ];
    }
    if (band === "low") {
      return [ethan(BOOT_PROMPT), npc(speaker, "Funny. Now you want to talk.")];
    }
    return [ethan(BOOT_PROMPT), npc(speaker, "Lots of people walk that street. Could be anyone's.")];
  }
  if (band === "high") {
    return [
      ethan(BOOT_PROMPT),
      npc(speaker, "You were by that gate?"),
      ethan("Just looking."),
      npc(speaker, "Then keep it to yourself. I mean it, kid."),
    ];
  }
  if (band === "low") {
    return [
      ethan(BOOT_PROMPT),
      npc(speaker, "And what were you doing inside my tape?"),
      ethan("Just looking."),
      npc(speaker, "Don't."),
    ];
  }
  return [ethan(BOOT_PROMPT), npc(speaker, "Half this town wears boots, Ethan.")];
}

function waltLines(person: "walter" | "linda", band: TrustBand): StoryEntry[] {
  const speaker = SPEAKER[person];
  if (person === "walter") {
    const opening = ethan(WALT_WALTER);
    if (band === "high") {
      return [
        opening,
        npc(speaker, "Long time ago. We were different people."),
        ethan("You kept Emily's file."),
        npc(speaker, "Some things you don't put away, kid."),
      ];
    }
    if (band === "low") {
      return [
        opening,
        npc(speaker, "Going through your dad's things? He wouldn't like that. Neither do I."),
      ];
    }
    return [opening, npc(speaker, "That was a long time ago. Leave it there.")];
  }
  const opening = ethan(WALT_LINDA);
  if (band === "high") {
    return [
      opening,
      npc(speaker, "They were close. Before."),
      ethan("Before what?"),
      npc(speaker, "Before everything, honey."),
    ];
  }
  if (band === "low") {
    return [opening, npc(speaker, "I'm not doing this today, Ethan.")];
  }
  return [
    opening,
    npc(speaker, "Where did you find that?"),
    ethan("In the attic."),
    npc(speaker, "Put it back, please."),
  ];
}

function answerLines(person: TrustPerson, clue: ClueId, band: TrustBand): StoryEntry[] {
  if (clue === "boot-print" && (person === "rachel" || person === "walter")) {
    return bootLines(person, band);
  }
  if (clue === "walt-and-me" && (person === "walter" || person === "linda")) {
    return waltLines(person, band);
  }
  return [];
}

export type AskAboutResult = {
  lines: StoryEntry[];
  /** The same map that was passed in. Ask about never moves trust. */
  trust: TrustMap;
  asked: AskedAbout;
};

/**
 * Pick the answer from the trust Ethan already has. Re-asking plays the
 * ask-again line instead of the day or evening repeat-visit line.
 * Trust is returned untouched.
 */
export function resolveAskAbout(input: {
  person: TrustPerson;
  clue: ClueId;
  trust: TrustMap;
  asked: AskedAbout;
}): AskAboutResult {
  const band = trustBand(input.trust[input.person]);
  const repeated = alreadyAsked(input.asked, input.person, input.clue);
  const lines = repeated && (input.person === "rachel" || input.person === "linda" || input.person === "walter")
    ? [
        ...answerLines(input.person, input.clue, band).slice(0, 1),
        npc(SPEAKER[input.person], ASK_AGAIN[input.person]),
      ]
    : answerLines(input.person, input.clue, band);
  return {
    lines,
    trust: input.trust,
    asked: markAsked(input.asked, input.person, input.clue),
  };
}
