"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";

import GameStatus from "@/components/GameStatus/GameStatus";
import ActionList from "@/components/ActionList/ActionList";
import ActionButton from "@/components/ActionButton/ActionButton";
import StatsWindow from "@/components/StatsWindow/StatsWindow";
import StoryLog from "@/components/StoryLog/StoryLog";
import CharacterLine from "@/components/CharacterLine/CharacterLine";
import TravelOverlay from "@/components/TravelOverlay/TravelOverlay";
import TravelWindow from "@/components/TravelWindow/TravelWindow";
import InventoryWindow from "@/components/InventoryWindow/InventoryWindow";
import ShopWindow from "@/components/ShopWindow/ShopWindow";
import GameMenu from "@/components/GameMenu/GameMenu";
import CharacterWindow from "@/components/CharacterWindow/CharacterWindow";
import QuestWindow from "@/components/QuestWindow/QuestWindow";

import { isNightTime } from "@/game/utils";
import { useGame } from "@/game/useGame";
import { isExteriorScene } from "@/game/scenes";
import { clearSessionSave, readSessionSave } from "@/game/save";
import type { Choice } from "@/game/choices";

function subscribeToSession() {
  return () => {};
}

function hasActiveSession() {
  return readSessionSave() !== null;
}

const hotspotLabels: Record<string, string> = {
  lookAtDesk: "Desk",
  pickUpCigarettes: "Cigarettes",
  goLivingRoom: "Living room",
  talkToMom: "Talk to mom",
  relaxOnCouch: "Relax on the couch",
  goKitchen: "Kitchen",
  checkFridge: "Check the fridge",
  makeCoffee: "Make some coffee",
  lookAtGarageBench: "Workbench",
  pickUpGarageFlashlight: "Flashlight",
  goHallway: "Hallway",
  enterGasStation: "Enter gas station",
  talkToRay: "Ray",
  enterNeedleAndGroove: "Enter shop",
  talkToJohnny: "Johnny",
  enterNeedleAndGrooveBackroom: "Backroom",
  enterPoliceStation: "Enter station",
  leavePoliceStation: "Go outside",
  enterHospital: "Enter hospital",
  goToMarleneCounter: "Reception desk",
  talkToMarlene: "Marlene",
  goToHospitalRoom: "Elevator",
  enterScrapyard: "Garage",
  lookAtScrapyardDesk: "Workbench",
  takeScrapyardKnife: "Knife",
  leaveScrapyard: "Exit garage",
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
};

const sanatoriumHotspotActions: Record<string, string[]> = {
  sanatorium: ["approachSanatorium"],
  "sanatorium-entrance": ["enterSanatorium"],
  "sanatorium-main-floor": ["enterSanatoriumHallway", "leaveSanatorium"],
  "sanatorium-hallway": ["enterSanatoriumRoom1", "enterSanatoriumRoom2", "leaveSanatoriumHallway"],
  "sanatorium-room-1": ["leaveSanatoriumRoom1"],
  "sanatorium-room-2": ["leaveSanatoriumRoom2"],
};

export default function Home() {
  // Restore the session until the player explicitly chooses a screen.
  // Returning to the menu must override the session detected on refresh.
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);
  const resumedSession = useSyncExternalStore(subscribeToSession, hasActiveSession, () => false);
  const [showCharacterDirectory, setShowCharacterDirectory] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showProductionSplash, setShowProductionSplash] = useState(false);
  const {
    gameState,
    playerState,
    currentScene,
    currentThought,
    currentEffects,
    conversation,
    conversationActive,
    activeChoices,
    activeCharacter,
    showStats,
    setShowStats,
    showInventory,
    setShowInventory,
    handleChoice,
    wait,
    travelingTo,
    showTravel,
    setShowTravel,
    walkingChoices,
    busChoices,
    goToBusStop,
    activeShop,
    setActiveShop,
    job,
    jobQuestTarget,
    momJobConcernHeard,
    questNotification,
    buyItem,
    saveGame,
    loadGame,
    loadMostRecentGame,
    startNewGameSession,
  } = useGame();
  const [travelMode, setTravelMode] = useState<"walk" | "bus">("walk");

  function continueGame() {
    if (loadMostRecentGame()) setHasStarted(true);
  }

  function startNewGame() {
    startNewGameSession();
    setHasStarted(true);
    setShowProductionSplash(true);
    window.setTimeout(() => setShowProductionSplash(false), 3400);
  }

  function returnToMainMenu() {
    clearSessionSave();
    setHasStarted(false);
  }

  // Character art has priority, then weather-specific art, then day/night art.
  const sceneImage =
    (isNightTime(gameState.time) && activeCharacter?.nightImage
      ? activeCharacter.nightImage
      : activeCharacter?.image) ??
    currentScene.image.weather?.[gameState.weather] ??
    (isNightTime(gameState.time)
      ? currentScene.image.night
      : currentScene.image.day);
  const hotspotActions =
    sanatoriumHotspotActions[currentScene.id] ?? (
    currentScene.id === "living-room"
      ? activeCharacter?.name === "Linda"
        ? ["talkToMom"]
        : ["relaxOnCouch"]
      : currentScene.id === "ethan-room"
      ? ["lookAtDesk"]
      : currentScene.id === "ethan-room-desk"
        ? ["pickUpCigarettes"]
        : currentScene.id === "hallway"
          ? ["goLivingRoom", "goKitchen"]
          : currentScene.id === "kitchen"
            ? ["checkFridge", "makeCoffee", "goBackYard"]
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
                  ? ["talkToJohnny", "enterNeedleAndGrooveBackroom"]
                  : currentScene.id === "police-station"
                    ? ["enterPoliceStation"]
                    : currentScene.id === "police-station-inside"
                      ? ["leavePoliceStation"]
                      : currentScene.id === "hospital"
                        ? ["enterHospital"]
                        : currentScene.id === "hospital-reception"
                          ? ["goToMarleneCounter", "talkToMarlene", "goToHospitalRoom"]
                          : currentScene.id === "scrapyard"
                            ? ["enterScrapyard"]
                            : currentScene.id === "scrapyard-inside"
                              ? ["talkToBigRoy", "lookAtScrapyardDesk", "leaveScrapyard"]
                              : currentScene.id === "scrapyard-desk"
                                ? ["takeScrapyardKnife"]
                                : currentScene.id === "cementary"
                                  ? ["enterCemetery", "goCemeteryBackside"]
                                  : currentScene.id === "cementary-inside"
                                    ? ["goCemeteryBackside"]
                                    : currentScene.id === "cementary-backside"
                                      ? ["leaveCemeteryBackside"]
                                      : currentScene.id === "motel"
                                        ? ["enterMotel"]
                                        : currentScene.id === "motel-inside"
                                          ? ["leaveMotel", "talkToEarl"]
                                          : currentScene.id === "front-yard"
                                            ? ["goBackYard", "goHome", "enterGarage"]
                                            : currentScene.id === "light-pole"
                                              ? ["chooseNeedleGrooveJob", "chooseGasStationJob", "chooseScrapyardJob"]
                                            : []);
  const sceneHotspots = activeChoices.filter(
    (choice): choice is Choice =>
      "action" in choice &&
      (hotspotActions.includes(choice.action) || !!choice.hotspots?.length)
  );
  const choicesWithoutHotspotActions = activeChoices.filter(
    (choice) =>
      "response" in choice ||
      (!hotspotActions.includes(choice.action) && !choice.hotspots?.length)
  );

  if (!(hasStarted ?? resumedSession)) {
    return (
      <main className="mainMenu">
        <div className="mainMenuArtwork" aria-hidden="true" />
        <div className="mainMenuShade" aria-hidden="true" />
        <div className="mainMenuBranding">
          <Image
            className="mainMenuStudioLogo"
            src="/LostFrequencyGames-transparent.png"
            alt="Lost Frequency Games"
            width={1254}
            height={1254}
          />
          <a
            className="mainMenuSocialLink"
            href="https://x.com/HarlowTheGame"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Harlow: 1982 on X"
          >
            <Image
              src="/X.png"
              alt=""
              width={1500}
              height={1500}
            />
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
        <div className="production-splash" role="status" aria-label="A Lost Frequency Games production">
          <Image
            src="/LostFrequencyGames-transparent.png"
            alt="Lost Frequency Games"
            width={1254}
            height={1254}
            className="production-splash-logo"
          />
          <p>A Lost Frequency Games Production</p>
        </div>
      )}
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
          onOpenQuests={() => setShowQuestLog(true)}
          onMainMenu={returnToMainMenu}
          onSave={saveGame}
          onLoad={loadGame}
        />
        
        <GameStatus
          player={playerState}
          gameState={gameState}
          onStatsClick={() => setShowStats(true)}
          onInventoryClick={() => setShowInventory(true)}
        />

        <div className={`scene-image-frame scene-image-frame-${currentScene.id}`}>
          <img
            key={sceneImage}
            src={sceneImage}
            alt=""
            className="scene-image"
          />
          <div className="scene-info-panel">
            {currentThought && (
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
            )}

            <StoryLog
              entries={currentScene.story.filter(
                (entry) => entry.type !== "thought"
              )}
              title="Scene"
              variant="narration"
              layout="combined"
            />
          </div>
          {sceneHotspots.flatMap((sceneHotspot) =>
            (sceneHotspot.hotspots ?? [undefined]).map((region, index) => (
            <button
              key={`${sceneHotspot.action}-${index}`}
              type="button"
              className={`scene-hotspot scene-hotspot-${sceneHotspot.action} scene-hotspot-${currentScene.id}-${sceneHotspot.action}`}
              style={region ? {
                left: `${region.left}%`,
                top: `${region.top}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
              } : undefined}
              aria-label={hotspotLabels[sceneHotspot.action] ?? sceneHotspot.label}
              onClick={() => handleChoice(sceneHotspot)}
            >
              <span>{hotspotLabels[sceneHotspot.action] ?? sceneHotspot.label}</span>
            </button>
            ))
          )}

          <ActionList
            title={
              conversationActive
                ? "What do you say?"
                : "What do you want to do?"
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
        </div>

        {conversationActive && conversation.length > 0 && (
          <StoryLog
            entries={conversation}
            title="Conversation"
            variant="conversation"
          />
        )}

        {showStats && (
          <StatsWindow
            player={playerState}
            onClose={() =>
              setShowStats(false)
            }
          />
        )}
        {showInventory && (
          <InventoryWindow
          inventory={playerState.inventory}
          onClose={() =>
            setShowInventory(false)
          }
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
            job={job}
            jobQuestTarget={jobQuestTarget}
            momJobConcernHeard={momJobConcernHeard}
            onClose={() => setShowQuestLog(false)}
          />
        )}
        {questNotification && (
          <div className="quest-notification" role="status">
            <span>Quest started</span>
            <p>{questNotification}</p>
          </div>
        )}

        {showTravel && (
          <TravelWindow
            walkingChoices={walkingChoices}
            busChoices={busChoices}
            onChoice={handleChoice}
            onClose={() =>
              setShowTravel(false)
            }
            onTravelStart={() =>
              setShowTravel(false)
            }
            playerMoney={playerState.money}
            initialMenu={travelMode}
          />
        )}

        <div className="waitControls">
          <span>Pass time</span>
          <ActionButton
            label="Wait 1 min"
            onClick={() => wait(1)}
          />

          <ActionButton
            label="Wait 5 min"
            onClick={() => wait(5)}
          />

          <ActionButton
            label="Wait 10 min"
            onClick={() => wait(10)}
          />

          <ActionButton
            label="Wait 30 min"
            onClick={() => wait(30)}
          />

          <ActionButton
            label="Wait 1 hour"
            onClick={() => wait(60)}
          />
        </div>

        {travelingTo && (
          <TravelOverlay
            location={travelingTo.location}
            method={travelingTo.method}
            isNight={travelingTo.isNight}
          />
        )}

      </div>
    </main>
  );
}
