export type JobId = "needle-groove" | "gas-station" | "scrapyard";

export const jobDetails: Record<JobId, { name: string; employer: string; benefit: string }> = {
  "needle-groove": {
    name: "Needle & Groove",
    employer: "Johnny at Needle & Groove",
    benefit: "Johnny tells you more about town when you talk.",
  },
  "gas-station": {
    name: "Harlow Gas & Service",
    employer: "Ray Mercer at the gas station",
    benefit: "50% off gas-station shop items.",
  },
  scrapyard: {
    name: "Scrapyard",
    employer: "Big Roy at the scrapyard",
    benefit: "A sturdy crowbar. It pries locks open, and it works as a weapon.",
  },
};

/** Quest ids used by Chapter 1 and the opening. */
export type QuestId =
  | "talk-to-mom"
  | "find-a-job"
  | "the-tape"
  | "down-to-the-station"
  | "what-walter-said"
  | "faded-poster"
  | "light-on-the-hill"
  | "the-gate"
  | "emilys-room"
  | "old-friends"
  | "emilys-stone"
  | "before-everything"
  | "rachel-remembers"
  | "miller-lake";

export type QuestStatus = "active" | "completed";

export type QuestProgress = {
  id: QuestId;
  status: QuestStatus;
  /** Optional step id for the quest log objective text. */
  step?: string;
};

export type StoryFlag =
  | "momJobConcern"
  /** Ethan said "I'll find a way to help." Find a Job starts here, not on Mom's concern. */
  | "willHelpMom"
  | "rachelMet"
  | "walterStationTalk"
  | "fileDrawerSeen"
  /** Later visit: Ethan opened the closed file on Walter's desk. */
  | "emilyFileOpened"
  | "rachelTrusted"
  | "rachelKnowsHood"
  | "rachelKnowsFile"
  | "rachelShutOut"
  /** Ethan told Rachel he'd come back after Walter. */
  | "rachelComebackAsked"
  /** He talked to her again before sleeping. */
  | "rachelFollowedUp"
  /** He slept before that second talk. */
  | "rachelWaited"
  /** He brought Emily's poster up with Linda. Trust does not move. */
  | "lindaPosterRaised"
  /** Margaret's +2 gossip has already been said. */
  | "margaretGossipHeard"
  | "posterFound"
  /** First visit to the diner interior, before the missing poster is found. */
  | "dinerBoardHintSeen"
  | "posterShownToMom"
  | "coffeeErrandHeard"
  | "coffeeDelivered"
  | "sanatoriumSeenFromStreet"
  | "sanatoriumCigaretteSeen"
  | "sanatoriumEntranceFear"
  | "sanatoriumHallwayFear"
  | "tapeSeen"
  /** Once, after Rachel's first talk is heard through and the tape is still unseen. Locks nothing. */
  | "rachelTapeStare"
  /** Earl told Ethan to look somewhere else. Hides "Just looking." */
  | "earlLookElsewhere"
  | "chapter1Complete"
  /** Margaret's gossip started The Gate. */
  | "bootPrintSeen"
  /** One of the three things in Emily's room. */
  | "emilyMusicBoxSeen"
  | "emilyPolaroidSeen"
  /** The note is what puts Dad's box in the attic. */
  | "emilyNoteRead"
  | "waltPhotoSeen"
  /** Saturday's Harlow Gazette, picked up off the porch step. */
  | "gazetteFound"
  /** Corkboard link Walt & me + PARKER, E. Old Friends can start. */
  | "waltParkerLinked"
  /** Sunday morning pine needles by the Parkers' door. */
  | "porchNeedlesSeen"
  /** Saturday night. The hill is only dark; the quest waits for Sunday. */
  | "hillDarkTonight"
  /** Sunday evening. The hill stayed dark because the boot print is still missing. */
  | "hillPrintHint"
  /** The 02:00 call on the first night. Once, whether he answered or not. */
  | "nightCallHeard"
  /** He answered. No rain at home until morning. */
  | "nightCallClear"
  /** Hair tie beside the sanatorium cigarette. */
  | "hairTieFound"
  /** Emily's headstone, day 2. */
  | "emilyStoneSeen"
  | "freshFlowersSeen"
  | "everySundayHeard"
  | "woodsRoadTold"
  | "dad1966Told"
  | "daytimeFigureSeen"
  | "trailFollowed"
  | "room6Heard"
  /** Walter walked in on the folder. Locked until the next day. */
  | "folderLockedToday"
  /** He has been caught at the folder at least once. */
  | "folderCaught"
  /** The second time Walter caught him. */
  | "folderSnoopHeard"
  /** Linda asked about the 02:00 call, Sunday morning. */
  | "lindaPhoneHeard"
  /** Rachel's first talk on Sunday. */
  | "rachelDay2Talk"
  /** Margaret, once on Sunday. */
  | "margaretShotgun"
  /** Earl, the visit after Room 6. */
  | "earlCashHeard"
  /** Sunday afternoon map, once. */
  | "cemeteryLunchHeard"
  /** Rachel bought one look at the folder. */
  | "rachelFolderCover"
  | "oldFriendsDone"
  /** Sunday night, upstairs. Her door is open. Locks nothing. */
  | "emilyDoorAjar"
  /** The music-box lid line, once, after the door. */
  | "emilyMusicBoxLid"
  /** He went inside the sanatorium. The gravel walk home never plays. */
  | "sanatoriumEntered"
  /** Footsteps on the road home, once. */
  | "gravelFootsteps"
  /** Sighting 1. Across the street, the first time outside after The Gate. */
  | "streetStalkerSeen"
  /** Sighting 2. His reflection in the diner window. */
  | "dinerWindowSeen"
  /** Linda's back door. Once, after the diner window. */
  | "backDoorOpen"
  /** Night 2. The music box in the receiver. */
  | "musicBoxCall"
  /** The sanatorium closet. */
  | "endingHid"
  /** He ran. */
  | "endingRan"
  /** Once, at a door that does not open. */
  | "lockCheckHeard"
  /** Margaret, Sunday, once. */
  | "margaretDeadbolts"
  /** Earl, Sunday, after Room 6, once. */
  | "earlTowels";

export type QuestDef = {
  id: QuestId;
  title: string;
  /** Objective text for the log, keyed by step (default used when step is missing). */
  objectives: Record<string, string> & { default: string };
};

export const QUEST_DEFS: Record<QuestId, QuestDef> = {
  "talk-to-mom": {
    id: "talk-to-mom",
    title: "Talk to Mom",
    objectives: {
      default: "Mom's in the kitchen.",
    },
  },
  "find-a-job": {
    id: "find-a-job",
    title: "Find a Job",
    objectives: {
      default: "There's got to be a way to help out.",
      flyer: "One of those leads is worth following up.",
      working: "You're working. That helps.",
    },
  },
  "the-tape": {
    id: "the-tape",
    title: "The Tape",
    objectives: {
      default: "Tape on Elrod Street. Go look.",
      /** Set the moment Look at the tape runs (tapeSeen). */
      rachel: "Rachel's at the tape.",
      done: "Rachel said talk to Walter.",
    },
  },
  "down-to-the-station": {
    id: "down-to-the-station",
    title: "Down to the Station",
    objectives: {
      default: "Walter's at the station.",
      done: "That file was still in his drawer. PARKER, E.",
    },
  },
  "what-walter-said": {
    id: "what-walter-said",
    title: "What Walter Said",
    objectives: {
      default: "Rachel will want to know.",
      /** Trusted (hood or file). */
      done: "Told her.",
      shut: "Shut her out.",
    },
  },
  "faded-poster": {
    id: "faded-poster",
    /** After posterFound; before that questTitle() returns "Coffee for Mom". */
    title: "Faded Poster",
    objectives: {
      default: "Mom wants coffee. Margaret's.",
      coffee: "Got the coffee.",
      /** Coffee handed over before the poster. She asks about the board. */
      delivered: "Coffee's with Mom. She asked about Margaret's board.",
      poster: "Emily. Missing. Show Mom.",
      both: "Coffee. And Emily. Go home.",
      done: "Showed Mom. She changed the subject.",
    },
  },
  "light-on-the-hill": {
    id: "light-on-the-hill",
    title: "Light on the Hill",
    objectives: {
      default: "One light on the hill.",
      inside: "One light on the hill.",
      done: "Still burning. Someone was just here.",
    },
  },
  "the-gate": {
    id: "the-gate",
    title: "The Gate",
    objectives: {
      default: "Footsteps in her yard. The night before.",
      print: "A boot print by the porch steps. Pine needles.",
      done: "Pine needles by her steps. The gate faces the woods.",
    },
  },
  "emilys-room": {
    id: "emilys-room",
    title: "Emily's Room",
    objectives: {
      default: "Her room. Nobody's touched it.",
      done: "Walter was already a cop. Dad's face is scratched out.",
    },
  },
  "old-friends": {
    id: "old-friends",
    title: "Old Friends",
    objectives: {
      default: "Walter and Dad. The cemetery, Sunday afternoon.",
      done: "Every Sunday. Somebody should.",
    },
  },
  "emilys-stone": {
    id: "emilys-stone",
    title: "Emily's Stone",
    objectives: {
      default: "Her stone. No second date.",
      done: "Fresh flowers. Not from Mom.",
    },
  },
  "before-everything": {
    id: "before-everything",
    title: "Before Everything",
    objectives: {
      default: "Ask Mom why Dad left.",
      done: "Spring of '66. Or all she'll say.",
    },
  },
  "rachel-remembers": {
    id: "rachel-remembers",
    title: "Rachel Remembers",
    objectives: {
      default: "Rachel was ten. She saw something.",
      done: "The woods road. Walking up.",
    },
  },
  "miller-lake": {
    id: "miller-lake",
    title: "Miller Lake",
    objectives: {
      default: "Dad and Walter's spot. Nobody fishes there anymore.",
      done: "The cabin. Blanket's still warm.",
    },
  },
};

export type QuestObjectiveContext = {
  inventory?: string[];
  storyFlags?: Partial<Record<StoryFlag, boolean>>;
};

/** True once Ethan has found Emily's poster (item or flag). */
export function hasFoundPoster(
  ctx: QuestObjectiveContext = {},
): boolean {
  const inventory = ctx.inventory ?? [];
  return (
    inventory.includes("Missing Poster")
    || Boolean(ctx.storyFlags?.posterFound)
  );
}

/** Mom already sent Ethan for coffee, and he has not brought it back. */
export function coffeeErrandOpen(
  flags: Partial<Record<StoryFlag, boolean>> | undefined,
) {
  return Boolean(flags?.coffeeErrandHeard) && !flags?.coffeeDelivered;
}

/**
 * Notebook / toast title. Faded Poster stays "Coffee for Mom" until
 * posterFound so the log never spoils the diner board.
 */
export function questTitle(
  progress: QuestProgress | QuestId,
  ctx: QuestObjectiveContext = {},
): string {
  const id = typeof progress === "string" ? progress : progress.id;
  const status = typeof progress === "string" ? undefined : progress.status;
  if (id === "faded-poster") {
    if (status === "completed" || hasFoundPoster(ctx)) return "Faded Poster";
    return "Coffee for Mom";
  }
  return QUEST_DEFS[id]?.title ?? id;
}

/**
 * Notebook line for a quest. Faded Poster middle lines are derived from
 * inventory / posterFound so coffee-vs-poster order does not matter.
 */
export function questObjective(
  progress: QuestProgress,
  ctx: QuestObjectiveContext = {},
): string {
  const def = QUEST_DEFS[progress.id];
  if (!def) return progress.id;

  if (progress.id === "faded-poster" && progress.status === "active") {
    const inventory = ctx.inventory ?? [];
    const hasCoffee = inventory.includes("Coffee");
    const hasPoster = hasFoundPoster(ctx);
    const coffeeDelivered = Boolean(ctx.storyFlags?.coffeeDelivered);
    if (hasCoffee && hasPoster) return def.objectives.both;
    if (hasCoffee) return def.objectives.coffee;
    if (hasPoster) return def.objectives.poster;
    // Handed Mom the coffee before finding the poster — don't re-ask for coffee.
    if (coffeeDelivered) return def.objectives.delivered;
    return def.objectives.default;
  }

  // The drawer close-up is what the player actually saw. Completing the
  // station talk without it is Walter sending Ethan home, not the file.
  if (
    progress.id === "down-to-the-station"
    && (progress.status === "completed" || progress.step === "done")
  ) {
    return ctx.storyFlags?.fileDrawerSeen
      ? "That file was still in his drawer. PARKER, E."
      : "Walter said go home. He knows something.";
  }

  const step = progress.step;
  if (step && def.objectives[step]) return def.objectives[step];
  return def.objectives.default;
}

export function isQuestActive(quests: QuestProgress[], id: QuestId) {
  return quests.some((quest) => quest.id === id && quest.status === "active");
}

/** The cabin is the last beat. A save already standing there is finished. */
export function millerLakeAfterCabin(quests: QuestProgress[], sceneId: string | undefined) {
  if (sceneId !== "miller-cabin" || !isQuestActive(quests, "miller-lake")) return quests;
  return completeQuest(quests, "miller-lake", "done");
}

export function isQuestCompleted(quests: QuestProgress[], id: QuestId) {
  return quests.some((quest) => quest.id === id && quest.status === "completed");
}

/**
 * Diner travel and other "Mom has been talked to" gates. True when the
 * migrated quest list has Talk to Mom completed, so a save that finished
 * the talk cannot come back without the Diner.
 */
export function resolveMomTalked(
  quests: QuestProgress[],
): boolean {
  return isQuestCompleted(quests, "talk-to-mom");
}

/** Build quest state from a legacy save that only had mom/job fields. */
export function migrateQuestsFromLegacy(save: {
  momTalked?: boolean;
  momJobConcernHeard?: boolean;
  job?: JobId | null;
  jobQuestTarget?: JobId | null;
  quests?: QuestProgress[];
  storyFlags?: Partial<Record<string, boolean>>;
  clues?: readonly string[] | null;
  askedAbout?: {
    rachel?: readonly string[];
    walter?: readonly string[];
  } | null;
}): QuestProgress[] {
  let quests: QuestProgress[];
  if (save.quests && Array.isArray(save.quests)) {
    quests = [...save.quests];
  } else {
    quests = [];
    if (save.momTalked === false) {
      quests.push({ id: "talk-to-mom", status: "active" });
    } else {
      // Missing or true: already talked (legacy default was true).
      quests.push({ id: "talk-to-mom", status: "completed" });
    }

    if (save.job) {
      quests.push({ id: "find-a-job", status: "completed", step: "working" });
    } else if (save.jobQuestTarget) {
      quests.push({ id: "find-a-job", status: "active", step: "flyer" });
    } else if (save.storyFlags?.willHelpMom) {
      // Legacy saves with only momJobConcernHeard have not committed yet.
      quests.push({ id: "find-a-job", status: "active" });
    }
  }

  // Saves that already have a quest list still pick up the pledge if the
  // entry itself never got written.
  if (
    save.storyFlags?.willHelpMom
    && !quests.some((quest) => quest.id === "find-a-job")
  ) {
    quests.push({
      id: "find-a-job",
      status: save.job ? "completed" : "active",
      step: save.job ? "working" : save.jobQuestTarget ? "flyer" : undefined,
    });
  }

  // Talk to Mom done (quest entry or the legacy flag) always carries The Tape.
  // A list that still has the talk marked active is left alone when the flag
  // is missing — only an explicit `momTalked: true` completes it.
  if (save.momTalked === true) {
    if (!quests.some((quest) => quest.id === "talk-to-mom")) {
      quests.push({ id: "talk-to-mom", status: "completed" });
    } else {
      quests = completeQuest(quests, "talk-to-mom");
    }
  } else if (
    save.momTalked !== false
    && !quests.some((quest) => quest.id === "talk-to-mom")
  ) {
    quests.push({ id: "talk-to-mom", status: "completed" });
  }

  const momDone = quests.some(
    (quest) => quest.id === "talk-to-mom" && quest.status === "completed",
  );
  if (momDone && !quests.some((quest) => quest.id === "the-tape")) {
    quests.push({ id: "the-tape", status: "active" });
  }

  // Coffee for Mom / Faded Poster: start if Ethan heard the errand OR already
  // found the poster. Never strip an existing active/completed entry.
  const heardCoffee = Boolean(save.storyFlags?.coffeeErrandHeard);
  const foundPoster = Boolean(save.storyFlags?.posterFound);
  if (
    (heardCoffee || foundPoster)
    && !quests.some((quest) => quest.id === "faded-poster")
  ) {
    quests.push({ id: "faded-poster", status: "active" });
  }

  let next = migrateSideQuests(quests, save.storyFlags as Partial<Record<StoryFlag, boolean>> | undefined, save.askedAbout);
  if (saveHadAlgebraBook(save)) next = completeQuest(next, "miller-lake", "done");
  return next;
}

/** The algebra book is gone. A save that already found it finished Miller Lake. */
export function saveHadAlgebraBook(save: {
  clues?: readonly string[] | null;
  storyFlags?: Partial<Record<string, boolean>> | null;
}) {
  return Boolean(
    save.storyFlags?.algebraBookFound
    || save.clues?.includes("algebra-book"),
  );
}

/** Drop flags that no longer exist so they are not written back out. */
export function withoutRetiredFlags(
  flags: Partial<Record<string, boolean>> | undefined,
): Partial<Record<StoryFlag, boolean>> {
  if (!flags) return {};
  const next: Partial<Record<string, boolean>> = { ...flags };
  delete next.algebraBookFound;
  return next as Partial<Record<StoryFlag, boolean>>;
}

function askedAboutBootPrint(asked: {
  rachel?: readonly string[];
  walter?: readonly string[];
} | null | undefined) {
  return Boolean(
    asked?.rachel?.includes("boot-print") || asked?.walter?.includes("boot-print"),
  );
}

/**
 * The Gate and Emily's Room are optional. An old save that already heard
 * the gossip, found the print, or opened Emily's things picks the step up
 * without touching the main story.
 */
export function migrateSideQuests(
  quests: QuestProgress[],
  flags: Partial<Record<StoryFlag, boolean>> | undefined,
  asked?: { rachel?: readonly string[]; walter?: readonly string[] } | null,
): QuestProgress[] {
  let next = quests;
  const heardGossip = Boolean(flags?.margaretGossipHeard);
  const sawPrint = Boolean(flags?.bootPrintSeen);
  const askedGate = askedAboutBootPrint(asked);
  if (heardGossip && !next.some((quest) => quest.id === "the-gate")) {
    if (askedGate) next = completeQuest(next, "the-gate", "done");
    else if (sawPrint) next = startQuest(next, "the-gate", "print");
    else next = startQuest(next, "the-gate");
  } else if (heardGossip && isQuestActive(next, "the-gate")) {
    if (askedGate) next = completeQuest(next, "the-gate", "done");
    else if (sawPrint) {
      const step = next.find((quest) => quest.id === "the-gate")?.step;
      if (step !== "print") next = setQuestStep(next, "the-gate", "print");
    }
  }

  const looked = Boolean(
    flags?.emilyMusicBoxSeen || flags?.emilyPolaroidSeen || flags?.emilyNoteRead,
  );
  const sawPhoto = Boolean(flags?.waltPhotoSeen);
  if ((looked || sawPhoto) && !next.some((quest) => quest.id === "emilys-room")) {
    next = sawPhoto
      ? completeQuest(next, "emilys-room", "done")
      : startQuest(next, "emilys-room");
  } else if (sawPhoto && isQuestActive(next, "emilys-room")) {
    next = completeQuest(next, "emilys-room", "done");
  }

  return next;
}

/** Gossip is the only way The Gate begins. */
export function startTheGate(quests: QuestProgress[]): { quests: QuestProgress[]; started: boolean } {
  if (quests.some((quest) => quest.id === "the-gate")) return { quests, started: false };
  return { quests: startQuest(quests, "the-gate"), started: true };
}

export function advanceGatePrint(quests: QuestProgress[]): QuestProgress[] {
  if (!isQuestActive(quests, "the-gate")) return quests;
  if (quests.find((quest) => quest.id === "the-gate")?.step === "print") return quests;
  return setQuestStep(quests, "the-gate", "print");
}

export function finishGate(quests: QuestProgress[]): { quests: QuestProgress[]; completed: boolean } {
  if (isQuestCompleted(quests, "the-gate")) return { quests, completed: false };
  return { quests: completeQuest(quests, "the-gate", "done"), completed: true };
}

/** The first of the three looks starts the sidequest. Later looks do not restart it. */
export function startEmilyRoom(quests: QuestProgress[]): { quests: QuestProgress[]; started: boolean } {
  if (quests.some((quest) => quest.id === "emilys-room")) return { quests, started: false };
  return { quests: startQuest(quests, "emilys-room"), started: true };
}

export function finishEmilyRoom(quests: QuestProgress[]): { quests: QuestProgress[]; completed: boolean } {
  if (isQuestCompleted(quests, "emilys-room")) return { quests, completed: false };
  return { quests: completeQuest(quests, "emilys-room", "done"), completed: true };
}

function upsertQuest(
  quests: QuestProgress[],
  id: QuestId,
  status: QuestStatus,
  step?: string,
): QuestProgress[] {
  const existing = quests.find((quest) => quest.id === id);
  if (existing) {
    return quests.map((quest) =>
      quest.id === id
        ? { ...quest, status, step: step ?? quest.step }
        : quest,
    );
  }
  return [...quests, { id, status, step }];
}

export function startQuest(quests: QuestProgress[], id: QuestId, step?: string) {
  if (quests.some((quest) => quest.id === id)) return quests;
  return upsertQuest(quests, id, "active", step);
}

export function completeQuest(quests: QuestProgress[], id: QuestId, step?: string) {
  return upsertQuest(quests, id, "completed", step);
}

export function setQuestStep(quests: QuestProgress[], id: QuestId, step: string) {
  const existing = quests.find((quest) => quest.id === id);
  if (!existing) return startQuest(quests, id, step);
  if (existing.status === "completed") return quests;
  return upsertQuest(quests, id, "active", step);
}
