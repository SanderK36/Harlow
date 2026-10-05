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
  | "sanatoriumSeenFromStreet"
  | "sanatoriumCigaretteSeen"
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
      default: "Mom should be in the kitchen. She'll have heard about Mrs. Elrod by now.",
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
      default: "Yellow tape on Elrod Street. Go see what's left.",
      rachel: "Talk to Rachel at the Elrod house.",
      done: "Rachel told you to see Walter.",
    },
  },
  "down-to-the-station": {
    id: "down-to-the-station",
    title: "Down to the Station",
    objectives: {
      default: "Walter's at the station. Tell him what you saw.",
      done: "Walter knows. That drawer was still open.",
    },
  },
  "what-walter-said": {
    id: "what-walter-said",
    title: "What Walter Said",
    objectives: {
      default: "Rachel's waiting out front. Tell her what Walter said. Or don't.",
      done: "You told Rachel what you could.",
      shut: "You shut Rachel out.",
    },
  },
  "faded-poster": {
    id: "faded-poster",
    title: "Faded Poster",
    objectives: {
      default: "Mom needs coffee from Margaret's. Check the board while you're there.",
      coffee: "Got the coffee. Bring Mom the poster too.",
      done: "Mom saw the poster. She changed the subject.",
    },
  },
  "light-on-the-hill": {
    id: "light-on-the-hill",
    title: "Light on the Hill",
    objectives: {
      default: "One window lit on the hill. Take a flashlight.",
      inside: "Someone was just here. Look around.",
      done: "A warm cigarette. Chapter over.",
    },
  },
};

/** Kept for older call sites that still import the name. */
export const findAJobQuest = {
  title: QUEST_DEFS["find-a-job"].title,
  objective: QUEST_DEFS["find-a-job"].objectives.default,
};

export function questObjective(progress: QuestProgress): string {
  const def = QUEST_DEFS[progress.id];
  if (!def) return progress.id;
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
}): QuestProgress[] {
  if (save.quests && Array.isArray(save.quests)) {
    return save.quests;
  }

  const quests: QuestProgress[] = [];
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
  } else if (save.momJobConcernHeard) {
    quests.push({ id: "find-a-job", status: "active" });
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
