"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import SceneHotspot from "@/components/SceneHotspot";

import GameStatus from "@/components/GameStatus/GameStatus";
import ActionList from "@/components/ActionList/ActionList";
import AskAboutList from "@/components/AskAboutList/AskAboutList";
import StatsWindow from "@/components/StatsWindow/StatsWindow";
import StoryLog from "@/components/StoryLog/StoryLog";
import CharacterLine from "@/components/CharacterLine/CharacterLine";
import DialogueScene from "@/components/DialogueScene/DialogueScene";
import ThoughtPanel from "@/components/ThoughtPanel/ThoughtPanel";
import DayCard from "@/components/DayCard/DayCard";
import OpeningSequence from "@/components/OpeningSequence/OpeningSequence";
import TravelOverlay from "@/components/TravelOverlay/TravelOverlay";
import TownMap from "@/components/TownMap/TownMap";
import InventoryWindow from "@/components/InventoryWindow/InventoryWindow";
import ShopWindow from "@/components/ShopWindow/ShopWindow";
import GameMenu from "@/components/GameMenu/GameMenu";
import CharacterWindow from "@/components/CharacterWindow/CharacterWindow";
import QuestWindow from "@/components/QuestWindow/QuestWindow";

import { useReducedMotion } from "@/components/DialogueScene/typewriter";
import { isNightPaper, isNightTime } from "@/game/utils";
import { isTiredWindow } from "@/game/lateNight";
import { isQuestActive, isQuestCompleted } from "@/game/quests";
import { millerLakeUnlocked, STALKER_FIGURE } from "@/game/slasher";
import {
  CEMETERY_LUNCH,
  cemeteryCrossVisible,
  cemeteryLunchDue,
  displayedClock,
  homeNightWeather,
  titleCardFor,
} from "@/game/chapter1";
import { useGame } from "@/game/useGame";
import { storyEntryApplies } from "@/game/story";
import { DINER_BOARD_HINT, isExteriorScene, RAIN_WEATHER, sanatoriumNarration } from "@/game/scenes";
import {
  clearSessionSave,
  clearStoredGames,
  readMostRecentSave,
  readSessionSave,
  type SavedGame,
} from "@/game/save";
import { ambienceSlotForScene } from "@/game/ambience";
import { harlowAudio } from "@/game/audio";
import { textSpeedScale } from "@/game/settings";
import { useGameSettings } from "@/game/useSettings";
import Atmosphere from "@/components/Atmosphere/Atmosphere";
import StormLightning from "@/components/StormLightning/StormLightning";
import CloseupOverlay from "@/components/CloseupOverlay/CloseupOverlay";
import EndingSequence from "@/components/EndingSequence/EndingSequence";
import CaptionPlacer from "@/components/CaptionPlacer/CaptionPlacer";
import MainMenu from "@/components/MainMenu/MainMenu";
import PauseMenu from "@/components/PauseMenu/PauseMenu";
import SettingsScreen from "@/components/SettingsScreen/SettingsScreen";
import AutosaveIndicator from "@/components/AutosaveIndicator/AutosaveIndicator";
import PlaytestControls from "@/components/PlaytestControls/PlaytestControls";
import type { Choice } from "@/game/choices";
import { choiceAffordance } from "@/game/statLabels";
import {
  OPENING_THOUGHT_BASE_MS,
  OPENING_THOUGHT_FIRST_EXTRA_MS,
  OPENING_THOUGHT_PER_CHARACTER_MS,
  OPENING_THOUGHTS,
} from "./openingThoughts";
import { playtestDebugOnClient, subscribePlaytestDebug } from "./playtestDebug";
import { resolveSceneArt } from "./sceneArt";
import {
  OUTDOOR_SCENE_IDS,
  adminDestinations,
  choiceKeptInList,
  hotspotActionsFor,
  hotspotKind,
  hotspotLabels,
} from "./sceneHotspots";

function subscribeToSession() {
  return () => {};
}

function hasActiveSession() {
  return readSessionSave() !== null;
}


export default function Home() {
  // Restore the session until the player explicitly chooses a screen.
  // Returning to the menu must override the session detected on refresh.
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const [continueSave, setContinueSave] = useState<SavedGame | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveWindowOpen, setSaveWindowOpen] = useState(false);
  const textSettings = useGameSettings();
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
  const [mapNote, setMapNote] = useState<string | null>(null);
  // Index into OPENING_THOUGHTS while Ethan's first thoughts play, else null.
  const [openingThoughtIndex, setOpeningThoughtIndex] = useState<number | null>(null);
  const showOpeningThought = openingThoughtIndex !== null;
  const [showVinylThought, setShowVinylThought] = useState(false);
  const [showLateNightThought, setShowLateNightThought] = useState(false);
  const [statNotices, setStatNotices] = useState<{ stat: string; amount: number }[]>([]);
  const chapterEndButtonRef = useRef<HTMLButtonElement>(null);
  const [tvNewsLine, setTvNewsLine] = useState<string | null>(null);
  const openingThoughtTimer = useRef<number | null>(null);
  const vinylThoughtTimer = useRef<number | null>(null);
  const lateNightThoughtTimer = useRef<number | null>(null);
  const panelStack = useRef<Array<{ id: "inventory" | "quests"; opener: HTMLElement }>>([]);
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
    finishPhoneAnswer,
    holdPhoneLine,
    advancePhoneLine,
    holdMusicBox,
    advanceMusicBox,
    onReplySettled,
    showDinerBoardHint,
    activeChoices,
    activeCharacter,
    showStats,
    setShowStats,
    showInventory,
    setShowInventory,
    handleChoice,
    doorTransition,
    adminTravel,
    wait,
    travelingTo,
    showTravel,
    setShowTravel,
    travelDestinations,
    activeShop,
    setActiveShop,
    job,
    quests,
    closeup,
    dismissCloseup,
    showChapterEnd,
    dismissChapterEnd,
    storyFlags,
    markCemeteryLunch,
    phonePhase,
    figureActive,
    stalkerMode,
    escapeOpen,
    escapeMode,
    chooseEscape,
    finishEscape,
    finishMusicBoxCall,
    catchEntrance,
    trust,
    metPeople,
    unseenPeople,
    acknowledgePeople,
    clues,
    clueConnections,
    unseenClues,
    acknowledgeClues,
    connectOnBoard,
    askAboutOpen,
    askTopics,
    askedAbout,
    conversationPerson,
    beginAsk,
    dismissAskAbout,
    noteHoodedMan,
    momTalked,
    questNotification,
    questNotificationLabel,
    questNotificationKind,
    questNotificationExiting,
    buyItem,
    useInventoryItem,
    saveGame,
    loadGame,
    loadMostRecentGame,
    startNewGameSession,
    notifyMomQuest,
  } = useGame();
  const mapButtonRef = useRef<HTMLButtonElement>(null);

  function closeMap() {
    setShowTravel(false);
    mapButtonRef.current?.focus();
  }

  useEffect(() => {
    // After paint, so the server HTML stays save-free and the hook lint stays quiet.
    const timer = window.setTimeout(() => setContinueSave(readMostRecentSave()), 0);
    return () => window.clearTimeout(timer);
  }, [hasStarted, resumedSession]);

  function continueGame() {
    if (loadMostRecentGame()) setHasStarted(true);
  }

  function startNewGame() {
    clearStoredGames();
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
    if (openingThoughtIndex === 2) noteHoodedMan();
    const line = OPENING_THOUGHTS[openingThoughtIndex];
    const pace = textSpeedScale(textSettings.textSpeed);
    const delay =
      (OPENING_THOUGHT_BASE_MS + line.length * OPENING_THOUGHT_PER_CHARACTER_MS) * pace +
      (openingThoughtIndex === 0 ? OPENING_THOUGHT_FIRST_EXTRA_MS : 0);
    const timer = window.setTimeout(advanceOpeningThoughtLater, delay);
    return () => window.clearTimeout(timer);
  }, [openingThoughtIndex, textSettings.textSpeed, noteHoodedMan]);

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

  function rememberPanel(id: "inventory" | "quests", opener: HTMLElement) {
    panelStack.current = [
      ...panelStack.current.filter((entry) => entry.id !== id),
      { id, opener },
    ];
  }

  function forgetPanel(id: "inventory" | "quests") {
    panelStack.current = panelStack.current.filter((entry) => entry.id !== id);
  }

  // Escape closes the top panel. With nothing else open, it pauses.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (pauseOpen || settingsOpen || saveWindowOpen) return;
      if (closeup || showChapterEnd || doorTransition !== "idle" || showProductionSplash) return;
      if (showTravel) return;
      if (showStats) {
        setShowStats(false);
        return;
      }
      if (showCharacterDirectory) {
        setShowCharacterDirectory(false);
        return;
      }
      if (activeShop) {
        setActiveShop(null);
        return;
      }
      const top = panelStack.current.at(-1);
      if (top) {
        event.preventDefault();
        panelStack.current = panelStack.current.slice(0, -1);
        if (top.id === "inventory") setShowInventory(false);
        else setShowQuestLog(false);
        top.opener.focus();
        return;
      }
      event.preventDefault();
      setPauseOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeShop,
    closeup,
    doorTransition,
    pauseOpen,
    saveWindowOpen,
    setActiveShop,
    setShowCharacterDirectory,
    setShowInventory,
    setShowStats,
    settingsOpen,
    showChapterEnd,
    showCharacterDirectory,
    showProductionSplash,
    showStats,
    showTravel,
  ]);

  const inGame = Boolean(hasStarted ?? resumedSession);
  const sceneIsIndoor = !(
    isExteriorScene(currentScene.id) || OUTDOOR_SCENE_IDS.has(currentScene.id)
  );
  const sceneIsNight = isNightTime(gameState.time);
  const displayWeather = homeNightWeather(
    gameState.weather,
    currentScene.id,
    gameState.time,
    Boolean(storyFlags.nightCallClear),
  );
  const displayGameState = {
    ...(displayWeather === gameState.weather ? gameState : { ...gameState, weather: displayWeather }),
    time: displayedClock(gameState.time, phonePhase === "ring" || phonePhase === "talk"),
  };

  // Rain follows the weather and whether Ethan is inside.
  // The intro film carries its own soundtrack, so the beds wait for it.
  useEffect(() => {
    const audio = harlowAudio();
    if (inGame && !showProductionSplash) {
      audio.setAmbience({ indoor: sceneIsIndoor, weather: displayWeather });
      audio.setAmbienceSlot(ambienceSlotForScene(currentScene.id, displayWeather, gameState.time));
    } else {
      audio.setAmbience(null);
      audio.setAmbienceSlot(null);
    }
  }, [inGame, showProductionSplash, sceneIsIndoor, displayWeather, gameState.time, currentScene.id]);

  useEffect(() => () => {
    harlowAudio().setAmbience(null);
    harlowAudio().setAmbienceSlot(null);
  }, []);

  const isLateNight = isTiredWindow(gameState.time);

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

  useEffect(() => {
    const effects = currentEffects.flatMap((entry) =>
      entry.type === "effect" && entry.amount !== 0
        ? [{ stat: entry.stat, amount: entry.amount }]
        : [],
    );
    if (effects.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const show = window.setTimeout(() => setStatNotices(effects), 0);
    const clear = window.setTimeout(() => setStatNotices([]), reduced ? 1600 : 1400);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(clear);
    };
  }, [currentEffects, currentScene.id]);

  useEffect(() => {
    if (!showChapterEnd) return;
    chapterEndButtonRef.current?.focus();
  }, [showChapterEnd]);

  function returnToMainMenu() {
    clearSessionSave();
    setHasStarted(false);
  }

  const hasConversationOverlay = conversation.length > 0;

  const art = resolveSceneArt({
    scene: currentScene,
    time: gameState.time,
    weather: displayWeather,
    dayOfWeek: gameState.dayOfWeek,
    dayNumber: gameState.dayNumber,
    storyFlags,
    activeCharacter,
    quests,
    sceneIsIndoor,
    hasConversationOverlay,
    woodsFigure: figureActive && currentScene.id === "elrod-backyard",
  });
  const {
    momInKitchen,
    weatherImage,
    hillCompleted,
    sanatoriumDark,
    sceneImage,
    conversationBackdrop,
    interimRain,
    interimRainNight,
    syntheticNight,
    imageFallback,
  } = art;

  const reducedMotion = useReducedMotion();
  const [shownSceneImage, setShownSceneImage] = useState(sceneImage);
  const [incomingSceneImage, setIncomingSceneImage] = useState<string | null>(null);
  const [incomingSceneVisible, setIncomingSceneVisible] = useState(false);
  // Reduced motion swaps the plate immediately. The held image stays behind
  // only while a crossfade is allowed to run.
  const displayedSceneImage = reducedMotion ? sceneImage : shownSceneImage;

  useEffect(() => {
    if (reducedMotion || sceneImage === shownSceneImage) return;

    let cancelled = false;
    const preloader = new window.Image();
    preloader.onload = () => {
      if (cancelled) return;
      setIncomingSceneImage(sceneImage);
      setIncomingSceneVisible(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) setIncomingSceneVisible(true);
        });
      });
    };
    preloader.onerror = () => {
      if (!cancelled) setShownSceneImage(sceneImage);
    };
    preloader.src = sceneImage;
    return () => {
      cancelled = true;
    };
  }, [sceneImage, shownSceneImage, reducedMotion]);

  useEffect(() => {
    if (!incomingSceneVisible || !incomingSceneImage) return;
    const timer = window.setTimeout(() => {
      setShownSceneImage(incomingSceneImage);
      setIncomingSceneImage(null);
      setIncomingSceneVisible(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [incomingSceneVisible, incomingSceneImage]);

  const dinerPlateReady =
    showDinerBoardHint
    && currentScene.id === "diner-inside"
    && (reducedMotion || shownSceneImage === sceneImage || incomingSceneVisible);
  const [cueState, setCueState] = useState<"idle" | "on" | "done">("idle");
  if (dinerPlateReady && cueState === "idle") setCueState("on");
  if (!showDinerBoardHint && cueState !== "idle") setCueState("idle");
  useEffect(() => {
    if (cueState !== "on") return;
    const timer = window.setTimeout(() => setCueState("done"), 1000);
    return () => window.clearTimeout(timer);
  }, [cueState]);
  const boardCue = cueState === "on";
  const hotspotActions = hotspotActionsFor(currentScene.id, {
    lindaHere: activeCharacter?.name === "Linda",
    momInKitchen,
    momTalked,
  });
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
  const choicesWithoutHotspotActions = visibleChoices.filter((choice) => {
    if ("response" in choice) return true;
    return choiceKeptInList(
      choice.action,
      hotspotActions,
      Boolean(choice.hotspots?.length),
    );
  });
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
      leadsQuest={(choice) =>
        Boolean(choice.leadQuest)
        && !quests.some((quest) => quest.id === choice.leadQuest)
      }
      onOpenMap={() => {
        const due = cemeteryLunchDue({
          dayNumber: gameState.dayNumber,
          time: gameState.time,
          momTalked,
          heard: Boolean(storyFlags.cemeteryLunchHeard),
        });
        setMapNote(due ? CEMETERY_LUNCH : null);
        if (due) markCemeteryLunch();
        setShowTravel(true);
      }}
      mapButtonRef={mapButtonRef}
      canTravel={isExteriorScene(currentScene.id)}
      playerMoney={playerState.money}
      layout="overlay"
    />
  );

  // Hold the previous plate, caption, and choices until the next image has
  // loaded, then fade them in together. Text never arrives first.
  const liveVisual = {
    scene: currentScene,
    thought: currentThought,
    hotspots: sceneHotspots,
    actionList,
    interimRain,
    interimRainNight,
    syntheticNight,
    weatherArt: Boolean(weatherImage && sceneImage === weatherImage),
  };
  const arrivalSignature = [
    currentScene.id,
    sceneImage,
    currentThought ?? "",
    interimRain ? "rain" : "",
    interimRainNight ? "night" : "",
    choicesWithoutHotspotActions.map((choice) => choice.label).join("|"),
  ].join("~");
  const [presented, setPresented] = useState({ signature: arrivalSignature, visual: liveVisual });
  const arrivalReady = reducedMotion || incomingSceneVisible || shownSceneImage === sceneImage;
  if (arrivalReady && presented.signature !== arrivalSignature) {
    setPresented({ signature: arrivalSignature, visual: liveVisual });
  }
  const visual = arrivalReady ? liveVisual : presented.visual;
  const visualOutdoors =
    isExteriorScene(visual.scene.id) || OUTDOOR_SCENE_IDS.has(visual.scene.id);
  const boardHint = showDinerBoardHint && visual.scene.id === "diner-inside";

  if (!(hasStarted ?? resumedSession)) {
    return (
      <MainMenu
        continueSave={continueSave}
        onNewGame={startNewGame}
        onContinue={continueGame}
      />
    );
  }

  const nightUi = isNightPaper(gameState.time) && !textSettings.highContrast;
  const morningCard = newDayAnnouncement
    ? titleCardFor(newDayAnnouncement.currentMonth, newDayAnnouncement.dayNumber)
    : null;

  return (
    <main className="game" data-night-ui={nightUi ? "on" : undefined}>
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
        <div className="gameClouds gameCloudsNight" aria-hidden="true" />
      )}
      <div className="game-panel">
        <h1>HARLOW</h1>

        <GameMenu
          onOpenCharacters={() => setShowCharacterDirectory(true)}
          onOpenPause={() => setPauseOpen(true)}
          onSave={saveGame}
          onLoad={loadGame}
          onSaveWindowChange={setSaveWindowOpen}
        />

          <GameStatus
          player={playerState}
          gameState={displayGameState}
          notices={statNotices}
          onStatsClick={() => setShowStats(true)}
          onInventoryClick={(opener) => {
            rememberPanel("inventory", opener);
            setShowInventory(true);
          }}
          onQuestsClick={(opener) => {
            rememberPanel("quests", opener);
            setShowQuestLog(true);
            harlowAudio().playSfx("page-turn");
          }}
          notebookUpdated={unseenPeople.length > 0 || unseenClues.length > 0}
        />

        <div
          className={`scene-image-frame scene-image-frame-${visual.scene.id}${visual.weatherArt ? " scene-image-frame-weather-art" : ""}${visual.scene.captionPosition === "bottom" ? " scene-image-frame-caption-bottom" : ""}${visual.scene.captionPosition === "center" ? " scene-image-frame-caption-center" : ""}${conversationActive ? " scene-image-frame-has-conversation scene-image-frame-conversation-active" : ""}${visual.interimRain ? " scene-image-frame-interim-rain" : ""}${visual.interimRainNight ? " scene-image-frame-interim-rain-night" : ""}${visualOutdoors ? " scene-image-frame-exterior" : ""}${sanatoriumDark ? " scene-image-frame-sanatorium-dark" : ""}${visual.syntheticNight ? " scene-image-frame-synthetic-night" : ""}${incomingSceneVisible ? " scene-frame-arrive" : ""}`}
          data-scene-id={visual.scene.id}
        >
          {/* The picture and its hotspots share one box, so percentage hotspot
              positions always map onto the art, wherever the panels sit. */}
          <div className="scene-art">
            {closeup?.video && (
              <video
                key={closeup.video}
                src={closeup.video}
                className="scene-pickup-video"
                onLoadedMetadata={(event) => {
                  event.currentTarget.playbackRate = 2;
                }}
                autoPlay
                muted
                playsInline
                aria-label={closeup.label ?? "Scene animation"}
                onEnded={dismissCloseup}
                onError={dismissCloseup}
              />
            )}
            {/* A soft, blurred spill of the art fills any space around the frame. */}
            <div
              className="scene-ambient"
              aria-hidden="true"
              style={{
                backgroundImage: `url("${conversationActive && conversationBackdrop ? conversationBackdrop : displayedSceneImage}")`,
              }}
            />
            <img
              src={displayedSceneImage}
              alt=""
              className="scene-image"
              style={visual.scene.image.objectPosition ? { objectPosition: visual.scene.image.objectPosition } : undefined}
              onError={(event) => {
                if (!imageFallback || event.currentTarget.dataset.fallback === "1") return;
                event.currentTarget.dataset.fallback = "1";
                event.currentTarget.src = imageFallback;
              }}
            />
            {!reducedMotion && incomingSceneImage && (
              <img
                src={incomingSceneImage}
                alt=""
                className={`scene-image scene-image-crossfade${incomingSceneVisible ? " scene-image-crossfade-in" : ""}`}
                style={visual.scene.image.objectPosition ? { objectPosition: visual.scene.image.objectPosition } : undefined}
              />
            )}
            {visual.syntheticNight && <div className="scene-night-tint" aria-hidden="true" />}
            {conversationBackdrop && (
              <img
                src={conversationBackdrop}
                alt=""
                aria-hidden="true"
                className={`scene-image scene-image-backdrop${conversationActive ? " scene-image-backdrop-active" : ""}`}
              />
            )}
            {visual.interimRain && <div className="scene-rain-sky" aria-hidden="true" />}
            {visual.interimRain && visualOutdoors && (
              <div className="scene-rain-glass" aria-hidden="true" />
            )}
            {nightUi && <div className="night-scene-vignette" aria-hidden="true" />}
            {phonePhase && (
              <div className="phone-dim" aria-hidden="true">
                <div className="phone-dim-hole" />
              </div>
            )}
            {figureActive && <div className="figure-vignette" aria-hidden="true" />}
            {stalkerMode && (
              <img
                src={STALKER_FIGURE}
                alt=""
                className={stalkerMode === "window" ? "stalker-figure-window" : "stalker-figure"}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
            <StormLightning
              weather={displayWeather}
              indoor={sceneIsIndoor}
              active={!showProductionSplash}
            />
            {/* Dims everything but the hotspot under the pointer or focus. */}
            <div className="scene-spotlight" aria-hidden="true">
              <div className="scene-spotlight-hole" />
            </div>
            {!(showOpeningThought || showVinylThought || tvNewsLine !== null)
              && !phonePhase
              && !figureActive
              && !stalkerMode &&
              visual.hotspots.flatMap((sceneHotspot) =>
                (sceneHotspot.hotspots ?? [undefined]).map((region, index) => {
                  const hint = choiceAffordance(sceneHotspot);
                  const hotspotName = hotspotLabels[sceneHotspot.action] ?? sceneHotspot.label;
                  return (
                  <SceneHotspot
                    key={`${sceneHotspot.action}-${index}`}
                    type="button"
                    data-kind={hotspotKind(sceneHotspot.action)}
                    className={`scene-hotspot scene-hotspot-${sceneHotspot.action} scene-hotspot-${visual.scene.id}-${sceneHotspot.action}${boardCue && sceneHotspot.action === "lookAtDinerBulletin" ? " scene-hotspot-cue" : ""}`}
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
                      `${hotspotName}${hint ? `. ${hint}` : ""}${
                        sceneHotspot.leadQuest
                        && !quests.some((quest) => quest.id === sceneHotspot.leadQuest)
                          ? ". Starts a new lead"
                          : ""
                      }`
                    }
                    leadsQuest={
                      Boolean(sceneHotspot.leadQuest)
                      && !quests.some((quest) => quest.id === sceneHotspot.leadQuest)
                    }
                    label={`${hotspotName}${hint ? ` · ${hint}` : ""}`}
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
                  );
                }),
              )}
          </div>
          <div className="scene-info-stack">
            {/* The scene caption: a small glass card in the dialogue box's
                language, keyed to the scene so it settles in on arrival. */}
            <div className="scene-info-panel" key={visual.scene.id}>
              <div className="scene-caption-plate-row">
                <h2 className="scene-caption-plate">Scene</h2>
                {visual.scene.location && (
                  <span className="scene-caption-place">{visual.scene.location}</span>
                )}
              </div>
              <div className="scene-caption-narration">
                <StoryLog
                  entries={visual.scene.story
                    .filter(
                      (entry) =>
                        entry.type !== "thought" &&
                        storyEntryApplies(
                          entry,
                          gameState.time,
                          displayWeather,
                          gameState.dayOfWeek,
                        ),
                    )
                    .map((entry) => {
                      if (
                        visual.scene.id !== "sanatorium"
                        || entry.type !== "narration"
                        || !entry.text.startsWith("You reach the sanatorium.")
                      ) {
                        return entry;
                      }
                      return {
                        ...entry,
                        text: sanatoriumNarration(gameState.time, hillCompleted),
                      };
                    })}
                  variant="narration"
                  layout="combined"
                />
              </div>
              {(visual.thought || boardHint) && (
                <div className="scene-caption-thought">
                  {visual.thought && (
                    <CharacterLine
                      key={visual.thought}
                      text={visual.thought}
                      variant="inline"
                    />
                  )}
                  {boardHint && (
                    <CharacterLine
                      text={DINER_BOARD_HINT}
                      variant="inline"
                    />
                  )}
                </div>
              )}
            </div>
            {questNotification && questNotificationKind === "lead" && (
              <button
                type="button"
                className={`quest-lead${questNotificationExiting ? " quest-lead-exiting" : ""}`}
                aria-live="polite"
                onClick={(event) => {
                  rememberPanel("quests", event.currentTarget);
                  setShowQuestLog(true);
                }}
              >
                <span>New lead</span>
                <p>{questNotification}</p>
              </button>
            )}
            {questNotification && questNotificationKind !== "lead" && (
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
              className={`conversation-overlay${conversationActive ? " conversation-overlay-active" : ""}${catchEntrance ? " conversation-overlay-instant" : ""}`}
              aria-hidden={!conversationActive}
            >
              <DialogueScene
                entries={conversation}
                active={conversationActive}
                staticCaller={phonePhase === "talk" || phonePhase === "music"}
                keepPauses={phonePhase === "talk" || phonePhase === "music"}
                onLineHeld={
                  phonePhase === "talk" ? holdPhoneLine : phonePhase === "music" ? holdMusicBox : undefined
                }
                onLineAdvance={
                  phonePhase === "talk"
                    ? advancePhoneLine
                    : phonePhase === "music"
                      ? advanceMusicBox
                      : undefined
                }
                onFinish={
                  phonePhase === "talk"
                    ? finishPhoneAnswer
                    : phonePhase === "music"
                      ? finishMusicBoxCall
                      : finishConversation
                }
                onSettled={onReplySettled}
                choices={
                  conversationActive && askAboutOpen
                    ? (
                      <AskAboutList
                        topics={askTopics}
                        asked={conversationPerson ? askedAbout[conversationPerson] ?? [] : []}
                        onAsk={beginAsk}
                        onNeverMind={dismissAskAbout}
                      />
                    )
                    : conversationActive && choicesWithoutHotspotActions.length > 0
                      ? actionList
                      : null
                }
                choiceKey={[
                  askAboutOpen ? "ask" : "",
                  askTopics.join("\n"),
                  choicesWithoutHotspotActions.map((choice) => choice.label).join("\n"),
                  storyFlags.rachelMet ? "rachelMet" : "",
                  storyFlags.walterStationTalk ? "walterStationTalk" : "",
                ].join("\n")}
              />
            </div>
          )}
          {!conversationActive &&
            !(showOpeningThought || showVinylThought || tvNewsLine !== null) &&
            visual.actionList}
          <CaptionPlacer
            sceneId={visual.scene.id}
            signature={arrivalSignature}
            thought={bottomThought ?? ""}
            lead={questNotification ?? ""}
          />
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
            onClose={() => {
              forgetPanel("inventory");
              setShowInventory(false);
            }}
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
            trust={trust}
            metPeople={metPeople}
            unseenPeople={unseenPeople}
            onPeopleViewed={acknowledgePeople}
            clues={clues}
            connections={clueConnections}
            unseenClues={unseenClues}
            onCluesViewed={acknowledgeClues}
            onConnect={connectOnBoard}
            onClose={() => {
              forgetPanel("quests");
              setShowQuestLog(false);
            }}
          />
        )}
        {showTravel && (
          <TownMap
            originId={currentScene.id}
            time={gameState.time}
            dayNumber={gameState.dayNumber}
            momTalked={momTalked}
            lightOnTheHillActive={isQuestActive(quests, "light-on-the-hill")}
            availableIds={travelDestinations}
            money={playerState.money}
            night={isNightTime(gameState.time)}
            openingThought={mapNote}
            cemeteryCross={cemeteryCrossVisible({
              dayNumber: gameState.dayNumber,
              time: gameState.time,
              momTalked,
            })}
            millerLake={millerLakeUnlocked({
              has1966: Boolean(storyFlags.dad1966Told),
              oldFriendsDone: Boolean(storyFlags.oldFriendsDone)
                || isQuestCompleted(quests, "old-friends"),
            })}
            onTravel={(choice) => {
              setShowTravel(false);
              setMapNote(null);
              handleChoice(choice);
            }}
            onClose={() => {
              setMapNote(null);
              closeMap();
            }}
          />
        )}

        {showPlaytestControls && (
          <PlaytestControls
            onWait={wait}
            showAdminTravel={showAdminTravel}
            onToggleAdminTravel={() => setShowAdminTravel((visible) => !visible)}
            destinations={adminDestinations}
            onTravel={(sceneId) => {
              adminTravel(sceneId);
              setShowAdminTravel(false);
            }}
          />
        )}

        {closeup && !closeup.video && (
          <CloseupOverlay
            closeup={closeup}
            onDismiss={dismissCloseup}
            rain={
              closeup.disableWeatherFilter
                ? null
                : RAIN_WEATHER.includes(displayWeather)
                  ? sceneIsIndoor
                    ? "interior"
                    : "exterior"
                  : null
            }
            rainNight={isNightTime(gameState.time)}
          />
        )}

        {(escapeOpen || escapeMode) && (
          <EndingSequence
            choosing={escapeOpen}
            mode={escapeMode}
            onChoose={chooseEscape}
            onDone={finishEscape}
          />
        )}

        {showChapterEnd && (
          <div
            className="chapter-end-screen"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-end-title"
          >
            <div className="chapter-end-screen-content">
              <p>Harlow</p>
              <h2 id="chapter-end-title">End of Chapter 1</h2>
              <button
                ref={chapterEndButtonRef}
                type="button"
                onClick={dismissChapterEnd}
              >
                Click to continue
              </button>
            </div>
          </div>
        )}

        {travelingTo && (
          <TravelOverlay
            location={travelingTo.location}
            method={travelingTo.method}
            isNight={travelingTo.isNight}
            weather={displayWeather}
            rainy={travelingTo.rainy}
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

        {pauseOpen && (
          <PauseMenu
            suspended={settingsOpen}
            onResume={() => setPauseOpen(false)}
            onSettings={() => setSettingsOpen(true)}
            onMainMenu={() => {
              setPauseOpen(false);
              setSettingsOpen(false);
              returnToMainMenu();
            }}
          />
        )}
        {settingsOpen && <SettingsScreen onBack={() => setSettingsOpen(false)} />}
        <AutosaveIndicator />

        {newDayAnnouncement && morningCard && (
          <DayCard
            line={morningCard.line}
            count={morningCard.count}
            onDone={dismissNewDayAnnouncement}
          />
        )}
      </div>
    </main>
  );
}
