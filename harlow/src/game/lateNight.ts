/**
 * One late-night check for both clocks.
 *
 * Tired (03:00–07:00, `isLateNight`) blocks new places, talks, and looking
 * around. Waiting is only locked from 03:30–07:00. Walks and other allowed
 * actions still spend their full time. Exits, the way home, and Go to sleep
 * stay available for the whole tired window, including 03:15 and 03:45.
 */

export const TIRED_START = 180;
export const TIRED_END = 420;
export const WAITING_LOCK_START = 210;

/** 03:00 until 07:00. This is the gate that stranded the playtester at 03:23. */
export function isTiredWindow(time: number) {
  return time >= TIRED_START && time < TIRED_END;
}

/** 03:30 until 07:00. Waiting is free again at morning, not locked until midnight. */
export function isWaitingLocked(time: number) {
  return time >= WAITING_LOCK_START && time < TIRED_END;
}

/**
 * Minutes an allowed action spends. The 03:30 lock does not shorten a walk.
 * Before Mom is talked to, time still stops at 08:59.
 */
export function actionMinutes(
  time: number,
  requested: number,
  momTalked: boolean,
  completingMomQuest = false,
) {
  if (momTalked || completingMomQuest) return requested;
  return Math.min(requested, Math.max(0, 539 - time));
}

/**
 * Waiting cannot step into the 03:30 lock. A wait at 03:20 stops at 03:30.
 * After 07:00 the next lock is 03:30 the next morning.
 */
export function waitingMinutesAllowed(time: number, requested: number) {
  if (requested <= 0 || isWaitingLocked(time)) return 0;
  const untilLock = time < WAITING_LOCK_START
    ? WAITING_LOCK_START - time
    : 1440 - time + WAITING_LOCK_START;
  return Math.min(requested, untilLock);
}

/**
 * Steps from Ethan's bed. A late-night move is allowed only when it gets
 * closer. Same-room looking and walking somewhere new are not.
 */
const SCENE_DISTANCE: Record<string, number> = {
  "ethan-room": 0,
  "ethan-room-desk": 1,
  "ethan-room-desk-empty": 1,
  "hallway-upstairs": 1,
  "hallway-upstairs-attic-open": 1,
  "mom-room": 2,
  "emily-room": 2,
  attic: 2,
  hallway: 2,
  kitchen: 3,
  "living-room": 3,
  bathroom: 3,
  basement: 3,
  garage: 3,
  "front-yard": 3,
  // One step out from the yard, with the backyard and the light pole.
  // Home is closer. The light pole and the Elrod house are not.
  street: 4,
  "living-room-relaxing": 4,
  "made-coffee": 4,
  fridge: 4,
  "back-yard": 4,
  "light-pole": 4,
  "garage-bench": 4,
  "garage-bench-empty": 4,
  "elrod-house": 8,
  "needle-and-groove": 8,
  "gas-station": 8,
  scrapyard: 8,
  "police-station": 8,
  cementary: 8,
  hospital: 8,
  "bus-stop": 8,
  motel: 8,
  diner: 8,
  sanatorium: 8,
  "diner-inside": 9,
  "needle-and-groove-inside": 9,
  "gas-station-inside": 9,
  "gas-station-garage": 9,
  "scrapyard-inside": 9,
  "police-station-inside": 9,
  "cementary-inside": 9,
  "hospital-reception": 9,
  "motel-inside": 9,
  "sanatorium-entrance": 9,
  "needle-and-groove-backroom": 10,
  "scrapyard-desk": 10,
  "scrapyard-desk-empty": 10,
  "sheriff-office": 10,
  "cementary-backside": 10,
  "hospital-elevator": 10,
  "motel-room-203": 10,
  "sanatorium-main-floor": 10,
  "hospital-room-312": 11,
  "sanatorium-hallway": 11,
  "sanatorium-room-1": 12,
  "sanatorium-room-2": 12,
};

export function sceneDistance(sceneId: string) {
  const distance = SCENE_DISTANCE[sceneId];
  if (distance === undefined) {
    throw new Error(`No late-night distance for ${sceneId}`);
  }
  return distance;
}

/** The hill path. Deeper rooms are farther from bed, so the distance rule would lock them. */
const SANATORIUM_SCENE_IDS = new Set([
  "sanatorium",
  "sanatorium-entrance",
  "sanatorium-main-floor",
  "sanatorium-hallway",
  "sanatorium-room-1",
  "sanatorium-room-2",
]);

export function lateNightChoiceAllowed(
  choice: {
    action?: string;
    nextScene?: string;
    response?: unknown;
    endsConversation?: boolean;
  },
  ctx: { time: number; sceneId: string; lightOnTheHillActive?: boolean },
) {
  if (!isTiredWindow(ctx.time)) return true;

  // An open talk can be left. Starting or continuing one cannot.
  if (choice.response !== undefined) {
    return Boolean(choice.endsConversation);
  }

  if (choice.action === "goToSleep") {
    return ctx.sceneId === "ethan-room";
  }

  // The hill is only there after dark, including the hours Ethan is otherwise
  // too tired to wander. Looking from his own yard does not count as going out.
  if (choice.action === "lookAtSanatoriumHill") return true;

  const next = choice.nextScene;
  // Light on the Hill stays playable through the 03:00 lock, and through the
  // 03:30 waiting lock. A walk that leaves after 02:00 arrives after 03:00,
  // and by morning the cigarette is gone.
  if (
    ctx.lightOnTheHillActive
    && (
      SANATORIUM_SCENE_IDS.has(ctx.sceneId)
      || (next !== undefined && SANATORIUM_SCENE_IDS.has(next))
    )
  ) {
    return true;
  }

  if (!next || next === ctx.sceneId) return false;
  return sceneDistance(next) < sceneDistance(ctx.sceneId);
}
