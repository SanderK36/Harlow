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
  | "light-on-the-hill";

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
  | "rachelTrusted"
  | "rachelKnowsHood"
  | "rachelKnowsFile"
  | "rachelShutOut"
  | "posterFound"
  | "posterShownToMom"
  | "coffeeErrandHeard"
  | "coffeeDelivered"
  | "sanatoriumSeenFromStreet"
  | "sanatoriumCigaretteSeen"
  | "sanatoriumEntranceFear"
  | "sanatoriumHallwayFear"
  | "tapeSeen"
  /** Earl told Ethan to look somewhere else. Hides "Just looking." */
  | "earlLookElsewhere"
  | "chapter1Complete";

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
      done: "That drawer was still open. PARKER, E.",
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
      delivered: "Coffee's with Mom.",
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
      done: "Warm cigarette. Someone was here.",
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

  const step = progress.step;
  if (step && def.objectives[step]) return def.objectives[step];
  return def.objectives.default;
}

export function isQuestActive(quests: QuestProgress[], id: QuestId) {
  return quests.some((quest) => quest.id === id && quest.status === "active");
}

export function isQuestCompleted(quests: QuestProgress[], id: QuestId) {
  return quests.some((quest) => quest.id === id && quest.status === "completed");
}

export function getQuest(quests: QuestProgress[], id: QuestId) {
  return quests.find((quest) => quest.id === id);
}

/** Build quest state from a legacy save that only had mom/job fields. */
export function migrateQuestsFromLegacy(save: {
  momTalked?: boolean;
  momJobConcernHeard?: boolean;
  job?: JobId | null;
  jobQuestTarget?: JobId | null;
  quests?: QuestProgress[];
  storyFlags?: Partial<Record<StoryFlag, boolean>>;
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

  // Old saves that already talked to Mom still need The Tape.
  const momDone =
    save.momTalked !== false
    || quests.some((quest) => quest.id === "talk-to-mom" && quest.status === "completed");
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

  return quests;
}

export function upsertQuest(
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
