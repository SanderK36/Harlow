import { RAIN_WEATHER } from "@/game/scene/weather";
import { isNightTime } from "@/game/utils";

/** Looping beds. Each one is a file in public/sounds/. */
export type AmbienceSlot = "rain" | "night" | "sanatorium-drone" | "diner" | "house";

const RAIN = new Set<string>(RAIN_WEATHER);

/** Ethan's house. Yards and the street stay outside so they can take rain or night. */
const HOUSE_SCENES = new Set([
  "hallway",
  "hallway-upstairs",
  "hallway-upstairs-attic-open",
  "made-coffee",
  "living-room",
  "living-room-relaxing",
  "kitchen",
  "fridge",
  "bathroom",
  "ethan-room",
  "ethan-room-desk",
  "ethan-room-desk-empty",
  "mom-room",
  "emily-room",
  "attic",
  "basement",
  "garage",
  "garage-bench",
  "garage-bench-empty",
]);

/**
 * Which looping bed fits this scene. Null is silence (a sunny afternoon
 * with no room tone of its own). Rain still falls from the weather bed
 * when the file for `rain` is missing.
 */
export function ambienceSlotForScene(
  sceneId: string,
  weather: string,
  timeMinutes: number,
): AmbienceSlot | null {
  if (sceneId.startsWith("sanatorium")) return "sanatorium-drone";
  if (sceneId === "diner" || sceneId === "diner-inside") return "diner";
  if (HOUSE_SCENES.has(sceneId)) return "house";
  if (RAIN.has(weather)) return "rain";
  if (isNightTime(timeMinutes)) return "night";
  return null;
}
