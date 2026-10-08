import { RAIN_WEATHER, type Scene } from "@/game/scenes";
import type { Weather } from "@/game/types";
import { isNightTime } from "@/game/utils";

const ELROD_RACHEL_DAY = "./images/locations/neighbourhood/ElrodHouse/ElrodHouseRachelOutsideDay.png";
const ELROD_RACHEL_RAIN = "./images/locations/neighbourhood/ElrodHouse/ElrodHouseRachelOutsideRainy.png";
const ELROD_RACHEL_THUNDER = "./images/locations/neighbourhood/ElrodHouse/ElrodHouseRachelOutsideThunder.png";

/**
 * Rachel is painted into the daytime Elrod plates until 19:00.
 * Those plates are daylit, including the rain and thunder ones, so after
 * dark the caller uses the empty house (the night plate).
 */
export function elrodRachelPlate(time: number, weather: Weather) {
  if (isNightTime(time)) return null;
  if (weather === "Thunderstorm") return ELROD_RACHEL_THUNDER;
  if (RAIN_WEATHER.includes(weather)) return ELROD_RACHEL_RAIN;
  return ELROD_RACHEL_DAY;
}

/** Public URL for a scene plate stored as `./images/...`. */
export function plateUrl(path: string) {
  return path.replace(/^\.\//, "/");
}

/**
 * Day / night / weather plate, ignoring characters painted on top.
 * Daylit weather art (weatherDayOnly) gives way to the night plate after dark.
 * Night weather art (weatherNightOnly) gives way to the day plate before dark.
 */
export function sceneWeatherPlate(scene: Scene, time: number, weather: Weather) {
  const night = isNightTime(time);
  const mapped = (night && scene.image.weatherDayOnly) || (!night && scene.image.weatherNightOnly)
    ? undefined
    : scene.image.weather?.[weather];
  return plateUrl(mapped ?? (night ? scene.image.night : scene.image.day));
}

/** Character plates that are already raining and must not take the interim filter. */
const CHARACTER_RAIN_PLATES = new Set([
  "/images/locations/home/momMorningKitchen-rain.jpg",
  "/images/locations/scrapyard/bigRoyWorkingRainy.png",
  "/images/locations/gas_station/rayMercerGasStationRainy.png",
  "/images/locations/police_station/WalterHarringtonOfficeRain.jpg",
  "/images/locations/neighbourhood/ElrodHouse/ElrodHouseRachelOutsideRainy.png",
  "/images/locations/neighbourhood/ElrodHouse/ElrodHouseRachelOutsideThunder.png",
]);

/**
 * True when `src` is art drawn for this weather.
 * A scene can own rainy day art and still be showing a dry night plate.
 */
export function isRainPlate(src: string, scene: Scene, weather: Weather) {
  const shown = plateUrl(src);
  const mapped = scene.image.weather?.[weather];
  if (mapped && plateUrl(mapped) === shown) return true;
  return CHARACTER_RAIN_PLATES.has(shown);
}
