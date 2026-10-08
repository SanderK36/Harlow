import type { SceneCharacter } from "@/game/scenes";
import { RAIN_WEATHER, SANATORIUM_ONE_WINDOW, sanatoriumShowsOneWindow, type Scene } from "@/game/scenes";
import { elrodRachelPlate, isRainPlate } from "@/game/scenePlate";
import type { QuestProgress, StoryFlag } from "@/game/quests";
import type { Weather } from "@/game/types";
import { isNightTime } from "@/game/utils";

export function resolveSceneArt(input: {
  scene: Scene;
  time: number;
  weather: Weather;
  dayOfWeek: string;
  storyFlags: Partial<Record<StoryFlag, boolean>>;
  activeCharacter: SceneCharacter | undefined;
  quests: QuestProgress[];
  sceneIsIndoor: boolean;
  hasConversationOverlay: boolean;
}) {
  const { scene, time, weather } = input;
  const sceneIsNight = isNightTime(time);
  const isWeekend = input.dayOfWeek === "Saturday" || input.dayOfWeek === "Sunday";
  const momInKitchen =
    scene.id === "kitchen" &&
    ((time >= 450 && time < 540)
      || (isWeekend && time >= 720 && time < 1140));
  // Daylit weather art (weatherDayOnly) gives way to the night art after dark.
  // Night weather art (weatherNightOnly) gives way to the day art before dark.
  const weatherImage =
    (sceneIsNight && scene.image.weatherDayOnly)
    || (!sceneIsNight && scene.image.weatherNightOnly)
      ? undefined
      : scene.image.weather?.[weather];
  // Elrod: Rachel is painted into the daytime art until she's met. Her rain
  // and thunder plates are daylit too, so after dark the night plate shows.
  // During her talk the empty house is the backdrop so she isn't on screen twice.
  const elrodWithRachel =
    scene.id === "elrod-house"
    && !input.storyFlags.rachelMet
    && time >= 420
    && time < 1140;
  const elrodRachel = elrodWithRachel
    ? elrodRachelPlate(time, weather)
    : null;
  const sanatoriumCigaretteRoom =
    scene.id === "sanatorium-room-2"
    && isNightTime(time)
    && !input.storyFlags.sanatoriumCigaretteSeen;
  const royRainy =
    scene.id === "scrapyard-inside"
    && input.activeCharacter?.name === "Big Roy"
    && RAIN_WEATHER.includes(weather)
    && !isNightTime(time);
  const rayRainy =
    scene.id === "gas-station-inside"
    && input.activeCharacter?.name === "Ray Mercer"
    && RAIN_WEATHER.includes(weather)
    && !isNightTime(time);
  const walterRainy =
    scene.id === "sheriff-office"
    && input.activeCharacter?.name === "Walter Harrington"
    && RAIN_WEATHER.includes(weather)
    && !isNightTime(time);
  const hillCompleted = input.quests.some(
    (quest) => quest.id === "light-on-the-hill" && quest.status === "completed",
  );
  const sanatoriumOneWindow =
    scene.id === "sanatorium"
    && sanatoriumShowsOneWindow(time, hillCompleted);
  const sanatoriumDark =
    scene.id === "sanatorium"
    && isNightTime(time)
    && hillCompleted;
  const emptySceneImage =
    sanatoriumCigaretteRoom
      ? "./images/locations/sanatorium/sanatoriumRoom2NightCigarette.png"
      : sanatoriumOneWindow
        ? SANATORIUM_ONE_WINDOW
      : weatherImage ??
    (isNightTime(time)
      ? scene.image.night
      : scene.image.day);
  // In a conversation the speaker stands in front as a portrait, so the scene
  // behind swaps to its empty variant rather than showing them twice.
  const sceneImage = momInKitchen
    ? RAIN_WEATHER.includes(weather)
      ? "./images/locations/home/momMorningKitchen-rain.jpg"
      : "./images/locations/home/momMorningKitchen.png"
    : royRainy
      ? "./images/locations/scrapyard/bigRoyWorkingRainy.png"
    : rayRainy
      ? "./images/locations/gas_station/rayMercerGasStationRainy.png"
    : walterRainy
      ? "./images/locations/police_station/WalterHarringtonOfficeRain.jpg"
    : elrodWithRachel || elrodRachel
      ? weather === "Thunderstorm"
        ? "./images/locations/ElrodHouse/ElrodHouseRachelOutsideThunder.png"
        : RAIN_WEATHER.includes(weather)
          ? "./images/locations/ElrodHouse/ElrodHouseRachelOutsideRainy.png"
          : "./images/locations/ElrodHouse/ElrodHouseRachelOutsideDay.png"
    : ((isNightTime(time) && input.activeCharacter?.nightImage
        ? input.activeCharacter.nightImage
        : input.activeCharacter?.image) ?? emptySceneImage);
  const conversationBackdrop =
    input.hasConversationOverlay && emptySceneImage && emptySceneImage !== sceneImage
      ? emptySceneImage
      : null;
  // The filter follows the plate on screen, not the scene's weather map.
  // A rainy day plate keeps the scene dry-looking once night art takes over.
  const interimRain =
    RAIN_WEATHER.includes(weather)
    && !input.sceneIsIndoor
    && scene.id !== "front-yard"
    && !isRainPlate(sceneImage, scene, weather);
  const interimRainNight = interimRain && isNightTime(time);
  const syntheticNight = isNightTime(time) && Boolean(scene.image.noNightVariant);

  return {
    momInKitchen,
    weatherImage,
    hillCompleted,
    sanatoriumDark,
    sceneImage,
    conversationBackdrop,
    interimRain,
    interimRainNight,
    syntheticNight,
  };
}
