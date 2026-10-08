import { storyEntryApplies } from "../story";
import type { DayOfWeek, Weather } from "../types";
import {
  attic,
  basement,
  bathroom,
  emilyRoom,
  ethanRoom,
  ethanRoomDesk,
  ethanRoomDeskEmpty,
  fridge,
  garage,
  garageBench,
  garageBenchEmpty,
  hallway,
  kitchen,
  livingRoom,
  livingRoomRelaxing,
  madeCoffee,
  momRoom,
  upstairsHallway,
  upstairsHallwayAtticOpen,
} from "./home";
import { backYard, elrodHouse, frontYard, lightPole, street } from "./outdoors";
import {
  gasStation,
  gasStationGarage,
  gasStationInside,
  needleAndGroove,
  needleAndGrooveBackroom,
  needleAndGrooveInside,
  scrapyard,
  scrapyardDesk,
  scrapyardDeskEmpty,
  scrapyardInside,
} from "./work";
import {
  busStop,
  cementary,
  cementaryBackside,
  cementaryInside,
  diner,
  dinerInside,
  hospital,
  hospitalElevator,
  hospitalReception,
  hospitalRoom312,
  motel,
  motelInside,
  motelRoom203,
  policeStation,
  policeStationInside,
  sheriffOffice,
} from "./town";
import {
  sanatorium,
  sanatoriumEntrance,
  sanatoriumHallway,
  sanatoriumMainFloor,
  sanatoriumRoom1,
  sanatoriumRoom2,
} from "./sanatorium";

export function getSceneThought(
  sceneId: string,
  time: number,
  weather: Weather,
  day?: DayOfWeek,
) {
  const scene = scenes[sceneId as keyof typeof scenes];

  if (!scene) {
    return null;
  }

  // The first thought whose time, weather, and weekday match is shown, so
  // weather lines are listed before a scene's everyday thought.
  const thoughtEntry = scene.story.find(
    (entry) =>
      entry.type === "thought" && storyEntryApplies(entry, time, weather, day),
  );

  return thoughtEntry?.type === "thought" ? thoughtEntry.text : null;
}

// ----------------------------------------
// SCENE LIST
// ----------------------------------------

export const scenes = {
  hallway,
  "hallway-upstairs": upstairsHallway,
  "hallway-upstairs-attic-open": upstairsHallwayAtticOpen,
  "made-coffee": madeCoffee,
  "front-yard": frontYard,
  street,
  "elrod-house": elrodHouse,
  "light-pole": lightPole,
  "back-yard": backYard,
  "living-room": livingRoom,
  "living-room-relaxing": livingRoomRelaxing,
  kitchen,
  fridge,
  bathroom,
  "ethan-room": ethanRoom,
  "ethan-room-desk": ethanRoomDesk,
  "ethan-room-desk-empty": ethanRoomDeskEmpty,
  "mom-room": momRoom,
  "emily-room": emilyRoom,
  attic,
  basement,
  garage,
  "garage-bench": garageBench,
  "garage-bench-empty": garageBenchEmpty,
  "needle-and-groove": needleAndGroove,
  "needle-and-groove-inside": needleAndGrooveInside,
  "needle-and-groove-backroom": needleAndGrooveBackroom,
  "gas-station": gasStation,
  "gas-station-inside": gasStationInside,
  "gas-station-garage": gasStationGarage,
  scrapyard,
  "scrapyard-inside": scrapyardInside,
  "scrapyard-desk": scrapyardDesk,
  "scrapyard-desk-empty": scrapyardDeskEmpty,
  "police-station": policeStation,
  "police-station-inside": policeStationInside,
  "sheriff-office": sheriffOffice,
  cementary,
  "cementary-inside": cementaryInside,
  "cementary-backside": cementaryBackside,
  hospital,
  "hospital-reception": hospitalReception,
  "hospital-elevator": hospitalElevator,
  "hospital-room-312": hospitalRoom312,
  "bus-stop": busStop,
  motel,
  "motel-inside": motelInside,
  "motel-room-203": motelRoom203,
  diner,
  "diner-inside": dinerInside,
  sanatorium,
  "sanatorium-entrance": sanatoriumEntrance,
  "sanatorium-main-floor": sanatoriumMainFloor,
  "sanatorium-hallway": sanatoriumHallway,
  "sanatorium-room-1": sanatoriumRoom1,
  "sanatorium-room-2": sanatoriumRoom2,
};
