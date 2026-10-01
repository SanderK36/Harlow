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
  scenes,
} from "@/game/scenes";
import { advanceGameTime } from "@/game/time";
import { isNightTime } from "@/game/utils";
import {
  readMostRecentSave,
  readSaveSlot,
  readSessionSave,
  writeSaveSlot,
  writeSessionSave,
} from "@/game/save";
import type { Choice, GameChoice } from "@/game/choices";
import type { Conversation, StoryEntry } from "@/game/story";
import type { JobId } from "@/game/quests";
import type { GameState } from "@/game/types";

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
]);

const NPC_REPLY_DELAY = 450;
const TRAVEL_DURATION = 3000;
const BEDTIME_START = 1320;
const BEDTIME_END = 180;
const EXHAUSTION_LOCK_TIME = 210;
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
  "sister-room",
  "bathroom",
  "front-yard",
]);

type ShopId = "gas-station" | "needle-groove";

export function useGame() {
  const sessionSave = readSessionSave();
  const sessionScene = sessionSave && scenes[sessionSave.currentSceneId as keyof typeof scenes];

  // Persistent world and player data. Add a field to its type and initial value
  // before using it in a scene requirement or effect.
  const [gameState, setGameState] = useState(sessionSave?.gameState ?? initialGameState);
  const [playerState, setPlayerState] = useState(sessionSave?.playerState ?? player);

  // The currently displayed scene and its short, time-aware thought.
  const [currentScene, setCurrentScene] = useState(sessionScene ?? ethanRoom);
  const [currentThought, setCurrentThought] = useState<string | null>(
    getSceneThought(sessionScene?.id ?? ethanRoom.id, sessionSave?.gameState.time ?? initialGameState.time)
  );
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
  const replyTimer = useRef<number | null>(null);
  const questNotificationTimer = useRef<number | null>(null);
  const locationDiscoveryTimer = useRef<number | null>(null);
  const pendingQuestNotification = useRef<{ message: string; label: string } | null>(null);

  useEffect(() => () => {
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
  const [momTalked, setMomTalked] = useState(sessionSave?.momTalked ?? true);
  const [momJobConcernHeard, setMomJobConcernHeard] = useState(sessionSave?.momJobConcernHeard ?? false);
  // Completing Find a Job sets one permanent workplace benefit.
  const [job, setJob] = useState<JobId | null>(sessionSave?.job ?? null);
  const [jobQuestTarget, setJobQuestTarget] = useState<JobId | null>(sessionSave?.jobQuestTarget ?? null);
  const [questNotification, setQuestNotification] = useState<string | null>(null);
  const [questNotificationLabel, setQuestNotificationLabel] = useState("Quest started");
  const [questNotificationExiting, setQuestNotificationExiting] = useState(false);

  function clearQuestNotification() {
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    if (locationDiscoveryTimer.current !== null) window.clearTimeout(locationDiscoveryTimer.current);
    questNotificationTimer.current = null;
    locationDiscoveryTimer.current = null;
    pendingQuestNotification.current = null;
    setQuestNotification(null);
    setQuestNotificationLabel("Quest started");
    setQuestNotificationExiting(false);
  }

  function showQuestNotification(message: string, label = "Quest started") {
    if (questNotificationTimer.current !== null) window.clearTimeout(questNotificationTimer.current);
    setQuestNotification(message);
    setQuestNotificationLabel(label);
    setQuestNotificationExiting(false);
    questNotificationTimer.current = window.setTimeout(() => {
      setQuestNotificationExiting(true);
      questNotificationTimer.current = window.setTimeout(() => {
        setQuestNotification(null);
        setQuestNotificationLabel("Quest started");
        setQuestNotificationExiting(false);
        questNotificationTimer.current = null;
      }, 240);
    }, 6500);
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
    };
  }, [gameState, playerState, currentScene, busStopReturnSceneId, marleneActive, deskCigarettesPickedUp, scrapyardKnifePickedUp, garageFlashlightPickedUp, momTalked, momJobConcernHeard, job, jobQuestTarget]);

  // This is a temporary, per-tab resume point. It survives refreshes but is
  // automatically cleared when the browser tab is closed.
  useEffect(() => {
    if (readSessionSave()) writeSessionSave(currentSave());
  }, [currentSave]);

  function advanceTime(minutes: number, completingMomQuest = false, bypassExhaustionLock = false) {
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
    setCurrentThought(getSceneThought(currentScene.id, nextGameState.time));

    return nextGameState;
  }

  function moveToScene(sceneId: string, time: number) {
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
    setCurrentThought(getSceneThought(nextScene.id, time));
    setGameState((previous) => ({
      ...previous,
      time,
      location: nextScene.location,
    }));
  }

  function openConversation() {
    cancelPendingReply();
    // The action determines *which* NPC to talk to; the scene owns the dialogue.
    const selectedConversation = currentScene.id === "kitchen" && !momTalked
      ? momDeathConversation
      : currentScene.conversation;
    const opening = selectedConversation?.opening;

    if (!opening) {
      return;
    }

    setActiveConversation(selectedConversation ?? null);
    setUsedConversationChoices([]);
    setConversation(opening);
    setConversationActive(true);
  }

  function closeConversation() {
    setConversationActive(false);
    window.setTimeout(() => {
      setConversation([]);
      setActiveConversation(null);
      setUsedConversationChoices([]);
      const pendingNotification = pendingQuestNotification.current;
      pendingQuestNotification.current = null;
      if (pendingNotification) {
        showQuestNotification(pendingNotification.message, pendingNotification.label);
      }
    }, 300);
  }

  function notifyMomQuest() {
    showQuestNotification("Talk to Mom. Maybe she knows what happened last night.", "New quest");
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

  function finishConversationChoice(choice: Extract<GameChoice, { response: StoryEntry[] }>) {
    setConversation((previous) => [...previous, ...choice.response]);

    if (choice.completesMomQuest && !momTalked) {
      setMomTalked(true);
      showQuestNotification("Talk to Mom", "Quest complete");
    }

    if (choice.storyFlag === "momJobConcern") {
      setMomJobConcernHeard(true);
      setCurrentThought("I gotta get a job. Maybe those flyers on the light pole out front.");
      pendingQuestNotification.current = {
        message: "New quest: Find a Job — there's got to be a way to help.",
        label: "Quest started",
      };
    }

    if (choice.jobOffer && !job) {
      setJob(choice.jobOffer);
      setJobQuestTarget(null);

      if (choice.jobOffer === "scrapyard") {
        setPlayerState((previous) => ({
          ...previous,
          inventory: previous.inventory.includes("Sturdy Crowbar")
            ? previous.inventory
            : [...previous.inventory, "Sturdy Crowbar"],
        }));
      }
    }

    if (choice.endsConversation) {
      closeConversation();
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
      const nextGameState = advanceTime(choice.timeCost);
      moveToScene(choice.nextScene, nextGameState.time);
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

  function handleChoice(choice: GameChoice) {
    // This is the central choice router. Prefer declarative scene fields
    // (`nextScene`, `itemToAdd`, `effects`) over adding action-specific cases.
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

    const flyerJobs: Partial<Record<string, JobId>> = {
      chooseNeedleGrooveJob: "needle-groove",
      chooseGasStationJob: "gas-station",
      chooseScrapyardJob: "scrapyard",
    };
    const selectedJob = flyerJobs[choice.action];

    if (selectedJob && !job && !jobQuestTarget) {
      setJobQuestTarget(selectedJob);
      showQuestNotification("New quest: Find a Job — follow up on that lead.");
      if (selectedJob === "needle-groove") {
        locationDiscoveryTimer.current = window.setTimeout(() => {
          showQuestNotification("Needle & Groove discovered.", "Location discovered");
          locationDiscoveryTimer.current = null;
        }, 6800);
      }
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
      const nextGameState = advanceTime(minutesUntilSevenAm, false, true);
      moveToScene("ethan-room", nextGameState.time);
      setNewDayAnnouncement(nextGameState);
      return;
    }

    if (choice.action === "leaveBusStop") {
      const nextGameState = advanceTime(choice.timeCost);
      moveToScene(busStopReturnSceneId, nextGameState.time);
      return;
    }

    if (choice.travel) {
      handleTravel(choice);
      return;
    }

    const nextGameState = advanceTime(choice.timeCost, choice.action === "talkToMom");

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

    moveToScene(nextSceneId, nextGameState.time);

    if (selectedJob === "needle-groove") {
      setCurrentThought("Needle & Groove. That one feels right.");
    }

    if (choice.itemToAdd) {
      setPlayerState((previous) => ({
        ...previous,
        inventory: [...previous.inventory, choice.itemToAdd!],
      }));
    }

    applyChoiceEffects(choice);
  }

  function goToBusStop() {
    if (isLateNight()) {
      showLateNightActionThought();
      return;
    }
    setBusStopReturnSceneId(currentScene.id);
    const nextGameState = advanceTime(0);
    moveToScene("bus-stop", nextGameState.time);
  }

  function adminTravel(sceneId: string) {
    if (!scenes[sceneId as keyof typeof scenes]) {
      return;
    }

    cancelPendingReply();
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
      return currentScene.id === "kitchen"
        ? time >= 450 && time < 540
        : currentScene.id === "living-room" && time >= 540 && time < 1080;
    }
    if (action === "talkToJohnny") return time >= 480 && time < 840;
    if (action === "workNeedleGrooveShift") {
      return job === "needle-groove" && time >= 600 && time < 1140;
    }
    if (action === "talkToWalter") return time >= 480 && time < 1080;
    if (action === "talkToMargaret") return time >= 660 && time < 900;
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
      return momJobConcernHeard && !job && !jobQuestTarget;
    }

    return true;
  }

  function saveGame(slotNumber: number) {
    return writeSaveSlot(slotNumber, currentSave());
  }

  function restoreSave(save: ReturnType<typeof readSaveSlot>) {
    const savedScene = save && scenes[save.currentSceneId as keyof typeof scenes];

    // Ignore saves from an older/incomplete build instead of leaving the game
    // on a scene that no longer exists.
    if (!save || !savedScene) return false;

    writeSessionSave(save);

    setGameState(save.gameState);
    setPlayerState(save.playerState);
    setCurrentScene(savedScene);
    setCurrentThought(getSceneThought(savedScene.id, save.gameState.time));
    setCurrentEffects([]);
    setBusStopReturnSceneId(save.busStopReturnSceneId);
    setMarleneActive(save.marleneActive);
    setDeskCigarettesPickedUp(save.deskCigarettesPickedUp);
    setScrapyardKnifePickedUp(save.scrapyardKnifePickedUp);
    setGarageFlashlightPickedUp(save.garageFlashlightPickedUp);
    setMomTalked(save.momTalked ?? true);
    setMomJobConcernHeard(save.momJobConcernHeard ?? false);
    setJob(save.job ?? null);
    setJobQuestTarget(save.jobQuestTarget ?? null);
    clearQuestNotification();

    // Modal and transition state is not saved, so always resume at the scene.
    setShowStats(false);
    setShowInventory(false);
    setShowTravel(false);
    setActiveShop(null);
    cancelPendingReply();
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
    setCurrentThought(getSceneThought(ethanRoom.id, freshGameState.time));
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
    clearQuestNotification();
    setShowStats(false);
    setShowInventory(false);
    setShowTravel(false);
    setActiveShop(null);
    cancelPendingReply();
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
    });
  }

  // A scene can list multiple NPCs; only the first one available at this time
  // is rendered over the scene image.
  const activeCharacter = currentScene.characters?.find((character) => {
    if (character.name === "Marlene" && !marleneActive) {
      return false;
    }

    return (
      (character.from === undefined || gameState.time >= character.from) &&
      (character.until === undefined || gameState.time < character.until)
    );
  });

  const activeChoices = replyPending ? [] : conversationActive
    ? (activeConversation?.choices ?? []).filter(
        (choice) =>
          (!choice.requiresNoJob || !job) &&
          (!choice.requiresJob || choice.requiresJob === job) &&
          (!choice.requiresJobQuestTarget || choice.requiresJobQuestTarget === jobQuestTarget) &&
          (!choice.requiresStoryFlag || (choice.requiresStoryFlag === "momJobConcern" && momJobConcernHeard)) &&
          (choice.endsConversation || !usedConversationChoices.includes(choice.label))
      )
    : currentScene.choices.filter(isChoiceAvailable);
  const availableTravelDestinations = [
    "front-yard",
    "hospital",
    ...(jobQuestTarget === "needle-groove" || job === "needle-groove"
      ? ["needle-and-groove"]
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
    momTalked,
    momJobConcernHeard,
    questNotification,
    questNotificationLabel,
    questNotificationExiting,
    saveGame,
    loadGame,
    loadMostRecentGame,
    startNewGameSession,
    notifyMomQuest,
    handleChoice,
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
