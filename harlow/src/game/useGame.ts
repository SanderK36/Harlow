import { useCallback, useEffect, useRef, useState } from "react";

import { applyEffects, restAfterSleep, statDeltas } from "@/game/effects";
import initialGameState from "@/game/gameState";
import player from "@/game/player";
import {
  ethanRoom,
  getSceneThought,
  momDeathConversation,
  RAIN_WEATHER,
  rachelElrodConversation,
  rachelFrontYardConversation,
  scenes,
} from "@/game/scenes";
import {
  ASK_ABOUT_LABEL,
  askCompletesGate,
  askTopicsFor,
  resolveAskAbout,
} from "@/game/askAbout";
import {
  bootPrintImage,
  collectClue,
  clueForFlag,
  migrateClues,
  tryConnect,
  unseenClues as unseenClueIds,
  type AskedAbout,
  type ClueConnectionId,
  type ClueId,
} from "@/game/clues";
import { replyList } from "@/game/conversationChoices";
import { repeatVisitOpening, visitHasNothingNew } from "@/game/repeatVisits";
import {
  dialogueLineCount,
  shouldRevealArmedCloseup,
  type ArmedConversationCloseup,
} from "@/game/conversationCloseup";
import { plateUrl, sceneWeatherPlate } from "@/game/scenePlate";
import {
  daytimeFigureDue,
  emilyDoorAjarDue,
  EMILY_BOX_THOUGHT,
  EMILY_DOOR_THOUGHT,
  endingAfterEscape,
  endingFrames,
  FIGURE_FOLLOW,
  FIGURE_STAY,
  FIGURE_THOUGHT,
  flagsForConnections,
  CEMETERY_DARK,
  CEMETERY_EMPTY,
  cemeteryLunchDue,
  cemeterySundayGate,
  cemeteryTripIsDark,
  earlCashDue,
  folderLook,
  folderSnoopDue,
  FOLDER_CAUGHT_LINES,
  FOLDER_SNOOP_LINES,
  lindaPhoneDue,
  LINDA_PHONE_LINES,
  margaretDay2Due,
  MARGARET_DAY2_LINES,
  rachelDay2Due,
  RACHEL_DAY2_LINES,
  EARL_CASH_LINE,
  hillDarkDue,
  hillPrintMissedDue,
  HILL_DARK_TONIGHT,
  rachelTapeStareDue,
  RACHEL_TAPE_STARE,
  HILL_PRINT_MISSED,
  GRAVEL_LINE_MS,
  GRAVEL_LINES,
  GRAVEL_TAIL_MS,
  gravelWalkDue,
  HILL_LIGHT_OUT,
  nightCallRings,
  phoneHomeWeather,
  PHONE_ANSWER_LINES,
  PHONE_ANSWER_THOUGHT,
  PHONE_IGNORE_THOUGHT,
  PHONE_SILENCE_MS,
  PHONE_THOUGHT,
  PINE_NEEDLE_LINES,
  porchNeedlesDue,
  syncChapterQuests,
} from "@/game/chapter1";
import { hillCheckScene, HILL_THOUGHT, shouldNoticeHill } from "@/game/hill";
import {
  EARL_TOWEL,
  LINDA_BACK_DOOR_LINES,
  LOCK_JOKE,
  MARGARET_DEADBOLT,
  MILLER_ARRIVAL,
  MUSIC_BOX_LINES,
  MUSIC_BOX_THOUGHT_MS,
  MUSIC_BOX_THOUGHTS,
  STREET_STALKER_GONE,
  STREET_STALKER_THOUGHT,
  WINDOW_STALKER_GONE,
  WINDOW_STALKER_THOUGHT,
  dinerWindowDue,
  earlTowelDue,
  emilyGraveStoneImage,
  lindaBackDoorDue,
  margaretDeadboltDue,
  musicBoxCallDue,
  nextStalkerCount,
  restoredStalkerCount,
  stalkerMinute,
  streetStalkerDue,
  woodsFigureDue,
  woodsSightingCounts,
  type StalkerContext,
} from "@/game/slasher";
import { timeHint, WAITING_TIRED_HINT } from "@/game/timeHints";
import {
  actionMinutes,
  isTiredWindow,
  isWaitingLocked,
  lateNightChoiceAllowed,
  TIRED_END,
  waitingMinutesAllowed,
} from "@/game/lateNight";
import { noticesAreHeld } from "@/game/notices";
import { advanceGameTime, withCanonWeekday } from "@/game/time";
import { isNightTime } from "@/game/utils";
import {
  planAutosave,
  pulseAutosave,
  questAutosaveNeeded,
  type AutosaveRequest,
} from "@/game/autosave";
import { harlowAudio } from "@/game/audio";
import {
  readAutosave,
  readMostRecentSave,
  readSaveSlot,
  readSessionSave,
  writeAutosave,
  writeSaveSlot,
  writeSessionSave,
} from "@/game/save";
import type { Choice, GameChoice } from "@/game/choices";
import { npc, thought, type Conversation, type ConversationChoice, type StoryEntry } from "@/game/story";
import {
  advanceGatePrint,
  completeQuest,
  finishEmilyRoom,
  finishGate,
  isQuestActive,
  isQuestCompleted,
  migrateQuestsFromLegacy,
  resolveMomTalked,
  setQuestStep,
  startEmilyRoom,
  startQuest,
  startTheGate,
  type JobId,
  type QuestId,
  type QuestProgress,
  type StoryFlag,
  questTitle,
} from "@/game/quests";
import type { GameState, Weather } from "@/game/types";
import type { CloseupContent } from "@/components/CloseupOverlay/CloseupOverlay";
import { findActiveCharacter } from "@/game/activeCharacter";
import { isChoiceAvailable as choiceIsAvailable } from "@/game/choiceAvailability";
import { presentedThought } from "@/game/presentedThought";
import { sceneAfterPickups } from "@/game/sceneAfterPickups";
import { travelDestinationIds } from "@/game/travelDestinations";
import {
  applyConversationTrust,
  buildNpcOpening,
  migrateMet,
  migratePeopleSeen,
  migrateTrust,
  notebookPeople,
  personFromOpening,
  shouldMarkRachelWaited,
  unseenNotebookPeople,
  type TrustMap,
  type TrustPerson,
} from "@/game/trust";
import { useDoorTransition } from "@/game/useDoorTransition";
import { useNoticeQueue } from "@/game/useNoticeQueue";

const PHONE_RING_CHOICES: Choice[] = [
  { label: "Answer it", action: "answerNightCall", nextScene: "hallway", timeCost: 0 },
  { label: "Let it ring", action: "ignoreNightCall", nextScene: "hallway", timeCost: 0 },
];

const FIGURE_CHOICES: Choice[] = [
  { label: "Follow him", action: "followDaytimeFigure", nextScene: "elrod-backyard", timeCost: 0 },
  { label: "Stay put", action: "stayDaytimeFigure", nextScene: "elrod-backyard", timeCost: 0 },
];

const STREET_STALKER_CHOICES: Choice[] = [
  { label: "Look again", action: "lookAgainStalker", nextScene: "street", timeCost: 0 },
];

const WINDOW_STALKER_CHOICES: Choice[] = [
  { label: "Turn around", action: "turnFromWindow", nextScene: "diner", timeCost: 0 },
];

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
  "talkToWalterAtStone",
]);

const NPC_REPLY_DELAY = 450;
const TRAVEL_DURATION = 3000;

type ShopId = "gas-station" | "needle-groove";

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
    if (shouldNoticeHill(sceneId, time, migrated, flags, loaded.dayNumber)) return HILL_THOUGHT;
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
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  const [conversationActive, setConversationActive] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [usedConversationChoices, setUsedConversationChoices] = useState<string[]>([]);
  const [replyPending, setReplyPending] = useState(false);
  // A closing choice was picked: its reply plays, then the next click closes.
  const [conversationEnding, setConversationEnding] = useState(false);
  // The conversation opened with its jobOpening (Ethan came back as an employee).
  const [openedAsEmployee, setOpenedAsEmployee] = useState(false);
  const replyTimer = useRef<number | null>(null);
  const locationDiscoveryTimer = useRef<number | null>(null);
  // True while dialogue is on screen. Leads wait so the card is not hidden
  // under the conversation (or display:none on a phone).
  const conversationActiveRef = useRef(false);
  const handleChoiceRef = useRef<(choice: Choice, throughDoor?: boolean) => void>(() => {});
  const { doorTransition, doorBusy, walkThroughDoor } = useDoorTransition(
    (choice) => handleChoiceRef.current(choice, true),
  );

  useEffect(() => () => {
    if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
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
    rainy: boolean;
  } | null>(null);
  // Small pieces of story progress that still have their own fields, mirrored
  // into storyFlags where a scene requirement needs them.
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
    const dayNumber = withCanonWeekday(sessionSave?.gameState ?? initialGameState).dayNumber;
    const connections = migrateClues(sessionSave).connections;
    const linked = flagsForConnections(flags, connections);
    let next = migrated;
    if (shouldNoticeHill(sceneId, time, next, linked, dayNumber)) {
      next = startQuest(next, "light-on-the-hill");
    }
    return syncChapterQuests(next, dayNumber, connections);
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
  const pendingAutosave = useRef<AutosaveRequest | null>(null);
  function requestAutosave(partial: Partial<AutosaveRequest>) {
    const current = pendingAutosave.current ?? { quest: false, sleep: false, sceneChanged: false };
    pendingAutosave.current = {
      quest: current.quest || Boolean(partial.quest),
      sleep: current.sleep || Boolean(partial.sleep),
      sceneChanged: current.sceneChanged || Boolean(partial.sceneChanged),
    };
  }
  function clearAutosaveRequest() {
    pendingAutosave.current = null;
  }
  function commitQuests(next: QuestProgress[], options?: { autosave?: boolean }) {
    const synced = syncChapterQuests(next, dayRef.current, connectionsRef.current);
    const previous = questsRef.current;
    questsRef.current = synced;
    setQuests(synced);
    if (options?.autosave !== false && questAutosaveNeeded(previous, synced)) {
      requestAutosave({ quest: true });
    }
    return synced;
  }
  const [storyFlags, setStoryFlags] = useState<Partial<Record<StoryFlag, boolean>>>(
    () => flagsForConnections(
      sessionSave?.storyFlags ?? (
        sessionSave?.momJobConcernHeard ? { momJobConcern: true } : {}
      ),
      migrateClues(sessionSave).connections,
    ),
  );
  // Updated in the same turn as setStoryFlags so a choice list built later
  // in that turn still sees rachelMet and the other flags.
  const storyFlagsRef = useRef(storyFlags);
  const dayRef = useRef(gameState.dayNumber);
  dayRef.current = gameState.dayNumber;
  const phoneIntercept = useRef(false);
  const phoneResumeSleep = useRef(false);
  const afterConversationRef = useRef<(() => void) | null>(null);
  const [phonePhase, setPhonePhase] = useState<null | "ring" | "talk" | "music">(null);
  const [figureActive, setFigureActive] = useState(false);
  const [stalkerMode, setStalkerMode] = useState<null | "street" | "window">(null);
  const [stalkerSightings, setStalkerSightings] = useState(() =>
    restoredStalkerCount(sessionSave?.stalkerSightings, sessionSave?.storyFlags ?? {}),
  );
  const [stalkerSeenAt, setStalkerSeenAt] = useState<number | null>(
    sessionSave?.stalkerSeenAt ?? null,
  );
  const stalkerCountRef = useRef(stalkerSightings);
  const stalkerAtRef = useRef<number | null>(stalkerSeenAt);
  const musicBoxThoughtTimer = useRef<number | null>(null);
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [escapeMode, setEscapeMode] = useState<null | "hide" | "run">(null);
  const escapeResolved = useRef(false);
  const [catchEntrance, setCatchEntrance] = useState(false);
  const [gravelHold, setGravelHold] = useState(false);
  const gravelTimers = useRef<number[]>([]);
  const [trust, setTrust] = useState<TrustMap>(() => migrateTrust(sessionSave));
  const trustRef = useRef(trust);
  trustRef.current = trust;
  const [metPeople, setMetPeople] = useState<TrustPerson[]>(() => migrateMet(sessionSave));
  const metRef = useRef(metPeople);
  metRef.current = metPeople;
  const [peopleSeenTrust, setPeopleSeenTrust] = useState<Partial<TrustMap>>(
    () => migratePeopleSeen(sessionSave, migrateTrust(sessionSave)),
  );
  const [trustGainedOnDay, setTrustGainedOnDay] = useState<Partial<Record<TrustPerson, number>>>(
    () => sessionSave?.trustGainedOnDay ?? {},
  );
  const migratedClues = migrateClues(sessionSave);
  const [clues, setClues] = useState<ClueId[]>(migratedClues.clues);
  const cluesRef = useRef(clues);
  cluesRef.current = clues;
  const [clueConnections, setClueConnections] = useState<ClueConnectionId[]>(migratedClues.connections);
  const connectionsRef = useRef(clueConnections);
  connectionsRef.current = clueConnections;
  const [cluesSeen, setCluesSeen] = useState<ClueId[]>(migratedClues.cluesSeen);
  const [askedAbout, setAskedAbout] = useState<AskedAbout>(migratedClues.askedAbout);
  const askedRef = useRef(askedAbout);
  askedRef.current = askedAbout;
  const [askAboutOpen, setAskAboutOpen] = useState(false);
  const [conversationPerson, setConversationPerson] = useState<TrustPerson | null>(null);
  const gainedOnDayRef = useRef(trustGainedOnDay);
  gainedOnDayRef.current = trustGainedOnDay;
  const trustSpentRef = useRef<Partial<Record<TrustPerson, number>>>({});
  const [showDinerBoardHint, setShowDinerBoardHint] = useState(false);
  const [chapter, setChapter] = useState(sessionSave?.chapter ?? 1);
  const [closeup, setCloseup] = useState<CloseupContent | null>(null);
  const closeupQueue = useRef<(CloseupContent & { flags?: StoryFlag[] })[]>([]);
  const pendingCloseup = useRef<{
    first: CloseupContent;
    next?: CloseupContent;
    flags?: StoryFlag | StoryFlag[];
    armedAt: number;
  } | null>(null);
  const closeupRef = useRef<CloseupContent | null>(null);
  const chapterEndRef = useRef(false);
  const pendingChapterEnd = useRef(false);
  const [showChapterEnd, setShowChapterEnd] = useState(false);

  function overlayHoldsNotices() {
    return noticesAreHeld({
      closeupOpen: closeupRef.current !== null,
      conversationActive: conversationActiveRef.current,
      chapterEndOpen: chapterEndRef.current,
    });
  }

  const {
    questNotification,
    questNotificationLabel,
    questNotificationKind,
    questNotificationExiting,
    clearQuestNotification: clearNoticeCards,
    pauseNoticesForOverlay,
    pumpNotices,
    enqueueNotice,
  } = useNoticeQueue(conversationActive, overlayHoldsNotices);

  function clearQuestNotification() {
    if (locationDiscoveryTimer.current !== null) window.clearTimeout(locationDiscoveryTimer.current);
    locationDiscoveryTimer.current = null;
    clearNoticeCards();
  }

  function showChapterEndScreen() {
    chapterEndRef.current = true;
    pauseNoticesForOverlay();
    setShowChapterEnd(true);
  }

  function dismissChapterEndScreen() {
    chapterEndRef.current = false;
    pendingChapterEnd.current = false;
    setShowChapterEnd(false);
    pumpNotices();
  }

  function enqueueLead(id: QuestId) {
    // Titles always come from questTitle(), including flags set earlier in
    // this click. A hardcoded title turned Coffee for Mom into "Faded Poster".
    const message = questTitle(
      { id, status: "active" },
      { inventory: playerState.inventory, storyFlags: storyFlagsRef.current },
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
    enqueueLead("light-on-the-hill");
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
    const next = { ...storyFlagsRef.current };
    for (const flag of list) next[flag] = true;
    storyFlagsRef.current = next;
    setStoryFlags(next);
    // Keep legacy mirror in sync.
    if (list.includes("momJobConcern")) setMomJobConcernHeard(true);
    absorbDiscoveries(list);
  }

  function grantClue(id: ClueId) {
    const next = collectClue(cluesRef.current, id);
    if (!next.added) return;
    cluesRef.current = next.clues;
    setClues(next.clues);
    harlowAudio().playSfx("pen-scribble");
  }

  /** A find can pin a clue and move a sidequest. Neither one gates the main story. */
  function absorbDiscoveries(flags: StoryFlag[]) {
    const hadParkerFile = cluesRef.current.includes("parker-e");
    for (const flag of flags) {
      const clueId = clueForFlag(flag);
      if (clueId) grantClue(clueId);
    }
    if (flags.includes("emilyFileOpened") && hadParkerFile) {
      setCluesSeen((previous) => previous.filter((id) => id !== "parker-e"));
      harlowAudio().playSfx("pen-scribble");
    }
    const looked = flags.some((flag) =>
      flag === "emilyMusicBoxSeen" || flag === "emilyPolaroidSeen" || flag === "emilyNoteRead",
    );
    if (looked) {
      const started = startEmilyRoom(questsRef.current);
      if (started.started) applyQuestHooks({ startsQuest: "emilys-room" });
    }
    if (flags.includes("bootPrintSeen")) {
      const stepped = advanceGatePrint(questsRef.current);
      if (stepped !== questsRef.current) commitQuests(stepped);
    }
    if (flags.includes("waltPhotoSeen")) {
      const done = finishEmilyRoom(questsRef.current);
      if (done.completed) {
        applyQuestHooks({ completesQuest: "emilys-room", questStep: "done" });
      }
    }
  }

  function enqueueCloseup(first: CloseupContent, next?: CloseupContent & { flags?: StoryFlag[] }) {
    closeupQueue.current = next ? [next] : [];
    closeupRef.current = first;
    pauseNoticesForOverlay();
    setCloseup(first);
  }

  /** The filing-drawer pair waits until the reply that armed it has settled. */
  function revealPendingCloseup(settledLineCount = 0) {
    const pending = pendingCloseup.current;
    if (!pending || !shouldRevealArmedCloseup(pending, settledLineCount)) return;
    pendingCloseup.current = null;
    enqueueCloseup(pending.first, pending.next);
    if (pending.flags) applyFlags(pending.flags);
  }

  function chooseEscape(choice: "hide" | "run") {
    if (escapeResolved.current) return;
    escapeResolved.current = true;
    applyFlags(choice === "hide" ? "endingHid" : "endingRan");
    setEscapeOpen(false);
    setEscapeMode(choice);
  }

  function finishEscape() {
    setEscapeMode(null);
    harlowAudio().stopHeartbeat();
    const frames = endingAfterEscape(cluesRef.current);
    const [first, ...rest] = frames;
    if (!first) {
      if (pendingChapterEnd.current) {
        pendingChapterEnd.current = false;
        showChapterEndScreen();
      }
      return;
    }
    closeupQueue.current = rest;
    closeupRef.current = first;
    pauseNoticesForOverlay();
    setCloseup(first);
  }

  function dismissCloseup() {
    if (closeupRef.current?.after === "timed-choice") {
      closeupRef.current = null;
      setCloseup(null);
      escapeResolved.current = false;
      setEscapeOpen(true);
      return;
    }
    const queued = closeupQueue.current.shift();
    if (queued) {
      closeupRef.current = queued;
      setCloseup(queued);
      if (queued.flags?.length) applyFlags(queued.flags);
      return;
    }
    closeupRef.current = null;
    setCloseup(null);
    if (pendingChapterEnd.current) {
      pendingChapterEnd.current = false;
      showChapterEndScreen();
    }
    pumpNotices();
  }

  function applyQuestHooks(options: {
    startsQuest?: QuestId;
    completesQuest?: QuestId;
    /** Applied only to completesQuest (never to a quest started by the same choice). */
    questStep?: string;
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
            { inventory: playerState.inventory, storyFlags: storyFlagsRef.current },
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
    if (shouldNoticeHill(currentScene.id, gameState.time, next, storyFlags, gameState.dayNumber)) {
      next = startQuest(next, "light-on-the-hill");
      startedHill = true;
    }
    commitQuests(next);
    if (completedTitle) {
      enqueueNotice({ kind: "notice", label: "Quest complete", message: completedTitle });
    }
    if (started) enqueueLead(started);
    if (startedHill) {
      setCurrentThought(HILL_THOUGHT);
      enqueueLead("light-on-the-hill");
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
      trust,
      met: metPeople,
      peopleSeenTrust,
      trustGainedOnDay,
      clues,
      clueConnections,
      cluesSeen,
      askedAbout,
      stalkerSightings,
      stalkerSeenAt,
    };
  }, [gameState, playerState, currentScene, busStopReturnSceneId, marleneActive, deskCigarettesPickedUp, scrapyardKnifePickedUp, garageFlashlightPickedUp, momTalked, momJobConcernHeard, job, jobQuestTarget, quests, storyFlags, chapter, trust, metPeople, peopleSeenTrust, trustGainedOnDay, clues, clueConnections, cluesSeen, askedAbout, stalkerSightings, stalkerSeenAt]);

  // This is a temporary, per-tab resume point. It survives refreshes but is
  // automatically cleared when the browser tab is closed.
  useEffect(() => {
    const save = currentSave();
    if (readSessionSave()) writeSessionSave(save);
    const request = pendingAutosave.current;
    if (!request) return;
    pendingAutosave.current = null;
    const previous = readAutosave();
    const plan = planAutosave({
      request,
      game: save.gameState,
      previousSceneStamp: previous?.sceneStamp ?? null,
    });
    if (!plan.write) return;
    const wrote = writeAutosave({
      savedAt: new Date().toISOString(),
      sceneStamp: plan.sceneStamp,
      save,
    });
    if (!wrote) return;
    if (request.quest) harlowAudio().playSfx("pen-scribble");
    pulseAutosave();
  }, [currentSave]);

  function clearDayFlags() {
    const next = { ...storyFlagsRef.current };
    let changed = false;
    for (const flag of ["folderLockedToday", "rachelFolderCover"] as const) {
      if (next[flag]) {
        delete next[flag];
        changed = true;
      }
    }
    if (!changed) return;
    storyFlagsRef.current = next;
    setStoryFlags(next);
  }

  const phoneMorning = useRef<GameState | null>(null);

  function beginPhone(state: GameState) {
    phoneIntercept.current = false;
    const hallway = scenes.hallway;
    phoneMorning.current = phoneResumeSleep.current ? { ...state, time: 7 * 60 } : null;
    applyFlags("nightCallClear");
    const weather = phoneHomeWeather(state.weather);
    setCurrentScene(hallway);
    setGameState({ ...state, time: 2 * 60, weather, location: hallway.location });
    dayRef.current = state.dayNumber;
    setPhonePhase("ring");
    setFigureActive(false);
    setCurrentThought(PHONE_THOUGHT);
    setCurrentEffects([]);
  }

  function clearMusicBoxThought() {
    if (musicBoxThoughtTimer.current != null) {
      window.clearTimeout(musicBoxThoughtTimer.current);
      musicBoxThoughtTimer.current = null;
    }
  }

  function beginMusicBoxCall(state: GameState) {
    applyFlags("musicBoxCall");
    const hallway = scenes.hallway;
    setCurrentScene(hallway);
    setGameState({ ...state, location: hallway.location });
    setPhonePhase("music");
    clearStalkerLayer();
    setFigureActive(false);
    setCatchEntrance(false);
    setConversationPerson(null);
    setActiveConversation({ opening: MUSIC_BOX_LINES, choices: [] });
    setConversation(MUSIC_BOX_LINES);
    setConversationEnding(true);
    setConversationActive(true);
    conversationActiveRef.current = true;
    setCurrentThought(null);
    setCurrentEffects([]);
  }

  function holdMusicBox(index: number) {
    if (index === 0) harlowAudio().playMusicBox();
  }

  function advanceMusicBox(index: number) {
    if (index === 0) harlowAudio().stopMusicBox();
  }

  function finishMusicBoxCall() {
    harlowAudio().stopMusicBox();
    setPhonePhase(null);
    setConversationActive(false);
    setConversationEnding(false);
    conversationActiveRef.current = false;
    setCatchEntrance(false);
    setConversation([]);
    setActiveConversation(null);
    clearMusicBoxThought();
    setCurrentThought(MUSIC_BOX_THOUGHTS[0]);
    musicBoxThoughtTimer.current = window.setTimeout(() => {
      musicBoxThoughtTimer.current = null;
      setCurrentThought(MUSIC_BOX_THOUGHTS[1]);
    }, MUSIC_BOX_THOUGHT_MS);
  }

  function continueSleepAfterCall() {
    const morning = phoneMorning.current;
    phoneMorning.current = null;
    phoneResumeSleep.current = false;
    if (!morning) return;
    dayRef.current = morning.dayNumber;
    setGameState({ ...morning, location: scenes["ethan-room"].location });
    moveToScene(scenes["ethan-room"].id, morning.time, morning.weather, morning.dayOfWeek);
    const rested = restAfterSleep(playerState);
    setPlayerState(rested);
    setCurrentEffects(statDeltas(playerState, rested));
    setNewDayAnnouncement(morning);
  }

  function finishNightCall(answered: boolean) {
    harlowAudio().stopReceiverRain();
    applyFlags("nightCallHeard");
    if (answered) applyFlags("nightCallClear");
    setPhonePhase(null);
    const resume = phoneResumeSleep.current;
    const thought = answered ? PHONE_ANSWER_THOUGHT : PHONE_IGNORE_THOUGHT;
    const wait = answered ? PHONE_SILENCE_MS : 0;
    window.setTimeout(() => {
      setCurrentThought(thought);
      if (resume) window.setTimeout(continueSleepAfterCall, 2200);
    }, wait);
  }

  function markCemeteryLunch() {
    if (storyFlagsRef.current.cemeteryLunchHeard) return;
    applyFlags("cemeteryLunchHeard");
  }

  function finishPhoneAnswer() {
    harlowAudio().stopReceiverRain();
    applyFlags("nightCallHeard");
    setPhonePhase(null);
    setConversationActive(false);
    setConversationEnding(false);
    conversationActiveRef.current = false;
    setCatchEntrance(false);
    setConversation([]);
    setActiveConversation(null);
    setCurrentThought(PHONE_ANSWER_THOUGHT);
    if (phoneResumeSleep.current) window.setTimeout(continueSleepAfterCall, 2200);
  }

  function holdPhoneLine(index: number) {
    if (index === 0) harlowAudio().playReceiverRain();
  }

  function advancePhoneLine(index: number) {
    if (index >= 2) harlowAudio().stopReceiverRain();
  }

  function showHillPrintHint(sceneId: string, time: number, dayNumber: number) {
    const flags = storyFlagsRef.current;
    if (!hillPrintMissedDue({
      sceneId,
      dayNumber,
      time,
      flags,
      heard: Boolean(flags.hillPrintHint),
    })) return false;
    applyFlags("hillPrintHint");
    setCurrentThought(HILL_PRINT_MISSED);
    return true;
  }

  function stalkerContext(sceneId: string, time: number, dayNumber: number): StalkerContext {
    return {
      sceneId,
      dayNumber,
      time,
      sightings: stalkerCountRef.current,
      lastAt: stalkerAtRef.current,
      inConversation: conversationActiveRef.current,
    };
  }

  function noteStalker(dayNumber: number, time: number) {
    const next = nextStalkerCount(stalkerCountRef.current);
    stalkerCountRef.current = next;
    setStalkerSightings(next);
    const at = stalkerMinute(dayNumber, time);
    stalkerAtRef.current = at;
    setStalkerSeenAt(at);
  }

  function gateHasStarted() {
    return (
      questsRef.current.some((quest) => quest.id === "the-gate")
      || Boolean(storyFlagsRef.current.margaretGossipHeard)
    );
  }

  function clearStalkerLayer() {
    setStalkerMode(null);
  }

  /**
   * Sightings 1 and 2. Returns true when a line was just put on screen, so a
   * scene thought does not replace it.
   */
  function noticeStalker(fromScene: string, sceneId: string, time: number, dayNumber: number) {
    if (conversationActiveRef.current || closeupRef.current) return false;
    const flags = storyFlagsRef.current;
    const ctx = stalkerContext(sceneId, time, dayNumber);
    if (streetStalkerDue({
      ...ctx,
      fromScene,
      gateStarted: gateHasStarted(),
      seen: Boolean(flags.streetStalkerSeen),
      bootPrintSeen: Boolean(flags.bootPrintSeen),
      figureSeen: Boolean(flags.daytimeFigureSeen),
    })) {
      applyFlags("streetStalkerSeen");
      noteStalker(dayNumber, time);
      setStalkerMode("street");
      setCurrentThought(STREET_STALKER_THOUGHT);
      return true;
    }
    if (dinerWindowDue({ ...ctx, seen: Boolean(flags.dinerWindowSeen) })) {
      applyFlags("dinerWindowSeen");
      noteStalker(dayNumber, time);
      setStalkerMode("window");
      setCurrentThought(WINDOW_STALKER_THOUGHT);
      return true;
    }
    return false;
  }

  function noticeArrivals(sceneId: string, time: number, dayNumber: number) {
    const flags = storyFlagsRef.current;
    if (sceneId === "cementary" && cemeterySundayGate(dayNumber, time) === "day") {
      setCurrentThought(CEMETERY_EMPTY);
      return;
    }
    if (porchNeedlesDue({ sceneId, dayNumber, time, seen: Boolean(flags.porchNeedlesSeen) })) {
      applyFlags("porchNeedlesSeen");
      setCurrentThought(PINE_NEEDLE_LINES[0]);
      window.setTimeout(() => setCurrentThought(PINE_NEEDLE_LINES[1]), 2800);
      return;
    }
    if (hillDarkDue({ sceneId, dayNumber, time, heard: Boolean(flags.hillDarkTonight) })) {
      applyFlags("hillDarkTonight");
      setCurrentThought(HILL_DARK_TONIGHT);
      return;
    }
    if (showHillPrintHint(sceneId, time, dayNumber)) return;
    if (emilyDoorAjarDue({
      sceneId,
      dayNumber,
      time,
      seen: Boolean(flags.emilyDoorAjar),
    })) {
      applyFlags("emilyDoorAjar");
      setCurrentThought(EMILY_DOOR_THOUGHT);
      return;
    }
    const woods = {
      ...stalkerContext(sceneId, time, dayNumber),
      bootPrintSeen: Boolean(flags.bootPrintSeen),
      seen: Boolean(flags.daytimeFigureSeen),
    };
    if (woodsFigureDue(woods)) {
      if (woodsSightingCounts(woods)) noteStalker(dayNumber, time);
      applyFlags("daytimeFigureSeen");
      setFigureActive(true);
      setCurrentThought(FIGURE_THOUGHT);
    }
  }

  function clearGravel() {
    for (const id of gravelTimers.current) window.clearTimeout(id);
    gravelTimers.current = [];
    harlowAudio().stopFootsteps();
    setGravelHold(false);
  }

  function beginGravel() {
    clearGravel();
    applyFlags("gravelFootsteps");
    setGravelHold(true);
    setCurrentThought(GRAVEL_LINES[0]);
    harlowAudio().loopFootsteps();
    gravelTimers.current = [
      window.setTimeout(() => setCurrentThought(GRAVEL_LINES[1]), GRAVEL_LINE_MS),
      window.setTimeout(() => {
        setCurrentThought(GRAVEL_LINES[2]);
        setGravelHold(false);
      }, GRAVEL_LINE_MS * 2),
      window.setTimeout(() => harlowAudio().stopFootsteps(), GRAVEL_LINE_MS * 2 + GRAVEL_TAIL_MS),
    ];
  }

  function advanceTime(
    minutes: number,
    completingMomQuest = false,
    bypassExhaustionLock = false,
    destinationSceneId: string | null = null,
  ) {
    // Keep time changes in one place so thoughts and day/night images stay synced.
    // Waiting is the only action capped at 03:30. A walk spends its full cost,
    // including the 40 minutes home from the sanatorium.
    const timeToAdvance = actionMinutes(
      gameState.time,
      minutes,
      momTalked,
      completingMomQuest,
    );
    const nextGameState = advanceGameTime(gameState, timeToAdvance);
    const toScene = destinationSceneId ?? currentScene.id;
    const rings = nightCallRings({
      heard: Boolean(storyFlagsRef.current.nightCallHeard),
      fromTime: gameState.time,
      toTime: nextGameState.time,
      fromDay: gameState.dayNumber,
      toDay: nextGameState.dayNumber,
      fromScene: currentScene.id,
      toScene,
    });
    const played = rings ? { ...nextGameState, time: 2 * 60 } : nextGameState;
    if (rings) {
      phoneIntercept.current = true;
      if (bypassExhaustionLock) phoneResumeSleep.current = true;
    }
    dayRef.current = played.dayNumber;
    if (played.dayNumber !== gameState.dayNumber) {
      clearDayFlags();
      commitQuests(questsRef.current);
    }

    setGameState(played);
    if (rings) return played;
    // A walk leaves the yard before the new time is "spent" there. Notice the
    // hill on the scene Ethan arrives in, not the one he is walking out of.
    const hillNow = shouldNoticeHill(
      hillCheckScene(currentScene.id, destinationSceneId),
      played.time,
      questsRef.current,
      storyFlags,
      played.dayNumber,
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
    const stayed = !destinationSceneId || destinationSceneId === currentScene.id;
    if (stayed) showHillPrintHint(currentScene.id, played.time, played.dayNumber);
    if (
      stayed
      && emilyDoorAjarDue({
        sceneId: currentScene.id,
        dayNumber: played.dayNumber,
        time: played.time,
        seen: Boolean(storyFlagsRef.current.emilyDoorAjar),
      })
    ) {
      applyFlags("emilyDoorAjar");
      setCurrentThought(EMILY_DOOR_THOUGHT);
    }
    if (stayed) noticeStalker(currentScene.id, currentScene.id, played.time, played.dayNumber);

    return played;
  }

  function moveToScene(
    sceneId: string,
    time: number,
    weather: Weather = gameState.weather,
    day: GameState["dayOfWeek"] = gameState.dayOfWeek,
    options?: { footsteps?: boolean },
  ) {
    // Every `nextScene` in scene data must match a key in `scenes`.
    const nextScene = scenes[sceneId as keyof typeof scenes];

    if (!nextScene) {
      return;
    }

    clearStalkerLayer();

    if (phoneIntercept.current) {
      beginPhone({
        ...gameState,
        time,
        weather,
        dayOfWeek: day,
        dayNumber: dayRef.current,
        location: scenes.hallway.location,
      });
      return;
    }

    clearMusicBoxThought();
    if (musicBoxCallDue({
      answered: Boolean(storyFlagsRef.current.nightCallClear),
      heard: Boolean(storyFlagsRef.current.musicBoxCall),
      dayNumber: dayRef.current,
      time,
      fromScene: currentScene.id,
      toScene: sceneId,
    })) {
      beginMusicBoxCall({
        ...gameState,
        time,
        weather,
        dayOfWeek: day,
        dayNumber: dayRef.current,
      });
      return;
    }

    if (sceneId === "hospital-reception" && currentScene.id !== sceneId) {
      setMarleneActive(false);
    }

    setCurrentScene(nextScene);
    setCurrentEffects([]);

    const hillNow = shouldNoticeHill(sceneId, time, questsRef.current, storyFlags, dayRef.current);
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
    noticeArrivals(sceneId, time, dayRef.current);
    const stalkerSpoke = noticeStalker(currentScene.id, sceneId, time, dayRef.current);
    if (sceneId === "miller-lake" && !questsRef.current.some((quest) => quest.id === "miller-lake")) {
      applyQuestHooks({ startsQuest: "miller-lake" });
      if (!stalkerSpoke) setCurrentThought(MILLER_ARRIVAL);
    }

    if (
      sceneId === "diner-inside"
      && !storyFlagsRef.current.posterFound
      && !storyFlagsRef.current.dinerBoardHintSeen
    ) {
      applyFlags("dinerBoardHintSeen");
      setShowDinerBoardHint(true);
    } else if (sceneId !== "diner-inside") {
      setShowDinerBoardHint(false);
    }

    setGameState((previous) => ({
      ...previous,
      time,
      location: nextScene.location,
    }));

    if (nextScene.id !== currentScene.id) {
      requestAutosave({ sceneChanged: true });
      if (options?.footsteps) harlowAudio().playSfx("footsteps");
    }
  }

  function openConversation() {
    cancelPendingReply();
    // The action determines *which* NPC to talk to; the scene owns the dialogue.
    const selectedConversation =
      currentScene.id === "kitchen" && !momTalked
        ? momDeathConversation
        : currentScene.id === "elrod-house"
          ? storyFlags.walterStationTalk
            ? rachelFrontYardConversation
            : rachelElrodConversation
          : currentScene.conversation;
    const asEmployee =
      !!selectedConversation?.jobOpening && selectedConversation.jobOpening.job === job;
    const baseOpening = asEmployee
      ? selectedConversation.jobOpening!.opening
      : selectedConversation?.opening;

    if (!baseOpening || !selectedConversation) {
      return;
    }

    const person = personFromOpening(baseOpening);
    const returning = person ? metRef.current.includes(person) : false;
    if (person && !returning) {
      const nextMet = [...metRef.current, person];
      metRef.current = nextMet;
      setMetPeople(nextMet);
    }
    // The promise is set during the first talk. A later opening is the follow-up.
    if (
      person === "rachel"
      && storyFlagsRef.current.rachelComebackAsked
      && !storyFlagsRef.current.rachelFollowedUp
    ) {
      applyFlags("rachelFollowedUp");
    }
    const choiceContext = {
      storyFlags: storyFlagsRef.current,
      quests: questsRef.current,
      job,
      jobQuestTarget,
      usedLabels: [] as string[],
      openedAsEmployee: asEmployee,
      inventory: playerState.inventory,
      trust: trustRef.current,
      money: playerState.money,
      sceneId: currentScene.id,
      time: gameState.time,
      dayNumber: gameState.dayNumber,
      clues: cluesRef.current,
    };
    const gossipWaiting = Boolean(
      person === "margaret"
      && returning
      && trustRef.current.margaret >= 2
      && !storyFlagsRef.current.margaretGossipHeard,
    );
    const nothingNew = Boolean(
      person
      && returning
      && !gossipWaiting
      && visitHasNothingNew(selectedConversation.choices, choiceContext),
    );
    const built = buildNpcOpening({
      opening: nothingNew && person ? repeatVisitOpening(person, gameState.time) : baseOpening,
      person,
      trust: person ? trustRef.current[person] : 0,
      returning,
      mode: selectedConversation.returnGreeting,
      gossipHeard: Boolean(storyFlagsRef.current.margaretGossipHeard),
      skipGreeting: nothingNew,
    });
    setConversationPerson(person);
    setAskAboutOpen(false);
    if (built.gossipShown) {
      applyFlags("margaretGossipHeard");
      const gate = startTheGate(questsRef.current);
      if (gate.started) applyQuestHooks({ startsQuest: "the-gate" });
    }
    let spoken = built.opening;
    const heard = storyFlagsRef.current;
    if (lindaPhoneDue({
      sceneId: currentScene.id,
      dayNumber: gameState.dayNumber,
      time: gameState.time,
      heardCall: Boolean(heard.nightCallHeard),
      heard: Boolean(heard.lindaPhoneHeard),
    })) {
      spoken = [...LINDA_PHONE_LINES, ...spoken];
      applyFlags("lindaPhoneHeard");
    } else if (person === "rachel" && rachelDay2Due({
      dayNumber: gameState.dayNumber,
      heard: Boolean(heard.rachelDay2Talk),
    })) {
      spoken = [...RACHEL_DAY2_LINES, ...spoken];
      applyFlags("rachelDay2Talk");
    } else if (person === "margaret" && margaretDay2Due({
      dayNumber: gameState.dayNumber,
      heard: Boolean(heard.margaretShotgun),
    })) {
      spoken = [...MARGARET_DAY2_LINES, ...spoken];
      applyFlags("margaretShotgun");
    } else if (
      currentScene.id === "motel-inside"
      && earlCashDue({
        room6Heard: Boolean(heard.room6Heard),
        heard: Boolean(heard.earlCashHeard),
      })
    ) {
      spoken = [npc("Earl", EARL_CASH_LINE)];
      applyFlags("earlCashHeard");
    }
    if (lindaBackDoorDue({
      sceneId: currentScene.id,
      dayNumber: gameState.dayNumber,
      time: gameState.time,
      windowSeen: Boolean(heard.dinerWindowSeen),
      heard: Boolean(heard.backDoorOpen),
    })) {
      spoken = [...LINDA_BACK_DOOR_LINES, ...spoken];
      applyFlags("backDoorOpen");
    }
    if (person === "margaret" && margaretDeadboltDue({
      dayNumber: gameState.dayNumber,
      heard: Boolean(heard.margaretDeadbolts),
    })) {
      spoken = [...spoken, npc("Margaret", MARGARET_DEADBOLT)];
      applyFlags("margaretDeadbolts");
    }
    if (
      currentScene.id === "motel-inside"
      && earlTowelDue({
        dayNumber: gameState.dayNumber,
        room6Heard: Boolean(heard.room6Heard),
        heard: Boolean(heard.earlTowels),
      })
    ) {
      spoken = [...spoken, npc("Earl", EARL_TOWEL)];
      applyFlags("earlTowels");
    }
    trustSpentRef.current = {};

    conversationActiveRef.current = true;
    pendingCloseup.current = null;
    setActiveConversation(selectedConversation);
    setConversationEnding(false);
    setOpenedAsEmployee(asEmployee);
    setUsedConversationChoices([]);
    setConversation(spoken);
    setConversationActive(true);
  }

  function closeConversation() {
    setAskAboutOpen(false);
    setConversationPerson(null);
    setConversationActive(false);
    setConversationEnding(false);
    // Drop the lock immediately so the scene choices return while the
    // dialogue layer finishes fading. Notices wait until that layer is gone.
    conversationActiveRef.current = false;
    setCatchEntrance(false);
    const after = afterConversationRef.current;
    afterConversationRef.current = null;
    window.setTimeout(() => {
      setConversation([]);
      setActiveConversation(null);
      setUsedConversationChoices([]);
      pumpNotices();
      after?.();
    }, 300);
  }

  function notifyMomQuest() {
    enqueueLead("talk-to-mom");
  }

  function applyChoiceEffects(choice: Choice) {
    // Effects are optional and update both the player state and feedback text.
    if (!choice.effects) {
      return;
    }

    const next = applyEffects(playerState, choice.effects);
    setPlayerState(next);
    setCurrentEffects(statDeltas(playerState, next));
  }

  function showLateNightActionThought(message = "That can wait till morning. I'm beat.") {
    if (lateNightThoughtTimer.current !== null) {
      window.clearTimeout(lateNightThoughtTimer.current);
    }
    setLateNightActionThought(message);
    lateNightThoughtTimer.current = window.setTimeout(() => {
      setLateNightActionThought(null);
      lateNightThoughtTimer.current = null;
    }, 2600);
  }

  function isLateNight() {
    return isTiredWindow(gameState.time);
  }

  function canTakeLateNightAction(choice: GameChoice) {
    return lateNightChoiceAllowed(choice, {
      time: gameState.time,
      sceneId: currentScene.id,
      lightOnTheHillActive: isQuestActive(questsRef.current, "light-on-the-hill"),
    });
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

    setConversation((previous) => {
      const next = [...previous, ...choice.response.slice(0, npcIndex)];
      conversationRef.current = next;
      return next;
    });
    setReplyPending(true);
    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null;
      setReplyPending(false);
      finishConversationChoice({ ...choice, response: choice.response.slice(npcIndex) });
    }, NPC_REPLY_DELAY);
  }

  function finishConversationChoice(choice: ConversationChoice) {
    // conversationRef, not the state closed over by the click. By the time
    // Walter's reply is committed, Ethan's lead-in is already in the log.
    const nextLabels = [...usedConversationChoices, choice.label];
    const stare =
      activeConversation === rachelElrodConversation
      && rachelTapeStareDue({
        labels: nextLabels,
        tapeSeen: Boolean(storyFlagsRef.current.tapeSeen),
        heard: Boolean(storyFlagsRef.current.rachelTapeStare),
      });
    const next = [
      ...conversationRef.current,
      ...choice.response,
      ...(stare ? [thought(RACHEL_TAPE_STARE)] : []),
    ];
    if (stare) applyFlags("rachelTapeStare");
    conversationRef.current = next;
    setConversation(next);
    if (choice.closeup) {
      const armed: ArmedConversationCloseup = { armedAt: dialogueLineCount(next) };
      pendingCloseup.current = {
        first: {
          image: plateUrl(choice.closeup.image),
          thought: choice.closeup.thought,
          label: choice.closeup.label,
          inscriptions: choice.closeup.inscriptions,
        },
        next: choice.closeup.next
          ? {
              image: plateUrl(choice.closeup.next.image),
              thought: choice.closeup.next.thought,
              label: choice.closeup.next.label,
              inscriptions: choice.closeup.next.inscriptions,
            }
          : undefined,
        flags: choice.closeup.setsFlags,
        armedAt: armed.armedAt,
      };
    }

    const flags = choice.storyFlag;
    const flagList = !flags ? [] : Array.isArray(flags) ? flags : [flags];
    if (flagList.includes("momJobConcern") && !momJobConcernHeard) {
      setMomJobConcernHeard(true);
    }
    if (flagList.includes("willHelpMom") && !job) {
      setCurrentThought("I gotta get a job. Maybe those flyers on the light pole out front.");
    }
    if (flagList.length) applyFlags(flagList);

    if (choice.trust) {
      const nextTrust = applyConversationTrust(
        {
          trust: trustRef.current,
          spent: trustSpentRef.current,
          gainedOnDay: gainedOnDayRef.current,
        },
        choice.trust,
        gameState.dayNumber,
      );
      trustRef.current = nextTrust.trust;
      trustSpentRef.current = nextTrust.spent;
      gainedOnDayRef.current = nextTrust.gainedOnDay;
      setTrust(nextTrust.trust);
      setTrustGainedOnDay(nextTrust.gainedOnDay);
    }

    if (choice.effects) {
      const effects = choice.effects;
      setPlayerState((previous) => applyEffects(previous, effects));
      const notices = statDeltas(playerState, applyEffects(playerState, effects));
      if (notices.length) setCurrentEffects(notices);
    }

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
        enqueueLead("the-tape");
      }
      if (choice.response.length === 0) closeConversation();
      else setConversationEnding(true);
      return;
    }

    setUsedConversationChoices((previous) => [...previous, choice.label]);
  }

  function handleTravel(choice: Choice) {
    if (choice.nextScene === "cementary" && cemeteryTripIsDark(gameState.dayNumber, gameState.time, choice.timeCost)) {
      setCurrentThought(CEMETERY_DARK);
      setShowTravel(true);
      return;
    }
    // Travel waits for the overlay before applying its time cost and effects.
    const destination = scenes[choice.nextScene as keyof typeof scenes]?.location ?? "Unknown";
    const destinationScene = scenes[choice.nextScene as keyof typeof scenes];
    // The walk plate should already be decoded when the overlay ends, so the
    // diner caption is not sitting on the front yard for a second.
    if (destinationScene) {
      const arrival = gameState.time + choice.timeCost;
      const preloader = new window.Image();
      preloader.src = sceneWeatherPlate(
        destinationScene,
        arrival >= 1440 ? arrival - 1440 : arrival,
        gameState.weather,
      );
    }

    setTravelingTo({
      location: destination,
      method: choice.action.toLowerCase().includes("bus") ? "bus" : "walk",
      isNight: isNightTime(gameState.time),
      rainy: RAIN_WEATHER.includes(gameState.weather),
    });

    const originId = currentScene.id;
    window.setTimeout(() => {
      const nextGameState = advanceTime(choice.timeCost, false, false, choice.nextScene);
      const gravel = gravelWalkDue({
        fromScene: originId,
        toScene: choice.nextScene,
        hillActive: isQuestActive(questsRef.current, "light-on-the-hill"),
        entered: Boolean(storyFlagsRef.current.sanatoriumEntered),
        heard: Boolean(storyFlagsRef.current.gravelFootsteps),
      }) && !phoneIntercept.current;
      moveToScene(choice.nextScene, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
        footsteps: !gravel,
      });
      if (gravel) beginGravel();
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
      rainy: RAIN_WEATHER.includes(gameState.weather),
    });

    window.setTimeout(() => {
      const next = advanceTime(shiftMinutes);
      if (phoneIntercept.current) {
        beginPhone({ ...next, location: scenes.hallway.location });
        setTravelingTo(null);
        return;
      }
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

    if ("action" in choice && choice.action === "answerNightCall") {
      setPhonePhase("talk");
      setCatchEntrance(false);
      setConversationPerson(null);
      setActiveConversation({ opening: PHONE_ANSWER_LINES, choices: [] });
      setConversation(PHONE_ANSWER_LINES);
      setConversationEnding(true);
      setConversationActive(true);
      conversationActiveRef.current = true;
      return;
    }
    if (
      "action" in choice
      && (choice.action === "enterCemetery" || choice.action === "goCemeteryBackside")
      && cemeterySundayGate(gameState.dayNumber, gameState.time) === "dark"
    ) {
      setCurrentThought(CEMETERY_DARK);
      setShowTravel(true);
      return;
    }
    if ("action" in choice && choice.action === "lookAgainStalker") {
      setStalkerMode(null);
      setCurrentThought(STREET_STALKER_GONE);
      return;
    }
    if ("action" in choice && choice.action === "turnFromWindow") {
      setStalkerMode(null);
      setCurrentThought(WINDOW_STALKER_GONE);
      return;
    }
    if ("action" in choice && choice.action === "tryElrodDoor") {
      applyFlags("lockCheckHeard");
      setCurrentThought(LOCK_JOKE);
      return;
    }
    if ("action" in choice && choice.action === "ignoreNightCall") {
      finishNightCall(false);
      return;
    }
    if ("action" in choice && choice.action === "followDaytimeFigure") {
      setFigureActive(false);
      applyFlags("trailFollowed");
      setCurrentThought(FIGURE_FOLLOW);
      return;
    }
    if ("action" in choice && choice.action === "stayDaytimeFigure") {
      setFigureActive(false);
      setCurrentThought(FIGURE_STAY);
      return;
    }

    if (!("response" in choice)) {
      const hint = timeHint({
        action: choice.action,
        sceneId: currentScene.id,
        time: gameState.time,
        dayOfWeek: gameState.dayOfWeek,
        job,
        flags: storyFlagsRef.current,
        quests: questsRef.current,
        knifeTaken: scrapyardKnifePickedUp,
      });
      if (hint) {
        showLateNightActionThought(hint);
        return;
      }
    }

    if (!canTakeLateNightAction(choice)) {
      showLateNightActionThought();
      return;
    }

    if ("response" in choice) {
      if (choice.label === ASK_ABOUT_LABEL) {
        setAskAboutOpen(true);
        return;
      }
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

    if (choice.action === "lookAtRoom6") {
      setCurrentThought("Don't knock. He doesn't like it.");
      return;
    }
    if (choice.action === "lookAtEmilyFolder") {
      const look = folderLook({
        time: gameState.time,
        fileDrawerSeen: storyFlagsRef.current.fileDrawerSeen,
        emilyFileOpened: storyFlagsRef.current.emilyFileOpened,
        folderLockedToday: storyFlagsRef.current.folderLockedToday,
        rachelFolderCover: storyFlagsRef.current.rachelFolderCover,
      });
      if (look === "caught") {
        const nextTrust = applyConversationTrust(
          {
            trust: trustRef.current,
            spent: trustSpentRef.current,
            gainedOnDay: gainedOnDayRef.current,
          },
          { person: "walter", amount: -1 },
          gameState.dayNumber,
        );
        trustRef.current = nextTrust.trust;
        trustSpentRef.current = nextTrust.spent;
        gainedOnDayRef.current = nextTrust.gainedOnDay;
        setTrust(nextTrust.trust);
        setTrustGainedOnDay(nextTrust.gainedOnDay);
        const snoop = folderSnoopDue({
          caughtBefore: Boolean(storyFlagsRef.current.folderCaught),
          heard: Boolean(storyFlagsRef.current.folderSnoopHeard),
        });
        const caughtLines = snoop ? FOLDER_SNOOP_LINES : FOLDER_CAUGHT_LINES;
        applyFlags(snoop ? ["folderSnoopHeard", "folderLockedToday"] : ["folderCaught", "folderLockedToday"]);
        setCatchEntrance(true);
        setConversationPerson("walter");
        setActiveConversation({ opening: caughtLines, choices: [] });
        setConversation(caughtLines);
        setConversationEnding(true);
        setConversationActive(true);
        conversationActiveRef.current = true;
        afterConversationRef.current = () => {
          setCatchEntrance(false);
          const lobby = scenes["police-station-inside"];
          if (lobby) {
            setCurrentScene(lobby);
            setGameState((previous) => ({ ...previous, location: lobby.location }));
          }
        };
        return;
      }
      if (look === "open" && storyFlagsRef.current.rachelFolderCover) {
        const nextFlags = { ...storyFlagsRef.current };
        delete nextFlags.rachelFolderCover;
        storyFlagsRef.current = nextFlags;
        setStoryFlags(nextFlags);
      }
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
      const lid = choice.action === "lookAtEmilyMusicBox"
        && storyFlagsRef.current.emilyDoorAjar
        && !storyFlagsRef.current.emilyMusicBoxLid;
      if (lid) applyFlags("emilyMusicBoxLid");
      enqueueCloseup(
        {
          image: plateUrl(
            choice.action === "lookAtElrodBootPrint"
              ? bootPrintImage(gameState.weather)
              : choice.action === "lookAtEmilyStone"
                ? emilyGraveStoneImage(gameState.weather, gameState.time)
                : choice.closeup.image,
          ),
          video: choice.closeup.video ? plateUrl(choice.closeup.video) : undefined,
          thought: lid ? EMILY_BOX_THOUGHT : choice.closeup.thought,
          label: choice.closeup.label,
          disableWeatherFilter: choice.closeup.disableWeatherFilter,
          inscriptions: choice.closeup.inscriptions,
          fallbackImage: choice.closeup.fallbackImage
            ? plateUrl(choice.closeup.fallbackImage)
            : undefined,
          windowLight: choice.action === "lookAtSanatoriumHill"
            ? { thought: HILL_LIGHT_OUT }
            : undefined,
        },
        choice.closeup.next
          ? {
              image: plateUrl(choice.closeup.next.image),
              thought: choice.closeup.next.thought,
              label: choice.closeup.next.label,
              disableWeatherFilter: choice.closeup.next.disableWeatherFilter,
              inscriptions: choice.closeup.next.inscriptions,
              fallbackImage: choice.closeup.next.fallbackImage
                ? plateUrl(choice.closeup.next.fallbackImage)
                : undefined,
              flags: choice.closeup.next.setsFlags,
            }
          : undefined,
      );
    }
    if (choice.action === "lookAtSanatoriumCigarette") {
      closeupQueue.current = endingFrames(cluesRef.current);
    }
    if (choice.setsFlags) applyFlags(choice.setsFlags);

    // Poster found before the coffee errand starts the quest. The card title
    // is questTitle() (Faded Poster, because posterFound is already set).
    // Finding it mid-quest only renames the notebook entry — no second card.
    if (choice.action === "lookAtDinerBulletin") {
      if (!isQuestCompleted(questsRef.current, "faded-poster")) {
        if (!isQuestActive(questsRef.current, "faded-poster")) {
          commitQuests(startQuest(questsRef.current, "faded-poster", "poster"));
          enqueueLead("faded-poster");
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
      if (choice.closeup || closeupRef.current) {
        pendingChapterEnd.current = true;
      } else {
        showChapterEndScreen();
      }
    }

    if (choice.action === "enterSanatorium") {
      applyFlags("sanatoriumEntered");
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
      if (shouldMarkRachelWaited(storyFlagsRef.current)) applyFlags("rachelWaited");
      const minutesUntilSevenAm = gameState.time < TIRED_END
        ? TIRED_END - gameState.time
        : 1440 - gameState.time + TIRED_END;
      const nextGameState = advanceTime(minutesUntilSevenAm, false, true, "ethan-room");
      if (phoneIntercept.current) {
        moveToScene("hallway", nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
          footsteps: false,
        });
        return;
      }
      moveToScene("ethan-room", nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
        footsteps: false,
      });
      requestAutosave({ sleep: true });
      const rested = restAfterSleep(playerState);
      setPlayerState(rested);
      setCurrentEffects(statDeltas(playerState, rested));
      setNewDayAnnouncement(nextGameState);
      return;
    }

    if (choice.action === "leaveBusStop") {
    const nextGameState = advanceTime(choice.timeCost, false, false, busStopReturnSceneId);
    moveToScene(busStopReturnSceneId, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
      footsteps: true,
    });
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

    moveToScene(nextSceneId, nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
      footsteps: !throughDoor && !choice.door && choice.timeCost > 0,
    });

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
  useEffect(() => {
    handleChoiceRef.current = handleChoice;
  });

  function goToBusStop() {
    if (!lateNightChoiceAllowed(
      { action: "goToBusStop", nextScene: "bus-stop" },
      {
        time: gameState.time,
        sceneId: currentScene.id,
        lightOnTheHillActive: isQuestActive(questsRef.current, "light-on-the-hill"),
      },
    )) {
      showLateNightActionThought();
      return;
    }
    setBusStopReturnSceneId(currentScene.id);
    const nextGameState = advanceTime(0, false, false, "bus-stop");
    moveToScene("bus-stop", nextGameState.time, nextGameState.weather, nextGameState.dayOfWeek, {
      footsteps: true,
    });
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
    return choiceIsAvailable(choice, {
      gameState,
      currentSceneId: currentScene.id,
      momTalked,
      job,
      jobQuestTarget,
      quests,
      marleneActive,
      deskCigarettesPickedUp,
      scrapyardKnifePickedUp,
      garageFlashlightPickedUp,
      inventory: playerState.inventory,
      storyFlags,
      hasFlag,
      hasAllFlags,
      hasAnyFlag,
    });
  }


  function saveGame(slotNumber: number) {
    return writeSaveSlot(slotNumber, currentSave());
  }

  function restoreSave(save: ReturnType<typeof readSaveSlot>) {
    clearAutosaveRequest();
    const savedSceneId = save ? sceneAfterPickups(save.currentSceneId, save) : null;
    const savedScene = savedSceneId && scenes[savedSceneId as keyof typeof scenes];

    // Ignore saves from an older/incomplete build instead of leaving the game
    // on a scene that no longer exists.
    if (!save || !savedScene) return false;

    const alignedState = withCanonWeekday(save.gameState);
    writeSessionSave({ ...save, gameState: alignedState });

    setGameState(alignedState);
    setPlayerState(save.playerState);
    const restoredClues = migrateClues(save);
    dayRef.current = alignedState.dayNumber;
    connectionsRef.current = restoredClues.connections;
    const restoredFlags = flagsForConnections(
      save.storyFlags ?? (save.momJobConcernHeard ? { momJobConcern: true } : {}),
      restoredClues.connections,
    );
    let restoredQuests = migrateQuestsFromLegacy(save);
    const restoredHill = shouldNoticeHill(
      savedScene.id,
      alignedState.time,
      restoredQuests,
      restoredFlags,
      alignedState.dayNumber,
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
    commitQuests(restoredQuests, { autosave: false });
    storyFlagsRef.current = restoredFlags;
    setStoryFlags(restoredFlags);
    const loadedCount = restoredStalkerCount(save.stalkerSightings, restoredFlags);
    setChapter(save.chapter ?? 1);
    const restoredTrust = migrateTrust(save);
    const restoredMet = migrateMet(save);
    trustRef.current = restoredTrust;
    setTrust(restoredTrust);
    metRef.current = restoredMet;
    setMetPeople(restoredMet);
    setPeopleSeenTrust(migratePeopleSeen(save, restoredTrust));
    const restoredGains = save.trustGainedOnDay ?? {};
    gainedOnDayRef.current = restoredGains;
    setTrustGainedOnDay(restoredGains);
    trustSpentRef.current = {};
    cluesRef.current = restoredClues.clues;
    setClues(restoredClues.clues);
    connectionsRef.current = restoredClues.connections;
    setClueConnections(restoredClues.connections);
    setCluesSeen(restoredClues.cluesSeen);
    askedRef.current = restoredClues.askedAbout;
    setAskedAbout(restoredClues.askedAbout);
    setAskAboutOpen(false);
    setConversationPerson(null);
    closeupRef.current = null;
    setCloseup(null);
    closeupQueue.current = [];
    pendingCloseup.current = null;
    pendingChapterEnd.current = false;
    chapterEndRef.current = false;
    setShowChapterEnd(false);
    clearQuestNotification();
    if (restoredHill) enqueueLead("light-on-the-hill");

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
    harlowAudio().stopReceiverRain();
    harlowAudio().stopMusicBox();
    clearMusicBoxThought();
    setPhonePhase(null);
    setFigureActive(false);
    clearStalkerLayer();
    stalkerCountRef.current = loadedCount;
    setStalkerSightings(loadedCount);
    stalkerAtRef.current = save.stalkerSeenAt ?? null;
    setStalkerSeenAt(save.stalkerSeenAt ?? null);
    escapeResolved.current = false;
    setEscapeOpen(false);
    setEscapeMode(null);
    harlowAudio().stopHeartbeat();
    setCatchEntrance(false);
    phoneIntercept.current = false;
    phoneResumeSleep.current = false;
    phoneMorning.current = null;
    clearGravel();
    return true;
  }

  function loadGame(slotNumber: number) {
    return restoreSave(readSaveSlot(slotNumber));
  }

  function loadMostRecentGame() {
    return restoreSave(readMostRecentSave());
  }

  function startNewGameSession() {
    clearAutosaveRequest();
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
    commitQuests([{ id: "talk-to-mom", status: "active" }], { autosave: false });
    storyFlagsRef.current = {};
    setStoryFlags({});
    const freshTrust = migrateTrust(null);
    trustRef.current = freshTrust;
    setTrust(freshTrust);
    metRef.current = [];
    setMetPeople([]);
    const freshSeen = migratePeopleSeen(null, freshTrust);
    setPeopleSeenTrust(freshSeen);
    gainedOnDayRef.current = {};
    setTrustGainedOnDay({});
    trustSpentRef.current = {};
    cluesRef.current = [];
    setClues([]);
    connectionsRef.current = [];
    setClueConnections([]);
    setCluesSeen([]);
    askedRef.current = {};
    setAskedAbout({});
    setAskAboutOpen(false);
    setConversationPerson(null);
    setChapter(1);
    closeupRef.current = null;
    setCloseup(null);
    closeupQueue.current = [];
    pendingCloseup.current = null;
    pendingChapterEnd.current = false;
    chapterEndRef.current = false;
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
    harlowAudio().stopReceiverRain();
    harlowAudio().stopMusicBox();
    clearMusicBoxThought();
    setPhonePhase(null);
    setFigureActive(false);
    clearStalkerLayer();
    stalkerCountRef.current = 0;
    setStalkerSightings(0);
    stalkerAtRef.current = null;
    setStalkerSeenAt(null);
    escapeResolved.current = false;
    setEscapeOpen(false);
    setEscapeMode(null);
    harlowAudio().stopHeartbeat();
    setCatchEntrance(false);
    phoneIntercept.current = false;
    phoneResumeSleep.current = false;
    phoneMorning.current = null;
    clearGravel();
    dayRef.current = freshGameState.dayNumber;

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
      trust: migrateTrust(null),
      met: [],
      peopleSeenTrust: freshSeen,
      trustGainedOnDay: {},
      clues: [],
      clueConnections: [],
      cluesSeen: [],
      askedAbout: {},
      stalkerSightings: 0,
      stalkerSeenAt: null,
    });
  }

  const activeCharacter = findActiveCharacter(currentScene.characters, {
    time: gameState.time,
    day: gameState.dayOfWeek,
    dayNumber: gameState.dayNumber,
    marleneActive,
    hasFlag,
  });

  function sceneChoiceListed(choice: Choice) {
    if (isChoiceAvailable(choice)) return true;
    return timeHint({
      action: choice.action,
      sceneId: currentScene.id,
      time: gameState.time,
      dayOfWeek: gameState.dayOfWeek,
      job,
      flags: storyFlags,
      quests,
      knifeTaken: scrapyardKnifePickedUp,
    }) !== null;
  }

  const activeChoices = phonePhase === "talk" || replyPending || conversationEnding ? [] : conversationActive
    ? replyList(activeConversation?.opening ?? [], activeConversation?.choices ?? [], {
        // The ref wins if this turn already set a flag the state snapshot
        // has not rendered yet (goodbye, then the choice list rebuilds).
        storyFlags,
        quests,
        job,
        jobQuestTarget,
        usedLabels: usedConversationChoices,
        openedAsEmployee,
        inventory: playerState.inventory,
        trust,
        money: playerState.money,
        sceneId: currentScene.id,
        time: gameState.time,
        dayNumber: gameState.dayNumber,
        clues,
      })
    : phonePhase === "ring"
      ? PHONE_RING_CHOICES
      : stalkerMode === "street"
        ? STREET_STALKER_CHOICES
      : stalkerMode === "window"
        ? WINDOW_STALKER_CHOICES
      : figureActive
        ? FIGURE_CHOICES
        : currentScene.choices.filter(sceneChoiceListed);
  const choicesWhileGravel = gravelHold ? [] : activeChoices;

  const askTopics = conversationActive && conversationPerson
    ? askTopicsFor(conversationPerson, clues, clueConnections)
    : [];
  const choicesForScene = conversationActive && !replyPending && !conversationEnding && askTopics.length > 0
    ? [...choicesWhileGravel, { label: ASK_ABOUT_LABEL, response: [] as StoryEntry[], repeatable: true }]
    : choicesWhileGravel;

  function acknowledgeClues() {
    setCluesSeen(cluesRef.current);
  }

  function connectOnBoard(a: ClueId, b: ClueId) {
    const result = tryConnect(
      a,
      b,
      cluesRef.current,
      connectionsRef.current,
      Math.floor(Math.random() * 3),
    );
    if (result.status === "linked") {
      if (result.added) {
        connectionsRef.current = result.connections;
        setClueConnections(result.connections);
        harlowAudio().playSfx("pen-scribble");
        if (result.connections.includes("walt-parker")) {
          applyFlags("waltParkerLinked");
          commitQuests(questsRef.current);
        }
      }
      setCurrentThought(result.thought);
      return { ok: true as const, line: result.thought };
    }
    setCurrentThought(result.line);
    return { ok: false as const, line: result.line };
  }

  function beginAsk(clueId: ClueId) {
    if (!conversationPerson) return;
    const trustNow = trustRef.current;
    const result = resolveAskAbout({
      person: conversationPerson,
      clue: clueId,
      trust: trustNow,
      asked: askedRef.current,
    });
    askedRef.current = result.asked;
    setAskedAbout(result.asked);
    if (askCompletesGate(conversationPerson, clueId)) {
      const gate = finishGate(questsRef.current);
      if (gate.completed) {
        applyQuestHooks({ completesQuest: "the-gate", questStep: "done" });
      }
    }
    setAskAboutOpen(false);
    const spoken = result.lines.find(
      (entry) => entry.type === "conversation" && entry.character === "Ethan",
    );
    handleConversationChoice({
      label: spoken?.type === "conversation" ? spoken.text : ASK_ABOUT_LABEL,
      response: result.lines,
      repeatable: true,
    });
  }

  function dismissAskAbout() {
    setConversation((previous) => {
      const next = [...previous, { type: "conversation" as const, character: "Ethan", text: "Never mind." }];
      conversationRef.current = next;
      return next;
    });
    setAskAboutOpen(false);
  }

  function acknowledgePeople() {
    setPeopleSeenTrust((previous) => {
      const next = { ...previous };
      for (const person of notebookPeople(metRef.current)) next[person] = trustRef.current[person];
      return next;
    });
  }

  const unseenPeople = unseenNotebookPeople(notebookPeople(metPeople), trust, peopleSeenTrust);
  const availableTravelDestinations = travelDestinationIds({
    momTalked,
    job,
    jobQuestTarget,
    quests,
    hasFlag,
    dayNumber: gameState.dayNumber,
  });

  const noteHoodedMan = useCallback(() => {
    grantClue("man-in-a-hood");
  }, []);

  return {
    gameState,
    playerState,
    currentScene,
    currentThought: (GRAVEL_LINES as readonly string[]).includes(currentThought ?? "")
      || currentThought === EMILY_DOOR_THOUGHT
      ? currentThought
      : presentedThought({
        lateNight: isLateNight(),
        momTalked,
        sceneId: currentScene.id,
        dayNumber: gameState.dayNumber,
        openingDay: initialGameState.dayNumber,
        thought: currentThought,
      }),
    currentEffects,
    lateNightActionThought,
    newDayAnnouncement,
    dismissNewDayAnnouncement: () => setNewDayAnnouncement(null),
    conversation,
    conversationActive,
    finishConversation: conversationEnding ? closeConversation : undefined,
    finishPhoneAnswer,
    holdPhoneLine,
    advancePhoneLine,
    holdMusicBox,
    advanceMusicBox,
    onReplySettled: revealPendingCloseup,
    showDinerBoardHint,
    activeCharacter,
    activeChoices: choicesForScene,
    travelingTo,
    travelDestinations: availableTravelDestinations,
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
    markCemeteryLunch,
    chapter,
    trust,
    metPeople,
    unseenPeople,
    acknowledgePeople,
    clues,
    clueConnections,
    unseenClues: unseenClueIds(clues, cluesSeen),
    acknowledgeClues,
    connectOnBoard,
    askAboutOpen,
    askTopics,
    askedAbout,
    conversationPerson,
    beginAsk,
    dismissAskAbout,
    noteHoodedMan,
    phonePhase,
    figureActive,
    stalkerMode,
    escapeOpen,
    escapeMode,
    chooseEscape,
    finishEscape,
    finishMusicBoxCall,
    catchEntrance,
    closeup,
    dismissCloseup,
    showChapterEnd,
    dismissChapterEnd: dismissChapterEndScreen,
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
    waitingLocked: isWaitingLocked(gameState.time),
    // Sleep still jumps to 07:00. Waiting uses the same 03:30 lock as the buttons.
    wait: (minutes: number) => {
      if (isWaitingLocked(gameState.time)) {
        showLateNightActionThought(WAITING_TIRED_HINT);
        return;
      }
      const next = advanceTime(waitingMinutesAllowed(gameState.time, minutes));
      if (phoneIntercept.current) {
        beginPhone({ ...next, location: scenes.hallway.location });
      }
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
