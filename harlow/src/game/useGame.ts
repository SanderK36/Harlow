import { useCallback, useEffect, useRef, useState } from "react";

import { applyEffects, effectsToStory } from "@/game/effects";
import initialGameState from "@/game/gameState";
import player from "@/game/player";
import {
  createBusChoices,
  createWalkingChoices,
  ethanRoom,
  getSceneThought,
  momDeathConversation,
  rachelElrodConversation,
  rachelFrontYardConversation,
  scenes,
} from "@/game/scenes";
import { harlowAudio } from "@/game/audio";
import { hillCheckScene, HILL_THOUGHT, shouldNoticeHill } from "@/game/hill";
import { advanceGameTime, withCanonWeekday } from "@/game/time";
import { isNightTime } from "@/game/utils";
import {
  readMostRecentSave,
  readSaveSlot,
  readSessionSave,
  writeSaveSlot,
  writeSessionSave,
} from "@/game/save";
import type { Choice, GameChoice } from "@/game/choices";
import type { Conversation, ConversationChoice, StoryEntry } from "@/game/story";
import {
  completeQuest,
  isQuestActive,
  isQuestCompleted,
  migrateQuestsFromLegacy,
  resolveMomTalked,
  setQuestStep,
  startQuest,
  type JobId,
  type QuestId,
  type QuestProgress,
  type StoryFlag,
  questTitle,
} from "@/game/quests";
import type { GameState, Weather } from "@/game/types";
import type { CloseupContent } from "@/components/CloseupOverlay/CloseupOverlay";

/**
 * Going through a door: a quick dip to black while the door opens and shuts
 * (the scene swaps while the screen is black). In milliseconds; under 1s.
 */
export const DOOR_FADE_IN = 250;
export const DOOR_HOLD = 350;
export const DOOR_FADE_OUT = 300;
/** With reduced motion there is no fade; doors are just ignored this long. */
const DOOR_REDUCED_MOTION_LOCK = 400;

export type DoorTransitionPhase = "idle" | "closing" | "black" | "opening";

const CONVERSATION_ACTIONS = new Set([
  // Add an action name here when a scene choice should open its conversation data.
  "talkToMom",
  "talkToMarlene",
  "talkToJohnny",
  "talkToWalter",
  "talkToMargaret",
  "talkToEarl",
  "talkToBigRoy",
  "talkToRay",
  "talkToTommy",
  "talkToRachel",
]);

const NPC_REPLY_DELAY = 450;
const TRAVEL_DURATION = 3000;
const BEDTIME_START = 1320;
const BEDTIME_END = 180;
const EXHAUSTION_LOCK_TIME = 210;
/** Slide in, then hold, then fade. The hold is the time the card sits still. */
const LEAD_ENTER_MS = 200;
const LEAD_HOLD_MS = 2000;
const LEAD_EXIT_MS = 300;

const SANATORIUM_SCENE_IDS = new Set([
  "sanatorium",
  "sanatorium-entrance",
  "sanatorium-main-floor",
  "sanatorium-hallway",
  "sanatorium-room-1",
  "sanatorium-room-2",
]);

type QuestNotice = {
  kind: "lead" | "notice";
  label: string;
  message: string;
};

const HOME_SCENE_IDS = new Set([
  "ethan-room",
  "ethan-room-desk",
  "ethan-room-desk-empty",
  "hallway",
  "hallway-upstairs",
  "hallway-upstairs-attic-open",
  "living-room",
  "living-room-relaxing",
  "kitchen",
  "fridge",
  "back-yard",
  "garage",
  "garage-bench",
  "garage-bench-empty",
  "basement",
  "attic",
  "mom-room",
  "emily-room",
  "bathroom",
  "front-yard",
]);

type ShopId = "gas-station" | "needle-groove";

function sceneAfterPickups(
  sceneId: string,
  save: {
    deskCigarettesPickedUp?: boolean;
    scrapyardKnifePickedUp?: boolean;
    garageFlashlightPickedUp?: boolean;
  } | null,
) {
  if (sceneId === "ethan-room-desk" && save?.deskCigarettesPickedUp) return "ethan-room-desk-empty";
  if (sceneId === "scrapyard-desk" && save?.scrapyardKnifePickedUp) return "scrapyard-desk-empty";
  if (sceneId === "garage-bench" && save?.garageFlashlightPickedUp) return "garage-bench-empty";
  return sceneId;
}

export function useGame() {
  const sessionSave = readSessionSave();
  const sessionSceneId = sessionSave
    ? sceneAfterPickups(sessionSave.currentSceneId, sessionSave)
    : null;
  const sessionScene = sessionSceneId
    ? scenes[sessionSceneId as keyof typeof scenes]
    : null;

  // Persistent world and player data. Add a field to its type and initial value
  // before using it in a scene requirement or effect.
  const [gameState, setGameState] = useState(() =>
    withCanonWeekday(sessionSave?.gameState ?? initialGameState),
  );
  const [playerState, setPlayerState] = useState(sessionSave?.playerState ?? player);

  // The currently displayed scene and its short, time-aware thought.
  const [currentScene, setCurrentScene] = useState(sessionScene ?? ethanRoom);
  const [currentThought, setCurrentThought] = useState<string | null>(() => {
    const sceneId = sessionScene?.id ?? ethanRoom.id;
    const loaded = withCanonWeekday(sessionSave?.gameState ?? initialGameState);
    const time = loaded.time;
    const weather = loaded.weather;
    const day = loaded.dayOfWeek;
    const migrated = migrateQuestsFromLegacy(sessionSave ?? { momTalked: true });
    const flags = sessionSave?.storyFlags ?? (
      sessionSave?.momJobConcernHeard ? { momJobConcern: true } : {}
    );
    if (shouldNoticeHill(sceneId, time, migrated, flags)) return HILL_THOUGHT;
    return getSceneThought(sceneId, time, weather, day);
  });
  const [currentEffects, setCurrentEffects] = useState<StoryEntry[]>([]);
  const [lateNightActionThought, setLateNightActionThought] = useState<string | null>(null);
  const [newDayAnnouncement, setNewDayAnnouncement] = useState<GameState | null>(null);
  const lateNightThoughtTimer = useRef<number | null>(null);

  // UI-only state: none of these values are part of the game save/progression.
  const [showStats, setShowStats] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
  const [activeShop, setActiveShop] = useState<ShopId | null>(null);

  // Conversation state is kept separate from scene narration so dialogue can
  // grow as the player selects responses without changing the base scene.
  const [conversation, setConversation] = useState<StoryEntry[]>([]);
  const [conversationActive, setConversationActive] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [usedConversationChoices, setUsedConversationChoices] = useState<string[]>([]);
  const [replyPending, setReplyPending] = useState(false);
  // A closing choice was picked: its reply plays, then the next click closes.
  const [conversationEnding, setConversationEnding] = useState(false);
  // The conversation opened with its jobOpening (Ethan came back as an employee).
  const [openedAsEmployee, setOpenedAsEmployee] = useState(false);
  const replyTimer = useRef<number | null>(null);
  const questNotificationTimer = useRef<number | null>(null);
  const locationDiscoveryTimer = useRef<number | null>(null);
  const noticeQueue = useRef<QuestNotice[]>([]);
  const noticeShowing = useRef(false);
  const announcedNotices = useRef<Set<string>>(new Set());
  // True while dialogue is on screen. Leads wait so the card is not hidden
  // under the conversation (or display:none on a phone).
  const conversationActiveRef = useRef(false);
  const [doorTransition, setDoorTransition] = useState<DoorTransitionPhase>("idle");
  const doorBusy = useRef(false);
  const doorTimers = useRef<number[]>([]);

  useEffect(() => () => {
    doorTimers.current.forEach((timer) => window.clearTimeout(timer));
    if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    if (locationDiscoveryTimer.current !== null) window.clearTimeout(locationDiscoveryTimer.current);
    if (lateNightThoughtTimer.current !== null) window.clearTimeout(lateNightThoughtTimer.current);
  }, []);

  function cancelPendingReply() {
    if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    replyTimer.current = null;
    setReplyPending(false);
  }

  // A non-null destination displays the full-screen travel transition.
  const [travelingTo, setTravelingTo] = useState<{
    location: string;
    method: "walk" | "bus" | "work";
    isNight: boolean;
  } | null>(null);
  // Small pieces of story progress that currently need custom logic. For more
  // flags, consider grouping them into a future `storyFlags` object.
  const [busStopReturnSceneId, setBusStopReturnSceneId] = useState(sessionSave?.busStopReturnSceneId ?? "front-yard");
  const [marleneActive, setMarleneActive] = useState(sessionSave?.marleneActive ?? false);
  const [deskCigarettesPickedUp, setDeskCigarettesPickedUp] = useState(sessionSave?.deskCigarettesPickedUp ?? false);
  const [scrapyardKnifePickedUp, setScrapyardKnifePickedUp] = useState(sessionSave?.scrapyardKnifePickedUp ?? false);
  const [garageFlashlightPickedUp, setGarageFlashlightPickedUp] = useState(sessionSave?.garageFlashlightPickedUp ?? false);
  const [momTalked, setMomTalked] = useState(() =>
    resolveMomTalked(migrateQuestsFromLegacy(sessionSave ?? { momTalked: true })),
  );
  const [momJobConcernHeard, setMomJobConcernHeard] = useState(sessionSave?.momJobConcernHeard ?? false);
  // Completing Find a Job sets one permanent workplace benefit.
  const [job, setJob] = useState<JobId | null>(sessionSave?.job ?? null);
  const [jobQuestTarget, setJobQuestTarget] = useState<JobId | null>(sessionSave?.jobQuestTarget ?? null);
  const [quests, setQuests] = useState<QuestProgress[]>(() => {
    const migrated = migrateQuestsFromLegacy(sessionSave ?? { momTalked: true });
    const sceneId = sessionScene?.id ?? ethanRoom.id;
    const time = sessionSave?.gameState.time ?? initialGameState.time;
    const flags = sessionSave?.storyFlags ?? (
      sessionSave?.momJobConcernHeard ? { momJobConcern: true } : {}
    );
    if (!shouldNoticeHill(sceneId, time, migrated, flags)) return migrated;
    return startQuest(migrated, "light-on-the-hill");
  });
  // React applies setQuests after this handler returns. A second update in the
  // same click must read this list, not the quests from the last render.
  const questsRef = useRef(quests);
  // advanceTime and moveToScene can both see the hill in one click. Cleared
  // after the click so the next scene change can set its own line. A walk
  // checks the destination, so leaving the yard does not set this.
  const hillThoughtShown = useRef(false);
  function markHillThought() {
    hillThoughtShown.current = true;
    queueMicrotask(() => {
      hillThoughtShown.current = false;
    });
  }
  function commitQuests(next: QuestProgress[]) {
    questsRef.current = next;
    setQuests(next);
    return next;
  }
  const [storyFlags, setStoryFlags] = useState<Partial<Record<StoryFlag, boolean>>>(
    () => sessionSave?.storyFlags ?? (
      sessionSave?.momJobConcernHeard ? { momJobConcern: true } : {}
    ),
  );
  const [chapter, setChapter] = useState(sessionSave?.chapter ?? 1);
  const [closeup, setCloseup] = useState<CloseupContent | null>(null);
  const closeupQueue = useRef<CloseupContent[]>([]);
  const [showChapterEnd, setShowChapterEnd] = useState(false);
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const [questNotificationLabel, setQuestNotificationLabel] = useState("NEW LEAD");
  const [questNotificationKind, setQuestNotificationKind] = useState<QuestNotice["kind"]>("lead");
  const [questNotificationExiting, setQuestNotificationExiting] = useState(false);

  function clearQuestNotification() {
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    if (locationDiscoveryTimer.current !== null) window.clearTimeout(locationDiscoveryTimer.current);
    questNotificationTimer.current = null;
    locationDiscoveryTimer.current = null;
    noticeQueue.current = [];
    noticeShowing.current = false;
    announcedNotices.current = new Set();
    setQuestNotification(null);
    setQuestNotificationLabel("NEW LEAD");
    setQuestNotificationKind("lead");
    setQuestNotificationExiting(false);
  }

  function pumpNotices() {
    if (noticeShowing.current || conversationActiveRef.current) return;
    const next = noticeQueue.current.shift();
    if (!next) return;
    noticeShowing.current = true;
    setQuestNotification(next.message);
    setQuestNotificationLabel(next.label);
    setQuestNotificationKind(next.kind);
    setQuestNotificationExiting(false);
    questNotificationTimer.current = window.setTimeout(() => {
      setQuestNotificationExiting(true);
      questNotificationTimer.current = window.setTimeout(() => {
        noticeShowing.current = false;
        setQuestNotification(null);
        setQuestNotificationLabel("NEW LEAD");
        setQuestNotificationKind("lead");
        setQuestNotificationExiting(false);
        questNotificationTimer.current = null;
        pumpNotices();
      }, LEAD_EXIT_MS);
    }, LEAD_ENTER_MS + LEAD_HOLD_MS);
  }

  function enqueueNotice(notice: QuestNotice, key?: string) {
    const dedupeKey = key ?? `${notice.kind}:${notice.label}:${notice.message}`;
    if (announcedNotices.current.has(dedupeKey)) return;
    announcedNotices.current.add(dedupeKey);
    noticeQueue.current.push(notice);
    pumpNotices();
  }

  function enqueueLead(id: QuestId, title?: string) {
    const message = title ?? questTitle(
      { id, status: "active" },
      { inventory: playerState.inventory, storyFlags },
    );
    enqueueNotice({ kind: "lead", label: "NEW LEAD", message }, `lead:${id}`);
  }

  function openHillQuest() {
    const current = questsRef.current;
    if (
      isQuestActive(current, "light-on-the-hill")
      || isQuestCompleted(current, "light-on-the-hill")
    ) {
      return;
    }
    commitQuests(startQuest(current, "light-on-the-hill"));
    enqueueLead("light-on-the-hill", "Light on the Hill");
  }

  function hasFlag(flag: StoryFlag) {
    return Boolean(storyFlags[flag]);
  }

  function hasAllFlags(flags: StoryFlag[] | StoryFlag | undefined) {
    if (!flags) return true;
    const list = Array.isArray(flags) ? flags : [flags];
    return list.every((flag) => hasFlag(flag));
  }

  function hasAnyFlag(flags: StoryFlag[] | StoryFlag | undefined) {
    if (!flags) return false;
    const list = Array.isArray(flags) ? flags : [flags];
    return list.some((flag) => hasFlag(flag));
  }

  function applyFlags(flags: StoryFlag[] | StoryFlag | undefined) {
    if (!flags) return;
    const list = Array.isArray(flags) ? flags : [flags];
    setStoryFlags((previous) => {
      const next = { ...previous };
      for (const flag of list) next[flag] = true;
      return next;
    });
    // Keep legacy mirror in sync.
    if (list.includes("momJobConcern")) setMomJobConcernHeard(true);
  }

  function enqueueCloseup(first: CloseupContent, next?: CloseupContent) {
    closeupQueue.current = next ? [next] : [];
    setCloseup(first);
  }

  function dismissCloseup() {
    const queued = closeupQueue.current.shift();
    if (queued) {
      setCloseup(queued);
      return;
    }
    setCloseup(null);
  }

  function applyQuestHooks(options: {
    startsQuest?: QuestId;
    completesQuest?: QuestId;
    /** Applied only to completesQuest (never to a quest started by the same choice). */
    questStep?: string;
    notifyStart?: string;
    notifyComplete?: string;
  }) {
    // Read the list committed earlier in this same click, then notify from
    // the result. Do not read `quests` from the last render.
    let next = questsRef.current;
    let started: QuestId | undefined;
    let startedHill = false;
    let completedTitle: string | undefined;
    if (options.completesQuest) {
      const wasComplete = isQuestCompleted(next, options.completesQuest);
      next = completeQuest(next, options.completesQuest, options.questStep);
      if (!wasComplete) {
        completedTitle = options.notifyComplete
          ?? questTitle(
            { id: options.completesQuest, status: "completed" },
            { inventory: playerState.inventory, storyFlags },
          );
      }
    }
    if (options.startsQuest) {
      // New quests always open on their default step — never inherit "done".
      const before = next;
      next = startQuest(next, options.startsQuest);
      if (next !== before) started = options.startsQuest;
    }
    // Last prerequisite can finish while Ethan is already in the yard.
    if (shouldNoticeHill(currentScene.id, gameState.time, next, storyFlags)) {
      next = startQuest(next, "light-on-the-hill");
      startedHill = true;
    }
    commitQuests(next);
    if (completedTitle) {
      enqueueNotice({ kind: "notice", label: "Quest complete", message: completedTitle });
    }
    if (started) enqueueLead(started, options.notifyStart);
    if (startedHill) {
      setCurrentThought(HILL_THOUGHT);
      enqueueLead("light-on-the-hill", "Light on the Hill");
    }
  }

  const currentSave = useCallback(() => {
    return {
      version: 1 as const,
      gameState,
      playerState,
      currentSceneId: currentScene.id,
      busStopReturnSceneId,
      marleneActive,
      deskCigarettesPickedUp,
      scrapyardKnifePickedUp,
      garageFlashlightPickedUp,
      momTalked,
      momJobConcernHeard,
      job: job ?? undefined,
      jobQuestTarget: jobQuestTarget ?? undefined,
      quests,
      storyFlags,
      chapter,
    };
  }, [gameState, playerState, currentScene, busStopReturnSceneId, marleneActive, deskCigarettesPickedUp, scrapyardKnifePickedUp, garageFlashlightPickedUp, momTalked, momJobConcernHeard, job, jobQuestTarget, quests, storyFlags, chapter]);

  // This is a temporary, per-tab resume point. It survives refreshes but is
  // automatically cleared when the browser tab is closed.
  useEffect(() => {
    if (readSessionSave()) writeSessionSave(currentSave());
  }, [currentSave]);

  function advanceTime(
    minutes: number,
    completingMomQuest = false,
    bypassExhaustionLock = false,
    destinationSceneId: string | null = null,
  ) {
    // Keep time changes in one place so thoughts and day/night images stay synced.
    const allowedMinutes = momTalked || completingMomQuest
      ? minutes
      : Math.min(minutes, Math.max(0, 539 - gameState.time));
    const minutesUntilExhaustionLock = gameState.time >= EXHAUSTION_LOCK_TIME && gameState.time < 420
      ? 0
      : gameState.time < EXHAUSTION_LOCK_TIME
        ? EXHAUSTION_LOCK_TIME - gameState.time
        : 1440 - gameState.time + EXHAUSTION_LOCK_TIME;
    const timeToAdvance = bypassExhaustionLock
      ? allowedMinutes
      : Math.min(allowedMinutes, minutesUntilExhaustionLock);
    const nextGameState = advanceGameTime(gameState, timeToAdvance);

    setGameState(nextGameState);
    // A walk leaves the yard before the new time is "spent" there. Notice the
    // hill on the scene Ethan arrives in, not the one he is walking out of.
    const hillNow = shouldNoticeHill(
      hillCheckScene(currentScene.id, destinationSceneId),
      nextGameState.time,
      questsRef.current,
      storyFlags,
    );
    // The line lands first. openHillQuest adds the quest on this same update,
    // so the look action is not on screen before the sentence.
    if (hillNow) markHillThought();
    setCurrentThought(
      hillNow
        ? HILL_THOUGHT
        : getSceneThought(
          currentScene.id,
          nextGameState.time,
          nextGameState.weather,
          nextGameState.dayOfWeek,
        ),
    );
    if (hillNow) openHillQuest();

    return nextGameState;
  }

  function moveToScene(
    sceneId: string,
    time: number,
    weather: Weather = gameState.weather,
    day: GameState["dayOfWeek"] = gameState.dayOfWeek,
  ) {
    // Every `nextScene` in scene data must match a key in `scenes`.
    const nextScene = scenes[sceneId as keyof typeof scenes];

    if (!nextScene) {
      return;
    }

    if (sceneId === "hospital-reception" && currentScene.id !== sceneId) {
      setMarleneActive(false);
    }

    setCurrentScene(nextScene);
    setCurrentEffects([]);

    const hillNow = shouldNoticeHill(sceneId, time, questsRef.current, storyFlags);
    // The look action stays hidden until this line has been said.
    // A time change in this same click may already have shown it.
    if (hillNow || !hillThoughtShown.current) {
      if (hillNow) markHillThought();
      setCurrentThought(
        hillNow
          ? HILL_THOUGHT
          : getSceneThought(nextScene.id, time, weather, day),
      );
    }
    if (hillNow) openHillQuest();

    setGameState((previous) => ({
      ...previous,
      time,
      location: nextScene.location,
    }));
  }

  function openConversation() {
    cancelPendingReply();
    // The action determines *which* NPC to talk to; the scene owns the dialogue.
    const selectedConversation =
      currentScene.id === "kitchen" && !momTalked
        ? momDeathConversation
        : currentScene.id === "front-yard"
          ? rachelFrontYardConversation
          : currentScene.id === "elrod-house"
            ? rachelElrodConversation
            : currentScene.conversation;
    const asEmployee =
      !!selectedConversation?.jobOpening && selectedConversation.jobOpening.job === job;
    const opening = asEmployee
      ? selectedConversation.jobOpening!.opening
      : selectedConversation?.opening;

    if (!opening) {
      return;
    }

    conversationActiveRef.current = true;
    setActiveConversation(selectedConversation ?? null);
    setConversationEnding(false);
    setOpenedAsEmployee(asEmployee);
    setUsedConversationChoices([]);
    setConversation(opening);
    setConversationActive(true);
  }

  function closeConversation() {
    setConversationActive(false);
    setConversationEnding(false);
    // Drop the lock immediately so the scene choices return while the
    // dialogue layer finishes fading. Notices wait until that layer is gone.
    conversationActiveRef.current = false;
    window.setTimeout(() => {
      setConversation([]);
      setActiveConversation(null);
      setUsedConversationChoices([]);
      pumpNotices();
    }, 300);
  }

  function notifyMomQuest() {
    enqueueLead("talk-to-mom", "Talk to Mom");
  }

  function applyChoiceEffects(choice: Choice) {
    // Effects are optional and update both the player state and feedback text.
    if (!choice.effects) {
      return;
    }

    setPlayerState((previous) => applyEffects(previous, choice.effects!));
    setCurrentEffects(effectsToStory(choice.effects));
  }

  function showLateNightActionThought() {
    if (lateNightThoughtTimer.current !== null) {
      window.clearTimeout(lateNightThoughtTimer.current);
    }
    setLateNightActionThought("That can wait till morning. I'm beat.");
    lateNightThoughtTimer.current = window.setTimeout(() => {
      setLateNightActionThought(null);
      lateNightThoughtTimer.current = null;
    }, 2600);
  }

  function isLateNight() {
    return gameState.time >= BEDTIME_END && gameState.time < 420;
  }

  function canTakeLateNightAction(choice: GameChoice) {
    if (!isLateNight()) {
      return true;
    }
    if (!("action" in choice)) {
      return false;
    }

    if (choice.action === "goToSleep" && currentScene.id === "ethan-room") {
      return true;
    }
    // The hill is only there after dark, including the hours Ethan is otherwise
    // too tired to wander. Looking from his own yard does not count as going out.
    if (choice.action === "lookAtSanatoriumHill") {
      return true;
    }
    // Light on the Hill stays playable through the 03:00 lock. A walk that
    // leaves after 02:00 arrives after 03:00, and by morning the cigarette is gone.
    if (
      isQuestActive(questsRef.current, "light-on-the-hill")
      && (
        SANATORIUM_SCENE_IDS.has(currentScene.id)
        || ("nextScene" in choice && SANATORIUM_SCENE_IDS.has(choice.nextScene))
      )
    ) {
      return true;
    }

    // At night, Ethan can only travel home, then follow the route through the
    // house to his bedroom. Everything else waits until morning.
    if (!HOME_SCENE_IDS.has(currentScene.id)) {
      return choice.nextScene === "front-yard" || choice.action === "goHome";
    }
    return choice.nextScene === "hallway" || choice.nextScene === "hallway-upstairs" || choice.action === "goEthanRoom";
  }

  function handleConversationChoice(choice: Extract<GameChoice, { response: StoryEntry[] }>) {
    if (replyTimer.current !== null) return;

    const npcIndex = choice.response.findIndex(
      (entry) => entry.type === "conversation" && entry.character !== "Ethan"
    );
    if (npcIndex === -1) {
      finishConversationChoice(choice);
      return;
    }

    setConversation((previous) => [...previous, ...choice.response.slice(0, npcIndex)]);
    setReplyPending(true);
    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null;
      setReplyPending(false);
      finishConversationChoice({ ...choice, response: choice.response.slice(npcIndex) });
    }, NPC_REPLY_DELAY);
  }

  function finishConversationChoice(choice: ConversationChoice) {
    setConversation((previous) => [...previous, ...choice.response]);

    const flags = choice.storyFlag;
    const flagList = !flags ? [] : Array.isArray(flags) ? flags : [flags];
    if (flagList.includes("momJobConcern") && !momJobConcernHeard) {
      setMomJobConcernHeard(true);
    }
    if (flagList.includes("willHelpMom") && !job) {
      setCurrentThought("I gotta get a job. Maybe those flyers on the light pole out front.");
    }
    if (flagList.length) applyFlags(flagList);

    if (choice.givesItem) {
      setPlayerState((previous) =>
        previous.inventory.includes(choice.givesItem!)
          ? previous
          : { ...previous, inventory: [...previous.inventory, choice.givesItem!] },
      );
    }
    if (choice.removesItem) {
      setPlayerState((previous) => ({
        ...previous,
        inventory: previous.inventory.filter((item) => item !== choice.removesItem),
      }));
    }

    if (choice.jobOffer && !job) {
      setJob(choice.jobOffer);
      setJobQuestTarget(null);
      commitQuests(completeQuest(questsRef.current, "find-a-job", "working"));
      enqueueNotice({ kind: "notice", label: "Quest complete", message: "Find a Job" });

      if (choice.jobOffer === "scrapyard") {
        setPlayerState((previous) => ({
          ...previous,
          inventory: previous.inventory.includes("Sturdy Crowbar")
            ? previous.inventory
            : [...previous.inventory, "Sturdy Crowbar"],
        }));
      }
    }

    if (choice.startsQuest || choice.completesQuest) {
      applyQuestHooks({
        startsQuest: choice.startsQuest,
        completesQuest: choice.completesQuest,
        questStep: choice.questStep,
      });
    } else if (choice.questStep) {
      // Conversation choices (e.g. Margaret coffee) advance Faded Poster.
      commitQuests(
        isQuestActive(questsRef.current, "faded-poster")
          ? setQuestStep(questsRef.current, "faded-poster", choice.questStep!)
          : questsRef.current,
      );
    }

    if (choice.closeup) {
      enqueueCloseup(
        {
          image: choice.closeup.image.replace(/^\.\//, "/"),
          thought: choice.closeup.thought,
          label: choice.closeup.label,
        },
        choice.closeup.next
          ? {
              image: choice.closeup.next.image.replace(/^\.\//, "/"),
              thought: choice.closeup.next.thought,
              label: choice.closeup.next.label,
            }
          : undefined,
      );
    }

    if (choice.endsConversation) {
      // Talk to Mom ends once Ethan has actually answered, on any reply.
      const answeredMom =
        !momTalked
        && activeConversation === momDeathConversation
        && (
          usedConversationChoices.length > 0
          || choice.response.some(
            (entry) => entry.type === "conversation" && entry.character === "Ethan",
          )
        );
      if (answeredMom) {
        setMomTalked(true);
        commitQuests(startQuest(completeQuest(questsRef.current, "talk-to-mom"), "the-tape"));
        enqueueNotice({ kind: "notice", label: "Quest complete", message: "Talk to Mom" });
        enqueueLead("the-tape", "The Tape");
      }
      if (choice.response.length === 0) closeConversation();
      else setConversationEnding(true);
      return;
    }

    setUsedConversationChoices((previous) => [...previous, choice.label]);
  }

  function handleTravel(choice: Choice) {
    // Travel waits for the overlay before applying its time cost and effects.
    const destination = scenes[choice.nextScene as keyof typeof scenes]?.location ?? "Unknown";

    setTravelingTo({
      location: destination,
      method: choice.action.toLowerCase().includes("bus") ? "bus" : "walk",
      isNight: isNightTime(gameState.time),
    });

    window.setTimeout(() => {
      const nextGameState = advanceTime(choice.timeCost, false, false, choice.nextScene);
      moveToScene(choice.nextScene, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek);
      applyChoiceEffects(choice);
      setTravelingTo(null);
    }, TRAVEL_DURATION);
  }

  function workNeedleGrooveShift() {
    const shiftEnd = 1140;
    const shiftMinutes = Math.min(360, shiftEnd - gameState.time);
    const shiftPay = Math.round((shiftMinutes / 60) * 15);

    setTravelingTo({
      location: "Needle & Groove",
      method: "work",
      isNight: isNightTime(gameState.time),
    });

    window.setTimeout(() => {
      advanceTime(shiftMinutes);
      setPlayerState((previous) => ({ ...previous, money: previous.money + shiftPay }));
      setCurrentEffects([{ type: "effect", stat: "money", amount: shiftPay }]);
      setTravelingTo(null);
    }, TRAVEL_DURATION);
  }

  function handleChoice(choice: GameChoice, throughDoor = false) {
    // This is the central choice router. Prefer declarative scene fields
    // (`nextScene`, `itemToAdd`, `effects`) over adding action-specific cases.
    // Nothing else can be chosen while a door transition is playing.
    if (doorBusy.current && !throughDoor) return;

    if (!canTakeLateNightAction(choice)) {
      showLateNightActionThought();
      return;
    }

    if ("response" in choice) {
      handleConversationChoice(choice);
      return;
    }

    if (!isChoiceAvailable(choice)) return;

    if (choice.requirements?.money !== undefined && playerState.money < choice.requirements.money) {
      return;
    }
    if (choice.requirements?.item && !playerState.inventory.includes(choice.requirements.item)) {
      return;
    }
    if (choice.requirements?.flags && !hasAllFlags(choice.requirements.flags)) {
      return;
    }
    if (choice.requirements?.excludesFlags && hasAnyFlag(choice.requirements.excludesFlags)) {
      return;
    }

    // The dark hallway needs a light before any transition starts.
    if (choice.action === "enterSanatoriumHallway" && !playerState.inventory.includes("Flashlight")) {
      setCurrentThought("Not without a light.");
      return;
    }

    // Side effects (flags, fear, quests) run once, while the screen is black.
    if (choice.door && !throughDoor) {
      walkThroughDoor(choice);
      return;
    }

    if (choice.closeup) {
      const toUrl = (path: string) => path.replace(/^\.\//, "/");
      enqueueCloseup(
        {
          image: toUrl(choice.closeup.image),
          thought: choice.closeup.thought,
          label: choice.closeup.label,
        },
        choice.closeup.next
          ? {
              image: toUrl(choice.closeup.next.image),
              thought: choice.closeup.next.thought,
              label: choice.closeup.next.label,
            }
          : undefined,
      );
    }
    if (choice.setsFlags) applyFlags(choice.setsFlags);

    // Poster found before Linda's coffee errand: start as Faded Poster.
    if (choice.action === "lookAtDinerBulletin") {
      if (!isQuestCompleted(questsRef.current, "faded-poster")) {
        if (!isQuestActive(questsRef.current, "faded-poster")) {
          commitQuests(startQuest(questsRef.current, "faded-poster", "poster"));
          enqueueLead("faded-poster", "Faded Poster");
        } else {
          commitQuests(setQuestStep(questsRef.current, "faded-poster", "poster"));
        }
      }
    } else if (choice.startsQuest || choice.completesQuest) {
      applyQuestHooks({
        startsQuest: choice.startsQuest,
        completesQuest: choice.completesQuest,
        questStep: choice.questStep,
      });
    } else if (choice.questStep) {
      commitQuests((() => {
        const current = questsRef.current;
        if (
          choice.action === "lookAtElrodTape"
          && isQuestActive(current, "the-tape")
        ) {
          return setQuestStep(current, "the-tape", choice.questStep!);
        }
        if (isQuestActive(current, "faded-poster")) {
          return setQuestStep(current, "faded-poster", choice.questStep!);
        }
        return current;
      })());
    }
    if (
      choice.completesQuest === "light-on-the-hill"
      || (choice.setsFlags && choice.setsFlags.includes("chapter1Complete"))
    ) {
      setChapter(2);
      setShowChapterEnd(true);
    }

    if (choice.action === "enterSanatorium") {
      if (!hasFlag("sanatoriumEntranceFear")) {
        applyFlags("sanatoriumEntranceFear");
        setPlayerState((previous) => applyEffects(previous, { fear: 10 }));
        setCurrentEffects([{ type: "effect", stat: "fear", amount: 10 }]);
      }
      commitQuests(setQuestStep(questsRef.current, "light-on-the-hill", "inside"));
    }
    if (choice.action === "enterSanatoriumHallway") {
      if (!hasFlag("sanatoriumHallwayFear")) {
        applyFlags("sanatoriumHallwayFear");
        setPlayerState((previous) => applyEffects(previous, { fear: 10 }));
        setCurrentEffects([{ type: "effect", stat: "fear", amount: 10 }]);
      }
    }

    const flyerJobs: Partial<Record<string, JobId>> = {
      chooseNeedleGrooveJob: "needle-groove",
      chooseGasStationJob: "gas-station",
      chooseScrapyardJob: "scrapyard",
    };
    const selectedJob = flyerJobs[choice.action];

    if (selectedJob && !job && !jobQuestTarget) {
      setJobQuestTarget(selectedJob);
      commitQuests(setQuestStep(questsRef.current, "find-a-job", "flyer"));
      enqueueNotice({ kind: "notice", label: "Quest updated", message: "Follow up on that lead." });
      const discoveredLocation: Record<JobId, string> = {
        "needle-groove": "Needle & Groove",
        "gas-station": "The gas station",
        scrapyard: "The scrapyard",
      };
      locationDiscoveryTimer.current = window.setTimeout(() => {
        enqueueNotice({
          kind: "notice",
          label: "Location discovered",
          message: `${discoveredLocation[selectedJob]} discovered.`,
        });
        locationDiscoveryTimer.current = null;
      }, 6800);
    }

    if (CONVERSATION_ACTIONS.has(choice.action)) {
      openConversation();
    }

    if (choice.action === "goToMarleneCounter") {
      setMarleneActive(true);
    }

    if (choice.action === "leaveMarleneCounter") {
      setMarleneActive(false);
    }

    if (choice.action === "openShop") {
      setActiveShop("gas-station");
      return;
    }

    if (choice.action === "openNeedleGrooveShop") {
      setActiveShop("needle-groove");
      return;
    }

    if (choice.action === "workNeedleGrooveShift") {
      workNeedleGrooveShift();
      return;
    }

    if (choice.action === "goToSleep") {
      const minutesUntilSevenAm = gameState.time < BEDTIME_END
        ? 420 - gameState.time
        : 1440 - gameState.time + 420;
      const nextGameState = advanceTime(minutesUntilSevenAm, false, true, "ethan-room");
      moveToScene("ethan-room", nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek);
      setNewDayAnnouncement(nextGameState);
      return;
    }

    if (choice.action === "leaveBusStop") {
      const nextGameState = advanceTime(choice.timeCost, false, false, busStopReturnSceneId);
      moveToScene(busStopReturnSceneId, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek);
      return;
    }

    if (choice.travel) {
      handleTravel(choice);
      return;
    }

    if (choice.action === "pickUpCigarettes") {
      setDeskCigarettesPickedUp(true);
    }

    if (choice.action === "takeScrapyardKnife") {
      setScrapyardKnifePickedUp(true);
    }

    if (choice.action === "pickUpGarageFlashlight") {
      setGarageFlashlightPickedUp(true);
    }

    const nextSceneId =
      choice.action === "lookAtDesk" && deskCigarettesPickedUp
        ? "ethan-room-desk-empty"
        : choice.action === "lookAtScrapyardDesk" && scrapyardKnifePickedUp
          ? "scrapyard-desk-empty"
          : choice.action === "lookAtGarageBench" && garageFlashlightPickedUp
            ? "garage-bench-empty"
            : choice.nextScene;

    const nextGameState = advanceTime(
      choice.timeCost,
      choice.action === "talkToMom",
      false,
      nextSceneId,
    );

    moveToScene(nextSceneId, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek);

    if (selectedJob && !job && !jobQuestTarget) {
      const leadThought: Record<JobId, string> = {
        "needle-groove": "Needle & Groove. That one feels right.",
        "gas-station": "Harlow Gas. Ray's always looking for help.",
        scrapyard: "The scrapyard. Roy'll take a pair of hands.",
      };
      setCurrentThought(leadThought[selectedJob]);
    }

    if (choice.itemToAdd) {
      setPlayerState((previous) => ({
        ...previous,
        inventory: [...previous.inventory, choice.itemToAdd!],
      }));
    }

    applyChoiceEffects(choice);
  }

  // The door transition calls back into the router once the screen is black;
  // this keeps that call on the latest render's state.
  const latestHandleChoice = useRef(handleChoice);
  useEffect(() => {
    latestHandleChoice.current = handleChoice;
  });

  /** Dip to black, play the door, and take the choice while it's dark. */
  function walkThroughDoor(choice: Choice) {
    doorBusy.current = true;
    doorTimers.current.forEach((timer) => window.clearTimeout(timer));
    const later = (callback: () => void, delay: number) => {
      doorTimers.current.push(window.setTimeout(callback, delay));
    };
    const done = () => {
      doorTimers.current = [];
      doorBusy.current = false;
      setDoorTransition("idle");
    };
    harlowAudio().door();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      latestHandleChoice.current(choice, true);
      later(done, DOOR_REDUCED_MOTION_LOCK);
      return;
    }

    setDoorTransition("closing");
    later(() => {
      latestHandleChoice.current(choice, true);
      setDoorTransition("black");
    }, DOOR_FADE_IN);
    later(() => setDoorTransition("opening"), DOOR_FADE_IN + DOOR_HOLD);
    later(done, DOOR_FADE_IN + DOOR_HOLD + DOOR_FADE_OUT);
  }

  function goToBusStop() {
    if (isLateNight()) {
      showLateNightActionThought();
      return;
    }
    setBusStopReturnSceneId(currentScene.id);
    const nextGameState = advanceTime(0, false, false, "bus-stop");
    moveToScene("bus-stop", nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek);
  }

  function adminTravel(sceneId: string) {
    if (!scenes[sceneId as keyof typeof scenes]) {
      return;
    }

    cancelPendingReply();
    conversationActiveRef.current = false;
    setConversation([]);
    setActiveConversation(null);
    setConversationActive(false);
    setUsedConversationChoices([]);
    setShowTravel(false);
    setTravelingTo(null);
    moveToScene(sceneId, gameState.time);
  }

  function isChoiceAvailable(choice: Choice) {
    // Temporary availability rules for story moments. Keep rules keyed by action
    // names, or move them into a richer `requirements` type as the game grows.
    const { action } = choice;
    const { time } = gameState;

    if (!momTalked && (choice.travel || ["front-yard", "back-yard", "light-pole"].includes(choice.nextScene))) {
      return false;
    }
    if (!momTalked && action === "relaxOnCouch") return false;
    if (action === "goToSleep") {
      return currentScene.id === "ethan-room" && (time >= BEDTIME_START || time < 420);
    }
    if (action === "watchTv") {
      return currentScene.id === "living-room" && !momTalked;
    }

    if (action === "talkToMom") {
      const weekend =
        gameState.dayOfWeek === "Saturday" || gameState.dayOfWeek === "Sunday";
      if (currentScene.id === "kitchen") {
        return (time >= 450 && time < 540)
          || (weekend && time >= 720 && time < 1140);
      }
      if (currentScene.id === "living-room") {
        return weekend
          ? time >= 540 && time < 1320
          : time >= 540 && time < 1080;
      }
      return false;
    }
    if (action === "talkToJohnny") return time >= 480 && time < 840;
    if (action === "workNeedleGrooveShift") {
      return job === "needle-groove" && time >= 600 && time < 1140;
    }
    if (action === "talkToWalter") return time >= 480 && time < 960;
    if (action === "talkToMargaret") return time >= 420 && time < 900;
    if (action === "talkToEarl") return time >= 480 && time < 1020;
    if (action === "talkToBigRoy") return time >= 420 && time < 900;
    if (action === "talkToRay") return time >= 540 && time < 1380;
    if (action === "talkToTommy") return time >= 480 && time < 1020;
    if (action === "openShop") return time >= 540 && time < 1380;
    if (action === "goToMarleneCounter") return !marleneActive;
    if (action === "talkToMarlene" || action === "leaveMarleneCounter") return marleneActive;
    if (marleneActive && (action === "leaveHospital" || action === "goToHospitalRoom")) return false;
    if (action === "pickUpCigarettes") return !deskCigarettesPickedUp;
    // Roy works in the scrapyard from 07:00 to 15:00, so Ethan cannot
    // quietly take the knife while he is nearby.
    if (action === "takeScrapyardKnife") {
      return !scrapyardKnifePickedUp && (time < 420 || time >= 900);
    }
    if (action === "pickUpGarageFlashlight") return !garageFlashlightPickedUp;
    if (action.startsWith("choose") && action.endsWith("Job")) {
      // The flyers are the job quest. Hearing Mom worry is not enough.
      return (
        !job
        && !jobQuestTarget
        && (isQuestActive(quests, "find-a-job") || hasFlag("willHelpMom"))
      );
    }

    if (action === "goElrodHouse") {
      return momTalked && (
        isQuestActive(quests, "the-tape")
        || hasFlag("rachelMet")
        || isQuestCompleted(quests, "the-tape")
      );
    }
    if (action === "talkToRachel") {
      // Elrod: Rachel is only out 07:00–19:00 (matches her standing art).
      if (currentScene.id === "elrod-house") {
        return !hasFlag("rachelMet") && time >= 420 && time < 1140;
      }
      // Front yard follow-up: 07:00–21:00.
      if (currentScene.id === "front-yard") {
        return (
          hasFlag("walterStationTalk")
          && isQuestActive(quests, "what-walter-said")
          && time >= 420
          && time < 1260
        );
      }
      return false;
    }
    if (action === "lookAtSanatoriumHill") {
      const night = time >= 1080 || time < 360;
      // Hidden until the night line has started the quest. The button itself
      // says there is something on the hill.
      return (
        night
        && (
          isQuestActive(quests, "light-on-the-hill")
          || isQuestCompleted(quests, "light-on-the-hill")
        )
        && !hasFlag("sanatoriumSeenFromStreet")
      );
    }
    if (action === "lookAtDinerBulletin") {
      // Board is inspectable once the diner is in play; finding the poster
      // can start Faded Poster even before Linda's coffee errand.
      return momTalked && !hasFlag("posterFound");
    }
    if (action === "lookAtSanatoriumCigarette") {
      return isNightTime(time) && !hasFlag("sanatoriumCigaretteSeen");
    }
    if (action === "lookAtElrodTape") return true;

    if (choice.requirements?.flags && !hasAllFlags(choice.requirements.flags)) return false;
    if (choice.requirements?.excludesFlags && hasAnyFlag(choice.requirements.excludesFlags)) return false;
    if (choice.requirements?.item && !playerState.inventory.includes(choice.requirements.item)) return false;

    return true;
  }

  function saveGame(slotNumber: number) {
    return writeSaveSlot(slotNumber, currentSave());
  }

  function restoreSave(save: ReturnType<typeof readSaveSlot>) {
    const savedSceneId = save ? sceneAfterPickups(save.currentSceneId, save) : null;
    const savedScene = savedSceneId && scenes[savedSceneId as keyof typeof scenes];

    // Ignore saves from an older/incomplete build instead of leaving the game
    // on a scene that no longer exists.
    if (!save || !savedScene) return false;

    const alignedState = withCanonWeekday(save.gameState);
    writeSessionSave({ ...save, gameState: alignedState });

    setGameState(alignedState);
    setPlayerState(save.playerState);
    const restoredFlags = save.storyFlags ?? (save.momJobConcernHeard ? { momJobConcern: true } : {});
    let restoredQuests = migrateQuestsFromLegacy(save);
    const restoredHill = shouldNoticeHill(
      savedScene.id,
      alignedState.time,
      restoredQuests,
      restoredFlags,
    );
    if (restoredHill) restoredQuests = startQuest(restoredQuests, "light-on-the-hill");

    setCurrentScene(savedScene);
    setCurrentThought(
      restoredHill
        ? HILL_THOUGHT
        : getSceneThought(
          savedScene.id,
          alignedState.time,
          alignedState.weather,
          alignedState.dayOfWeek,
        ),
    );
    setCurrentEffects([]);
    setBusStopReturnSceneId(save.busStopReturnSceneId);
    setMarleneActive(save.marleneActive);
    setDeskCigarettesPickedUp(save.deskCigarettesPickedUp);
    setScrapyardKnifePickedUp(save.scrapyardKnifePickedUp);
    setGarageFlashlightPickedUp(save.garageFlashlightPickedUp);
    setMomTalked(resolveMomTalked(restoredQuests));
    setMomJobConcernHeard(save.momJobConcernHeard ?? false);
    setJob(save.job ?? null);
    setJobQuestTarget(save.jobQuestTarget ?? null);
    commitQuests(restoredQuests);
    setStoryFlags(restoredFlags);
    setChapter(save.chapter ?? 1);
    setCloseup(null);
    closeupQueue.current = [];
    setShowChapterEnd(false);
    clearQuestNotification();
    if (restoredHill) enqueueLead("light-on-the-hill", "Light on the Hill");

    // Modal and transition state is not saved, so always resume at the scene.
    setShowStats(false);
    setShowInventory(false);
    setShowTravel(false);
    setActiveShop(null);
    cancelPendingReply();
    conversationActiveRef.current = false;
    setConversation([]);
    setActiveConversation(null);
    setConversationActive(false);
    setUsedConversationChoices([]);
    setTravelingTo(null);
    setNewDayAnnouncement(null);
    return true;
  }

  function loadGame(slotNumber: number) {
    return restoreSave(readSaveSlot(slotNumber));
  }

  function loadMostRecentGame() {
    return restoreSave(readMostRecentSave());
  }

  function startNewGameSession() {
    // A new game must not inherit the active session currently held in React
    // state. Build and save a fresh starting snapshot before showing the game.
    const freshGameState = { ...initialGameState };
    const freshPlayer = { ...player, inventory: [...player.inventory] };

    setGameState(freshGameState);
    setPlayerState(freshPlayer);
    setCurrentScene(ethanRoom);
    setCurrentThought(getSceneThought(
      ethanRoom.id,
      freshGameState.time,
      freshGameState.weather,
      freshGameState.dayOfWeek,
    ));
    setCurrentEffects([]);
    setBusStopReturnSceneId("front-yard");
    setMarleneActive(false);
    setDeskCigarettesPickedUp(false);
    setScrapyardKnifePickedUp(false);
    setGarageFlashlightPickedUp(false);
    setMomTalked(false);
    setMomJobConcernHeard(false);
    setJob(null);
    setJobQuestTarget(null);
    commitQuests([{ id: "talk-to-mom", status: "active" }]);
    setStoryFlags({});
    setChapter(1);
    setCloseup(null);
    closeupQueue.current = [];
    setShowChapterEnd(false);
    clearQuestNotification();
    setShowStats(false);
    setShowInventory(false);
    setShowTravel(false);
    setActiveShop(null);
    cancelPendingReply();
    conversationActiveRef.current = false;
    setConversation([]);
    setActiveConversation(null);
    setConversationActive(false);
    setUsedConversationChoices([]);
    setTravelingTo(null);
    setNewDayAnnouncement(null);

    return writeSessionSave({
      version: 1,
      gameState: freshGameState,
      playerState: freshPlayer,
      currentSceneId: ethanRoom.id,
      busStopReturnSceneId: "front-yard",
      marleneActive: false,
      deskCigarettesPickedUp: false,
      scrapyardKnifePickedUp: false,
      garageFlashlightPickedUp: false,
      momTalked: false,
      quests: [{ id: "talk-to-mom", status: "active" }],
      storyFlags: {},
      chapter: 1,
    });
  }

  // A scene can list multiple NPCs; only the first one available at this time
  // is rendered over the scene image.
  const activeCharacter = currentScene.characters?.find((character) => {
    if (character.name === "Marlene" && !marleneActive) {
      return false;
    }
    if (character.days && !character.days.includes(gameState.dayOfWeek)) {
      return false;
    }
    if (character.requiresFlags && !character.requiresFlags.every((flag) => hasFlag(flag))) {
      return false;
    }
    if (character.excludesFlags && character.excludesFlags.some((flag) => hasFlag(flag))) {
      return false;
    }

    return (
      (character.from === undefined || gameState.time >= character.from) &&
      (character.until === undefined || gameState.time < character.until)
    );
  });

  const activeChoices = replyPending || conversationEnding ? [] : conversationActive
    ? (activeConversation?.choices ?? []).filter(
        (choice) =>
          (!choice.requiresNoJob || !job) &&
          (!choice.requiresJob || choice.requiresJob === job) &&
          (!choice.requiresJobQuestTarget || choice.requiresJobQuestTarget === jobQuestTarget) &&
          hasAllFlags(choice.requiresStoryFlag) &&
          !hasAnyFlag(choice.excludesStoryFlag) &&
          (!choice.requiresChoice || usedConversationChoices.includes(choice.requiresChoice)) &&
          (!choice.requiresAnyChoice || choice.requiresAnyChoice.some((label) => usedConversationChoices.includes(label))) &&
          (!choice.requiresPriorChoice || usedConversationChoices.length > 0) &&
          (!choice.excludesChoice || !usedConversationChoices.includes(choice.excludesChoice)) &&
          (!choice.excludesJob || choice.excludesJob !== job) &&
          (!choice.returningEmployee || openedAsEmployee) &&
          (!choice.requiresItem || playerState.inventory.includes(choice.requiresItem)) &&
          (!choice.excludesItem || !playerState.inventory.includes(choice.excludesItem)) &&
          (!choice.requiresQuestActive || isQuestActive(quests, choice.requiresQuestActive)) &&
          (choice.endsConversation || !usedConversationChoices.includes(choice.label))
      )
    : currentScene.choices.filter(isChoiceAvailable);
  const availableTravelDestinations = [
    "front-yard",
    "hospital",
    ...(momTalked ? ["diner"] : []),
    ...(hasFlag("rachelMet")
      || isQuestActive(quests, "down-to-the-station")
      || isQuestCompleted(quests, "down-to-the-station")
      ? ["police-station"]
      : []),
    ...(hasFlag("sanatoriumSeenFromStreet")
      || isQuestActive(quests, "light-on-the-hill")
      || isQuestCompleted(quests, "light-on-the-hill")
      ? ["sanatorium"]
      : []),
    ...(jobQuestTarget === "needle-groove" || job === "needle-groove"
      ? ["needle-and-groove"]
      : []),
    ...(jobQuestTarget === "gas-station" || job === "gas-station"
      ? ["gas-station"]
      : []),
    ...(jobQuestTarget === "scrapyard" || job === "scrapyard"
      ? ["scrapyard"]
      : []),
  ];

  return {
    gameState,
    playerState,
    currentScene,
    currentThought: isLateNight()
      ? "It's late. I should get to bed."
      : momTalked && currentScene.id === "ethan-room" && gameState.dayNumber > initialGameState.dayNumber
        ? "Another day. Better get moving."
      : momTalked
        ? currentThought
        : currentScene.id === "living-room-relaxing"
          ? "I need to talk to Mom first."
          : "I should talk to Mom.",
    currentEffects,
    lateNightActionThought,
    newDayAnnouncement,
    dismissNewDayAnnouncement: () => setNewDayAnnouncement(null),
    conversation,
    conversationActive,
    finishConversation: conversationEnding ? closeConversation : undefined,
    activeCharacter,
    activeChoices,
    travelingTo,
    walkingChoices: createWalkingChoices(currentScene.id, availableTravelDestinations),
    busChoices: createBusChoices(availableTravelDestinations),
    showStats,
    setShowStats,
    showInventory,
    setShowInventory,
    showTravel,
    setShowTravel,
    activeShop,
    setActiveShop,
    job,
    jobQuestTarget,
    quests,
    storyFlags,
    chapter,
    closeup,
    dismissCloseup,
    showChapterEnd,
    dismissChapterEnd: () => setShowChapterEnd(false),
    momTalked,
    momJobConcernHeard,
    questNotification,
    questNotificationLabel,
    questNotificationKind,
    questNotificationExiting,
    saveGame,
    loadGame,
    loadMostRecentGame,
    startNewGameSession,
    notifyMomQuest,
    handleChoice: (choice: GameChoice) => handleChoice(choice),
    doorTransition,
    goToBusStop,
    adminTravel,
    // The pass-time controls are developer tools, so they intentionally ignore
    // the gameplay-only 03:30 exhaustion cap.
    adminWait: (minutes: number) => advanceTime(minutes, false, true),
    wait: (minutes: number) => {
      if (gameState.time >= EXHAUSTION_LOCK_TIME) {
        showLateNightActionThought();
        return;
      }
      advanceTime(minutes);
    },
    useInventoryItem: (item: string) => {
      const fearReduction = item === "Beer" ? 10 : item === "Cigarettes" ? 5 : 0;
      if (!fearReduction) return;
      setPlayerState((previous) => {
        const index = previous.inventory.indexOf(item);
        if (index === -1) return previous;
        return {
          ...previous,
          fear: Math.max(0, previous.fear - fearReduction),
          inventory: previous.inventory.filter((_, itemIndex) => itemIndex !== index),
        };
      });
    },
    buyItem: (item: string, price: number) => {
      setPlayerState((previous) => {
        if (previous.money < price) {
          return previous;
        }

        return {
          ...previous,
          money: previous.money - price,
          inventory: [...previous.inventory, item],
        };
      });
    },
  };
}
