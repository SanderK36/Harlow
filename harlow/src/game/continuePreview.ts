import { sceneWeatherPlate } from "@/game/scenePlate";
import { scenes } from "@/game/scenes";
import type { SavedGame } from "@/game/save";
import { formatTime } from "@/game/utils";

export type ContinuePreview = {
  location: string;
  weekday: string;
  time: string;
  thumbnail: string | null;
};

/** What the Continue card shows: where you were, when, and the scene plate. */
export function continuePreview(save: SavedGame): ContinuePreview {
  const scene = scenes[save.currentSceneId as keyof typeof scenes];
  return {
    location: save.gameState.location,
    weekday: save.gameState.dayOfWeek,
    time: formatTime(save.gameState.time),
    thumbnail: scene
      ? sceneWeatherPlate(scene, save.gameState.time, save.gameState.weather)
      : null,
  };
}
