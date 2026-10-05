"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import SceneHotspot from "@/components/SceneHotspot";

import GameStatus from "@/components/GameStatus/GameStatus";
import ActionList from "@/components/ActionList/ActionList";
import ActionButton from "@/components/ActionButton/ActionButton";
import StatsWindow from "@/components/StatsWindow/StatsWindow";
import StoryLog from "@/components/StoryLog/StoryLog";
import CharacterLine from "@/components/CharacterLine/CharacterLine";
import DialogueScene from "@/components/DialogueScene/DialogueScene";
import ThoughtPanel from "@/components/ThoughtPanel/ThoughtPanel";
import OpeningSequence from "@/components/OpeningSequence/OpeningSequence";
import TravelOverlay from "@/components/TravelOverlay/TravelOverlay";
import TravelWindow from "@/components/TravelWindow/TravelWindow";
import InventoryWindow from "@/components/InventoryWindow/InventoryWindow";
import ShopWindow from "@/components/ShopWindow/ShopWindow";
import GameMenu from "@/components/GameMenu/GameMenu";
import CharacterWindow from "@/components/CharacterWindow/CharacterWindow";
import QuestWindow from "@/components/QuestWindow/QuestWindow";

import { isNightTime } from "@/game/utils";
import { useGame } from "@/game/useGame";
import { storyEntryApplies } from "@/game/story";
import { isExteriorScene, RAIN_WEATHER, scenes } from "@/game/scenes";
import { clearSessionSave, readSessionSave } from "@/game/save";
import { harlowAudio } from "@/game/audio";
import Atmosphere from "@/components/Atmosphere/Atmosphere";
import StormLightning from "@/components/StormLightning/StormLightning";
import CloseupOverlay from "@/components/CloseupOverlay/CloseupOverlay";
import type { Choice } from "@/game/choices";

function subscribeToSession() {
  return () => {};
}

function hasActiveSession() {
  return readSessionSave() !== null;
}

const hotspotLabels: Record<string, string> = {
  goToSleep: "Go to sleep",
  playVinyl: "Vinyl player",
  lookAtDesk: "Desk",
  goEthanRoom: "Your room",
  goMomRoom: "Mom's room",
  goEmilyRoom: "Emily's room",
  pickUpCigarettes: "Cigarettes",
  goLivingRoom: "Living room",
  talkToMom: "Talk to Mom",
  watchTv: "Watch TV",
  relaxOnCouch: "Relax on the couch",
  goKitchen: "Kitchen",
  checkFridge: "Check the fridge",
  makeCoffee: "Make some coffee",
  lookAtGarageBench: "Workbench",
  pickUpGarageFlashlight: "Flashlight",
  goHallway: "Hallway",
  goBathroom: "Bathroom",
  openAtticHatch: "Attic hatch",
  goAttic: "Attic stairs",
  enterGasStation: "Enter gas station",
  talkToRay: "Ray",
  enterNeedleAndGroove: "Enter shop",
  talkToJohnny: "Johnny",
  enterNeedleAndGrooveBackroom: "Back room",
  enterPoliceStation: "Enter station",
  leavePoliceStation: "Go outside",
  enterHospital: "Enter hospital",
  goToMarleneCounter: "Reception desk",
  talkToMarlene: "Marlene",
  goToHospitalRoom: "Elevator",
  enterScrapyard: "Enter workshop",
  lookAtScrapyardDesk: "Workbench",
  takeScrapyardKnife: "Knife",
  leaveScrapyard: "Back to the yard",
  talkToBigRoy: "Big Roy",
  enterCemetery: "Enter church",
  goCemeteryBackside: "Back of church",
  leaveCemeteryBackside: "Go back inside",
  enterMotel: "Enter office",
  leaveMotel: "Go outside",
  goBackYard: "Backyard",
  lookAtLightPole: "Light pole",
  goHome: "Go inside",
  enterGarage: "Enter garage",
  talkToEarl: "Earl",
  chooseNeedleGrooveJob: "Needle & Groove flyer",
  chooseGasStationJob: "Gas station flyer",
  chooseScrapyardJob: "Scrapyard flyer",
  approachSanatorium: "Approach entrance",
  enterSanatorium: "Enter sanatorium",
  enterSanatoriumHallway: "Hallway",
  leaveSanatorium: "Go outside",
  enterSanatoriumRoom1: "First room",
  enterSanatoriumRoom2: "Second room",
  leaveSanatoriumHallway: "Go outside",
  leaveSanatoriumRoom1: "Return to hallway",
  leaveSanatoriumRoom2: "Return to hallway",
  goElrodHouse: "Elrod house",
  talkToRachel: "Rachel",
  lookAtElrodTape: "Police tape",
  lookAtDinerBulletin: "Bulletin board",
  lookAtSanatoriumHill: "The hill",
  lookAtSanatoriumCigarette: "Sill",
};

const sanatoriumHotspotActions: Record<string, string[]> = {
  sanatorium: ["approachSanatorium"],
  "sanatorium-entrance": ["enterSanatorium"],
  "sanatorium-main-floor": ["enterSanatoriumHallway", "leaveSanatorium"],
  "sanatorium-hallway": [
    "enterSanatoriumRoom1",
    "enterSanatoriumRoom2",
    "leaveSanatoriumHallway",
  ],
  "sanatorium-room-1": ["leaveSanatoriumRoom1"],
  "sanatorium-room-2": ["leaveSanatoriumRoom2"],
};

const ADMIN_SCENE_NAMES: Record<string, string> = {
  "elrod-house": "Elrod house",
  "ethan-room": "Ethan's room",
  "front-yard": "Front yard",
  "sheriff-office": "Sheriff's office",
  "needle-and-groove": "Needle & Groove",
  "gas-station": "Gas station",
  "police-station": "Police station",
  "sanatorium-room-2": "Sanatorium room 2",
  cementary: "Entrance",
  "cementary-inside": "Inside",
  "cementary-backside": "Behind the church",
};

function adminSceneName(id: string) {
  return (
    ADMIN_SCENE_NAMES[id]
    ?? id.replaceAll("cementary", "cemetery").replaceAll("-", " ")
  );
}

const adminDestinations = Object.values(scenes)
  .map((scene) => ({
    id: scene.id,
    label: `${scene.location} — ${adminSceneName(scene.id)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Open-air scenes beyond the travel destinations, for rain and lightning.
const OUTDOOR_SCENE_IDS = new Set([
  "back-yard",
  "light-pole",
  "cementary-backside",
  "sanatorium-entrance",
  "elrod-house",
]);

/** Which cursor a hotspot gets: look, go, talk or take (see globals.css). */
function hotspotKind(action: string) {
  if (action.startsWith("talkTo")) return "talk";
  if (action.startsWith("pickUp") || action.startsWith("take")) return "take";
  if (action === "goToSleep") return "inspect";
  if (/^(go|enter|leave|approach)/.test(action)) return "go";
  return "inspect";
}

// Ethan's first thoughts on a new game, one beat at a time in the thought
// panel; the "Talk to Mom" quest starts after the last one.
const OPENING_THOUGHTS = [
  "I hardly slept last night.",
  "Mrs. Elrod. Somebody actually killed her.",
  "And that guy in the hood at the end of the street, by the woods... he was looking right at me.",
  "Walter looked scared. Walter doesn't get scared.",
  "I should check on Mom.",
];
const OPENING_THOUGHT_BASE_MS = 1500;
const OPENING_THOUGHT_PER_CHARACTER_MS = 45;
// The first line starts while the title card is still lifting.
const OPENING_THOUGHT_FIRST_EXTRA_MS = 900;

/** Playtest tools stay available after ?debug=1, including a production build. */
const PLAYTEST_DEBUG_KEY = "harlow-debug";

function persistPlaytestDebugQuery() {
  if (typeof window === "undefined") return;
  const flag = new URLSearchParams(window.location.search).get("debug");
  try {
    if (flag === "1") window.localStorage.setItem(PLAYTEST_DEBUG_KEY, "1");
    else if (flag === "0") window.localStorage.removeItem(PLAYTEST_DEBUG_KEY);
  } catch {
    // Storage can be blocked. The query string is checked again below.
  }
}

persistPlaytestDebugQuery();

function subscribePlaytestDebug() {
  return () => {};
}

function playtestDebugOnClient() {
  const flag = new URLSearchParams(window.location.search).get("debug");
  if (flag === "0") return false;
  try {
    return flag === "1" || window.localStorage.getItem(PLAYTEST_DEBUG_KEY) === "1";
  } catch {
    return flag === "1";
  }
}

export default function Home() {
  // Restore the session until the player explicitly chooses a screen.
  // Returning to the menu must override the session detected on refresh.
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const resumedSession = useSyncExternalStore(
    subscribeToSession,
    hasActiveSession,
    () => false,
  );
  const [showCharacterDirectory, setShowCharacterDirectory] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showAdminTravel, setShowAdminTravel] = useState(false);
  // Production builds hide Pass time and Admin travel unless ?debug=1 was set.
  const playtestDebug = useSyncExternalStore(
    subscribePlaytestDebug,
    playtestDebugOnClient,
    () => false,
  );
  const showPlaytestControls = process.env.NODE_ENV !== "production" || playtestDebug;
  const [showProductionSplash, setShowProductionSplash] = useState(false);
  // Index into OPENING_THOUGHTS while Ethan's first thoughts play, else null.
  const [openingThoughtIndex, setOpeningThoughtIndex] = useState<number | null>(null);
  const showOpeningThought = openingThoughtIndex !== null;
  const [showVinylThought, setShowVinylThought] = useState(false);
  const [showLateNightThought, setShowLateNightThought] = useState(false);
  const [tvNewsLine, setTvNewsLine] = useState<string | null>(null);
  const openingThoughtTimer = useRef<number | null>(null);
  const vinylThoughtTimer = useRef<number | null>(null);
  const lateNightThoughtTimer = useRef<number | null>(null);
  const {
    gameState,
    playerState,
    currentScene,
    currentThought,
    lateNightActionThought,
    newDayAnnouncement,
    dismissNewDayAnnouncement,
    currentEffects,
    conversation,
    conversationActive,
    finishConversation,
    activeChoices,
    activeCharacter,
    showStats,
    setShowStats,
    showInventory,
    setShowInventory,
    handleChoice,
    doorTransition,
    adminWait,
    adminTravel,
    travelingTo,
    showTravel,
    setShowTravel,
    walkingChoices,
    busChoices,
    goToBusStop,
    activeShop,
    setActiveShop,
    job,
    quests,
    closeup,
    dismissCloseup,
    showChapterEnd,
    dismissChapterEnd,
    storyFlags,
    momTalked,
    questNotification,
    questNotificationLabel,
    questNotificationExiting,
    buyItem,
    useInventoryItem,
    saveGame,
    loadGame,
    loadMostRecentGame,
    startNewGameSession,
    notifyMomQuest,
  } = useGame();
  const [travelMode, setTravelMode] = useState<"walk" | "bus">("walk");
  const [sceneImageEntering, setSceneImageEntering] = useState(false);
  const sceneImageAnimationFrame = useRef<number | null>(null);

  function continueGame() {
    if (loadMostRecentGame()) setHasStarted(true);
  }

  function startNewGame() {
    if (openingThoughtTimer.current !== null) {
      window.clearTimeout(openingThoughtTimer.current);
      openingThoughtTimer.current = null;
    }
    startNewGameSession();
    setHasStarted(true);
    setShowQuestLog(false);
    setOpeningThoughtIndex(null);
    setShowVinylThought(false);
    setShowLateNightThought(false);
    setShowProductionSplash(true);
  }

  // The title card has started lifting: Ethan's first thoughts begin under it,
  // so the room appears with the first line already on screen.
  function startOpeningThoughts() {
    setOpeningThoughtIndex((index) => index ?? 0);
  }

  function finishProductionSplash() {
    setShowProductionSplash(false);
    startOpeningThoughts();
  }

  // Step to the next opening thought; after the last one, the Mom quest starts.
  function advanceOpeningThought() {
    if (openingThoughtIndex === null) return;
    if (openingThoughtIndex < OPENING_THOUGHTS.length - 1) {
      setOpeningThoughtIndex(openingThoughtIndex + 1);
    } else {
      setOpeningThoughtIndex(null);
      notifyMomQuest();
    }
  }

  const advanceOpeningThoughtLater = useEffectEvent(advanceOpeningThought);

  // Each thought stays long enough to type out and be read; clicking a
  // finished thought moves on sooner.
  useEffect(() => {
    if (openingThoughtIndex === null) return;
    const line = OPENING_THOUGHTS[openingThoughtIndex];
    const delay =
      OPENING_THOUGHT_BASE_MS +
      line.length * OPENING_THOUGHT_PER_CHARACTER_MS +
      (openingThoughtIndex === 0 ? OPENING_THOUGHT_FIRST_EXTRA_MS : 0);
    const timer = window.setTimeout(advanceOpeningThoughtLater, delay);
    return () => window.clearTimeout(timer);
  }, [openingThoughtIndex]);

  function showTvNews() {
    if (openingThoughtTimer.current !== null) {
      window.clearTimeout(openingThoughtTimer.current);
    }
    setTvNewsLine(
      "An elderly woman was found murdered in her home here in Harlow last night, October first. Police say the investigation is ongoing. No suspect has been identified.",
    );
    openingThoughtTimer.current = window.setTimeout(() => {
      setTvNewsLine(null);
      openingThoughtTimer.current = null;
    }, 8000);
  }

  function showVinylPlayerThought() {
    if (vinylThoughtTimer.current !== null) {
      window.clearTimeout(vinylThoughtTimer.current);
    }
    if (lateNightThoughtTimer.current !== null) {
      window.clearTimeout(lateNightThoughtTimer.current);
    }
    setShowVinylThought(true);
    vinylThoughtTimer.current = window.setTimeout(() => {
      setShowVinylThought(false);
      vinylThoughtTimer.current = null;
    }, 5200);
  }

  useEffect(
    () => () => {
      if (openingThoughtTimer.current !== null) {
        window.clearTimeout(openingThoughtTimer.current);
      }
      if (vinylThoughtTimer.current !== null) {
        window.clearTimeout(vinylThoughtTimer.current);
      }
      if (sceneImageAnimationFrame.current !== null) {
        window.cancelAnimationFrame(sceneImageAnimationFrame.current);
      }
    },
    [],
  );

  useEffect(() => {
    document.body.classList.toggle(
      "production-splash-active",
      showProductionSplash,
    );
    return () => document.body.classList.remove("production-splash-active");
  }, [showProductionSplash]);

  // Sound: browsers only start audio after a gesture, so the first click or
  // key press anywhere in the game wakes the engine.
  useEffect(() => {
    const unlock = () => harlowAudio().unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Keys wait while a door transition plays (clicks hit its overlay).
  useEffect(() => {
    if (doorTransition === "idle") return;
    const swallow = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", swallow, true);
    return () => window.removeEventListener("keydown", swallow, true);
  }, [doorTransition]);

  const inGame = Boolean(hasStarted ?? resumedSession);
  const sceneIsIndoor = !(
    isExteriorScene(currentScene.id) || OUTDOOR_SCENE_IDS.has(currentScene.id)
  );
  const sceneIsNight = isNightTime(gameState.time);

  // Rain follows the weather and whether Ethan is inside.
  // The intro film carries its own soundtrack, so the beds wait for it.
  useEffect(() => {
    harlowAudio().setAmbience(
      inGame && !showProductionSplash
        ? { indoor: sceneIsIndoor, weather: gameState.weather }
        : null,
    );
  }, [inGame, showProductionSplash, sceneIsIndoor, gameState.weather]);

  useEffect(() => () => harlowAudio().setAmbience(null), []);

  useEffect(() => {
    if (!newDayAnnouncement) {
      return;
    }

    const dismissTimer = window.setTimeout(dismissNewDayAnnouncement, 3400);
    return () => window.clearTimeout(dismissTimer);
  }, [newDayAnnouncement, dismissNewDayAnnouncement]);

  const isLateNight = gameState.time >= 180 && gameState.time < 420;

  useEffect(() => {
    if (!isLateNight) {
      return;
    }

    const showThoughtTimer = window.setTimeout(() => {
      setShowLateNightThought(true);
      lateNightThoughtTimer.current = window.setTimeout(() => {
        setShowLateNightThought(false);
        lateNightThoughtTimer.current = null;
      }, 4000);
    }, 0);

    return () => {
      window.clearTimeout(showThoughtTimer);
      if (lateNightThoughtTimer.current !== null) {
        window.clearTimeout(lateNightThoughtTimer.current);
        lateNightThoughtTimer.current = null;
      }
    };
  }, [isLateNight]);

  function returnToMainMenu() {
    clearSessionSave();
    setHasStarted(false);
  }

  function replaySceneImageEnter() {
    if (sceneImageAnimationFrame.current !== null) {
      window.cancelAnimationFrame(sceneImageAnimationFrame.current);
    }
    setSceneImageEntering(false);
    sceneImageAnimationFrame.current = window.requestAnimationFrame(() => {
      setSceneImageEntering(true);
      sceneImageAnimationFrame.current = null;
    });
  }

  const hasConversationOverlay = conversation.length > 0;

  // Character art has priority, then weather-specific art, then day/night art.
  const isWeekend =
    gameState.dayOfWeek === "Saturday" || gameState.dayOfWeek === "Sunday";
  const momInKitchen =
    currentScene.id === "kitchen" &&
    ((gameState.time >= 450 && gameState.time < 540)
      || (isWeekend && gameState.time >= 720 && gameState.time < 1140));
  // The scene as it looks without anyone painted into it.
  // Daylit weather art (weatherDayOnly) gives way to the night art after dark.
  const weatherImage =
    isNightTime(gameState.time) && currentScene.image.weatherDayOnly
      ? undefined
      : currentScene.image.weather?.[gameState.weather];
  // Elrod: Rachel is painted into the day art until she's met. During her talk
  // the empty house (day/night) is the backdrop so she isn't on screen twice.
  const elrodWithRachel =
    currentScene.id === "elrod-house"
    && !storyFlags.rachelMet
    && gameState.time >= 420
    && gameState.time < 1140;
  const sanatoriumCigaretteRoom =
    currentScene.id === "sanatorium-room-2"
    && isNightTime(gameState.time)
    && !storyFlags.sanatoriumCigaretteSeen;
  const royRainy =
    currentScene.id === "scrapyard-inside"
    && activeCharacter?.name === "Big Roy"
    && RAIN_WEATHER.includes(gameState.weather)
    && !isNightTime(gameState.time);
  const rayRainy =
    currentScene.id === "gas-station-inside"
    && activeCharacter?.name === "Ray Mercer"
    && RAIN_WEATHER.includes(gameState.weather)
    && !isNightTime(gameState.time);
  const walterRainy =
    currentScene.id === "sheriff-office"
    && activeCharacter?.name === "Walter Harrington"
    && RAIN_WEATHER.includes(gameState.weather)
    && !isNightTime(gameState.time);
  const emptySceneImage =
    sanatoriumCigaretteRoom
      ? "./images/locations/sanatorium/sanatoriumRoom2NightCigarette.png"
      : weatherImage ??
    (isNightTime(gameState.time)
      ? currentScene.image.night
      : currentScene.image.day);
  const sceneImage = momInKitchen
    ? RAIN_WEATHER.includes(gameState.weather)
      ? "./images/locations/home/momMorningKitchen-rain.jpg"
      : "./images/locations/home/momMorningKitchen.png"
    : royRainy
      ? "./images/locations/scrapyard/bigRoyWorkingRainy.png"
    : rayRainy
      ? "./images/locations/gas_station/rayMercerGasStationRainy.png"
    : walterRainy
      ? "./images/locations/police_station/WalterHarringtonOfficeRain.jpg"
    : elrodWithRachel
      ? "./images/locations/ElrodHouse/ElrodHouseRachelOutsideDay.png"
    : ((isNightTime(gameState.time) && activeCharacter?.nightImage
        ? activeCharacter.nightImage
        : activeCharacter?.image) ?? emptySceneImage);
  // In a conversation the speaker stands in front as a portrait, so the scene
  // behind swaps to its empty variant rather than showing them twice. It is
  // layered over the character art (which keeps sizing the frame) and simply
  // isn't shown when a scene has no separate empty art.
  const conversationBackdrop =
    hasConversationOverlay && emptySceneImage && emptySceneImage !== sceneImage
      ? emptySceneImage
      : null;
  const hotspotActions =
    sanatoriumHotspotActions[currentScene.id] ??
    (currentScene.id === "living-room"
      ? activeCharacter?.name === "Linda"
        ? ["talkToMom", ...(momTalked ? [] : ["watchTv"])]
        : ["relaxOnCouch", ...(momTalked ? [] : ["watchTv"])]
      : currentScene.id === "ethan-room"
        ? ["goToSleep", "playVinyl", "lookAtDesk"]
        : currentScene.id === "ethan-room-desk"
          ? ["pickUpCigarettes"]
          : currentScene.id === "hallway"
            ? ["goLivingRoom", "goKitchen", "goBathroom"]
            : currentScene.id === "hallway-upstairs"
              ? ["openAtticHatch"]
              : currentScene.id === "kitchen"
                ? [
                    ...(activeCharacter?.name === "Linda" ? ["talkToMom"] : []),
                    ...(momInKitchen ? [] : momTalked ? ["checkFridge"] : []),
                    ...(momInKitchen ? [] : ["makeCoffee"]),
                    ...(momInKitchen ? [] : ["goBackYard"]),
                  ]
                : currentScene.id === "back-yard"
                  ? ["goKitchen"]
                  : currentScene.id === "basement"
                    ? ["goHallway"]
                    : currentScene.id === "garage"
                      ? ["lookAtGarageBench", "goHallway"]
                      : currentScene.id === "garage-bench"
                        ? ["pickUpGarageFlashlight"]
                        : currentScene.id === "gas-station"
                          ? ["enterGasStation"]
                          : currentScene.id === "gas-station-inside"
                            ? ["talkToRay"]
                            : currentScene.id === "needle-and-groove"
                              ? ["enterNeedleAndGroove"]
                              : currentScene.id === "needle-and-groove-inside"
                                ? [
                                    "talkToJohnny",
                                    "enterNeedleAndGrooveBackroom",
                                  ]
                                : currentScene.id === "police-station"
                                  ? ["enterPoliceStation"]
                                  : currentScene.id === "police-station-inside"
                                    ? ["leavePoliceStation"]
                                    : currentScene.id === "hospital"
                                      ? ["enterHospital"]
                                      : currentScene.id === "hospital-reception"
                                        ? [
                                            "goToMarleneCounter",
                                            "talkToMarlene",
                                            "goToHospitalRoom",
                                          ]
                                        : currentScene.id === "scrapyard"
                                          ? ["enterScrapyard"]
                                          : currentScene.id ===
                                              "scrapyard-inside"
                                            ? [
                                                "talkToBigRoy",
                                                "lookAtScrapyardDesk",
                                                "leaveScrapyard",
                                              ]
                                            : currentScene.id ===
                                                "scrapyard-desk"
                                              ? ["takeScrapyardKnife"]
                                              : currentScene.id === "cementary"
                                                ? [
                                                    "enterCemetery",
                                                    "goCemeteryBackside",
                                                  ]
                                                : currentScene.id ===
                                                    "cementary-inside"
                                                  ? ["goCemeteryBackside"]
                                                  : currentScene.id ===
                                                      "cementary-backside"
                                                    ? ["leaveCemeteryBackside"]
                                                    : currentScene.id ===
                                                        "motel"
                                                      ? ["enterMotel"]
                                                      : currentScene.id ===
                                                          "motel-inside"
                                                        ? [
                                                            "leaveMotel",
                                                            "talkToEarl",
                                                          ]
                                                        : currentScene.id ===
                                                            "front-yard"
                                                          ? [
                                                              "goBackYard",
                                                              "goHome",
                                                              "enterGarage",
                                                              "lookAtSanatoriumHill",
                                                            ]
                                                          : currentScene.id ===
                                                              "light-pole"
                                                            ? [
                                                                "chooseNeedleGrooveJob",
                                                                "chooseGasStationJob",
                                                                "chooseScrapyardJob",
                                                              ]
                                                            : []);
  const visibleChoices =
    !momTalked && currentScene.id === "kitchen"
      ? activeChoices.filter(
          (choice) => !("action" in choice && choice.action === "checkFridge"),
        )
      : activeChoices;
  const sceneHotspots = visibleChoices.filter(
    (choice): choice is Choice =>
      "action" in choice &&
      (hotspotActions.includes(choice.action) || !!choice.hotspots?.length),
  );
  const choicesWithoutHotspotActions = visibleChoices.filter(
    (choice) =>
      "response" in choice ||
      (!hotspotActions.includes(choice.action) && !choice.hotspots?.length),
  );
  const bottomThought =
    lateNightActionThought ??
    (showLateNightThought && isLateNight
      ? "Middle of the night. I'm beat. I should get home."
      : null);
  const actionList = (
    <ActionList
      title={
        conversationActive ? "What do you say?" : "What do you want to do?"
      }
      choices={choicesWithoutHotspotActions}
      onChoice={handleChoice}
      onWalk={() => {
        setTravelMode("walk");
        setShowTravel(true);
      }}
      onBus={() => {
        setTravelMode("bus");
        setShowTravel(true);
      }}
      onGoToBusStop={goToBusStop}
      isBusStop={currentScene.id === "bus-stop"}
      canTravel={isExteriorScene(currentScene.id)}
      playerMoney={playerState.money}
      layout="overlay"
    />
  );

  if (!(hasStarted ?? resumedSession)) {
    return (
      <main className="mainMenu">
        <div className="mainMenuArtwork" aria-hidden="true" />
        <div className="mainMenuShade" aria-hidden="true" />
        <div className="mainMenuBranding">
          <a
            className="mainMenuStudioLogoLink"
            href="https://www.lostfrequencygames.com/"
            target="_blank"
            rel="noreferrer"
          >
            <Image
              className="mainMenuStudioLogo"
              src="/LostFrequencyGames-transparent.png"
              alt="Lost Frequency Games"
              width={1254}
              height={1254}
            />
          </a>
          <a
            className="mainMenuSocialLink"
            href="https://x.com/HarlowTheGame"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Harlow: 1982 on X"
          >
            <Image src="/X.png" alt="" width={1500} height={1500} />
          </a>
        </div>

        <section className="mainMenuContent" aria-labelledby="game-title">
          <p className="mainMenuEyebrow">A small-town mystery unfolds</p>
          <h1 id="game-title">Harlow: 1982</h1>
          <div className="mainMenuActions">
            <button className="mainMenuStart" onClick={startNewGame}>
              New Game
            </button>
            <button
              className="mainMenuStart mainMenuContinue"
              onClick={continueGame}
            >
              Continue
            </button>
          </div>
        </section>
        <p className="mainMenuCopyright">
          © 2026 Lost Frequency Games. All rights reserved.
        </p>
      </main>
    );
  }

  return (
    <main className="game">
      {showProductionSplash && (
        <OpeningSequence
          dayOfWeek={gameState.dayOfWeek}
          month={gameState.currentMonth}
          dayNumber={gameState.dayNumber}
          time={gameState.time}
          location={gameState.location}
          onReveal={startOpeningThoughts}
          onFinished={finishProductionSplash}
        />
      )}
      <Atmosphere night={sceneIsNight} />
      {isNightTime(gameState.time) && (
        <div className="gameClouds gameCloudsNight" aria-hidden="true">
          <div className="gameCloud gameCloudOne" />
          <div className="gameCloud gameCloudTwo" />
          <div className="gameCloud gameCloudThree" />
        </div>
      )}
      <div className="game-panel">
        <h1>HARLOW</h1>

        <GameMenu
          onOpenCharacters={() => setShowCharacterDirectory(true)}
          onMainMenu={returnToMainMenu}
          onSave={saveGame}
          onLoad={loadGame}
        />

        <GameStatus
          player={playerState}
          gameState={gameState}
          onStatsClick={() => setShowStats(true)}
          onInventoryClick={() => setShowInventory(true)}
          onQuestsClick={() => setShowQuestLog(true)}
        />

        <div
          className={`scene-image-frame scene-image-frame-${currentScene.id}${weatherImage && sceneImage === weatherImage ? " scene-image-frame-weather-art" : ""}${hasConversationOverlay ? " scene-image-frame-has-conversation" : ""}${conversationActive ? " scene-image-frame-conversation-active" : ""}`}
        >
          {/* The picture and its hotspots share one box, so percentage hotspot
              positions always map onto the art, wherever the panels sit. */}
          <div className="scene-art">
            {/* A soft, blurred spill of the art fills any space around the frame. */}
            <div
              className="scene-ambient"
              aria-hidden="true"
              style={{
                backgroundImage: `url("${conversationActive && conversationBackdrop ? conversationBackdrop : sceneImage}")`,
              }}
            />
            <img
              src={sceneImage}
              alt=""
              className={`scene-image${sceneImageEntering ? " scene-image-enter" : ""}`}
              onLoad={replaySceneImageEnter}
            />
            {conversationBackdrop && (
              <img
                src={conversationBackdrop}
                alt=""
                aria-hidden="true"
                className={`scene-image scene-image-backdrop${conversationActive ? " scene-image-backdrop-active" : ""}`}
              />
            )}
            <StormLightning
              weather={gameState.weather}
              indoor={sceneIsIndoor}
              active={!showProductionSplash}
            />
            {/* Dims everything but the hotspot under the pointer or focus. */}
            <div className="scene-spotlight" aria-hidden="true">
              <div className="scene-spotlight-hole" />
            </div>
            {!(showOpeningThought || showVinylThought || tvNewsLine !== null) &&
              sceneHotspots.flatMap((sceneHotspot) =>
                (sceneHotspot.hotspots ?? [undefined]).map((region, index) => (
                  <SceneHotspot
                    key={`${sceneHotspot.action}-${index}`}
                    type="button"
                    data-kind={hotspotKind(sceneHotspot.action)}
                    className={`scene-hotspot scene-hotspot-${sceneHotspot.action} scene-hotspot-${currentScene.id}-${sceneHotspot.action}`}
                    style={
                      region
                        ? {
                            left: `${region.left}%`,
                            top: `${region.top}%`,
                            width: `${region.width}%`,
                            height: `${region.height}%`,
                          }
                        : undefined
                    }
                    aria-label={
                      hotspotLabels[sceneHotspot.action] ?? sceneHotspot.label
                    }
                    label={
                      hotspotLabels[sceneHotspot.action] ?? sceneHotspot.label
                    }
                    onClick={() => {
                      if (sceneHotspot.action === "watchTv") {
                        showTvNews();
                        return;
                      }

                      if (sceneHotspot.action === "playVinyl") {
                        showVinylPlayerThought();
                      }
                      handleChoice(sceneHotspot);
                    }}
                  />
                )),
              )}
          </div>
          <div className="scene-info-stack">
            {/* The scene caption: a small glass card in the dialogue box's
                language, keyed to the scene so it settles in on arrival. */}
            <div className="scene-info-panel" key={currentScene.id}>
              <div className="scene-caption-plate-row">
                <h2 className="scene-caption-plate">Scene</h2>
                {currentScene.location && (
                  <span className="scene-caption-place">{currentScene.location}</span>
                )}
              </div>
              <div className="scene-caption-narration">
                <StoryLog
                  entries={currentScene.story.filter(
                    (entry) =>
                      entry.type !== "thought" &&
                      storyEntryApplies(
                        entry,
                        gameState.time,
                        gameState.weather,
                        gameState.dayOfWeek,
                      ),
                  )}
                  variant="narration"
                  layout="combined"
                />
              </div>
              {currentThought && (
                <div className="scene-caption-thought">
                  <CharacterLine
                    key={currentThought}
                    text={currentThought}
                    variant="inline"
                    effect={
                      currentEffects[0]?.type === "effect"
                        ? {
                            stat: currentEffects[0].stat,
                            amount: currentEffects[0].amount,
                          }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
            {questNotification && (
              <div
                className={`quest-notification${questNotificationExiting ? " quest-notification-exiting" : ""}`}
                role="status"
              >
                <span>{questNotificationLabel}</span>
                <p>{questNotification}</p>
              </div>
            )}
          </div>
          {bottomThought && (
            <ThoughtPanel
              className="opening-thought late-night-thought"
              speaker="Ethan"
              caption="Inner thought"
              text={bottomThought}
            />
          )}
          {showVinylThought && !bottomThought && (
            <ThoughtPanel
              className="opening-thought"
              speaker="Ethan"
              caption="Inner thought"
              text="I love this thing. Mom got it for me last Christmas."
            />
          )}
          {openingThoughtIndex !== null ? (
            <ThoughtPanel
              className="opening-thought"
              speaker="Ethan"
              caption="Inner thought"
              text={OPENING_THOUGHTS[openingThoughtIndex]}
              onAdvance={advanceOpeningThought}
            />
          ) : (
            tvNewsLine !== null && (
              <ThoughtPanel
                className="opening-thought"
                speaker="TV news"
                caption="Local broadcast"
                kind="news"
                text={tvNewsLine}
              />
            )
          )}
          {hasConversationOverlay && (
            <div
              className={`conversation-overlay${conversationActive ? " conversation-overlay-active" : ""}`}
              aria-hidden={!conversationActive}
            >
              <DialogueScene
                entries={conversation}
                active={conversationActive}
                onFinish={finishConversation}
                choices={
                  conversationActive && choicesWithoutHotspotActions.length > 0
                    ? actionList
                    : null
                }
              />
            </div>
          )}
          {!hasConversationOverlay &&
            !(showOpeningThought || showVinylThought || tvNewsLine !== null) &&
            actionList}
        </div>

        {showStats && (
          <StatsWindow
            player={playerState}
            onClose={() => setShowStats(false)}
          />
        )}
        {showInventory && (
          <InventoryWindow
            inventory={playerState.inventory}
            onUseItem={useInventoryItem}
            onClose={() => setShowInventory(false)}
          />
        )}

        {activeShop && (
          <ShopWindow
            shop={activeShop}
            playerMoney={playerState.money}
            hasEmployeeDiscount={job === "gas-station"}
            onPurchase={buyItem}
            onClose={() => setActiveShop(null)}
          />
        )}
        {showCharacterDirectory && (
          <CharacterWindow onClose={() => setShowCharacterDirectory(false)} />
        )}
        {showQuestLog && (
          <QuestWindow
            quests={quests}
            job={job}
            dayOfWeek={gameState.dayOfWeek}
            dayNumber={gameState.dayNumber}
            currentMonth={gameState.currentMonth}
            inventory={playerState.inventory}
            storyFlags={storyFlags}
            onClose={() => setShowQuestLog(false)}
          />
        )}
        {showTravel && (
          <TravelWindow
            walkingChoices={walkingChoices}
            busChoices={busChoices}
            onChoice={handleChoice}
            onClose={() => setShowTravel(false)}
            onTravelStart={() => setShowTravel(false)}
            playerMoney={playerState.money}
            initialMenu={travelMode}
          />
        )}

        {showPlaytestControls && (
        <div className="waitControls">
          <span>Pass time</span>
          <ActionButton label="Wait 1 min" onClick={() => adminWait(1)} />

          <ActionButton label="Wait 5 min" onClick={() => adminWait(5)} />

          <ActionButton label="Wait 10 min" onClick={() => adminWait(10)} />

          <ActionButton label="Wait 30 min" onClick={() => adminWait(30)} />

          <ActionButton label="Wait 1 hour" onClick={() => adminWait(60)} />
        </div>
        )}

        {showPlaytestControls && (
        <div className="adminTravelControls">
          <ActionButton
            label={showAdminTravel ? "Hide admin travel" : "Admin travel"}
            onClick={() => setShowAdminTravel((visible) => !visible)}
          />
          {showAdminTravel && (
            <div
              className="adminTravelPanel"
              aria-label="Admin travel destinations"
            >
              <span>Free travel</span>
              <div>
                {adminDestinations.map((destination) => (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => {
                      adminTravel(destination.id);
                      setShowAdminTravel(false);
                    }}
                  >
                    {destination.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {closeup && (
          <CloseupOverlay closeup={closeup} onDismiss={dismissCloseup} />
        )}

        {showChapterEnd && (
          <div
            className="new-day-screen"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-end-title"
            onClick={dismissChapterEnd}
          >
            <div className="new-day-screen-content">
              <p>Harlow</p>
              <h2 id="chapter-end-title">End of Chapter 1</h2>
              <span>Click to continue</span>
            </div>
          </div>
        )}

        {travelingTo && (
          <TravelOverlay
            location={travelingTo.location}
            method={travelingTo.method}
            isNight={travelingTo.isNight}
          />
        )}

        {/* Going through a door: a quick dip to black that also swallows
            clicks until the new scene is back. */}
        {doorTransition !== "idle" && (
          <div
            className={`door-transition door-transition-${doorTransition}`}
            aria-hidden="true"
          />
        )}

        {newDayAnnouncement && (
          <div
            className="new-day-screen"
            role="status"
            aria-live="polite"
            aria-labelledby="new-day-title"
          >
            <div className="new-day-screen-content">
              <p>Morning has come</p>
              <h2 id="new-day-title">{newDayAnnouncement.dayOfWeek}</h2>
              <span>
                {newDayAnnouncement.currentMonth} {newDayAnnouncement.dayNumber}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
