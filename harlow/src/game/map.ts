import type { Choice } from "./choices";
import { isTiredWindow, lateNightChoiceAllowed } from "./lateNight";
import {
  createBusChoices,
  createWalkingChoices,
  listedWalkMinutes,
  symmetricWalkMinutes,
} from "./scene/travel";

export const MOM_MAP_THOUGHT = "I should talk to Mom.";
export const LATE_NIGHT_MAP_THOUGHT = "That can wait till morning. I'm beat.";

/**
 * Story lines for pins that stay closed after Talk to Mom, outside the
 * 03:00–07:00 lock. Home, the hospital, and Margaret's Diner have no entry:
 * they open once those two gates allow them.
 *
 * Before Talk to Mom every pin uses MOM_MAP_THOUGHT.
 * From 03:00 until 07:00 every non-home pin uses LATE_NIGHT_MAP_THOUGHT,
 * unless that pin is open (the sanatorium while Light on the Hill is active).
 */
export const CLOSED_LOCATION_THOUGHTS: Record<string, string> = {
  "police-station": "No reason to walk into a police station.",
  sanatorium: "Nobody goes up there. Not since it closed.",
  "needle-and-groove": "Can't afford records. That's sort of the problem.",
  "gas-station": "Nothing there for me but a candy bar I can't pay for.",
  scrapyard: "Rust and junkyard dogs. Not today.",
  motel: "The motel's for people passing through. I'm not.",
  cementary: "Not today. The dead can wait.",
};

export type MapLabelSide = "top" | "bottom" | "left" | "right";

/** One pin per place Ethan grew up knowing. No Elrod house, no light pole. */
export const MAP_PINS = [
  { id: "sanatorium", label: "Sanatorium", x: 14, y: 14, labelSide: "right" },
  { id: "cementary", label: "Cemetery", x: 62, y: 13, labelSide: "right" },
  { id: "needle-and-groove", label: "Needle & Groove", x: 24, y: 32, labelSide: "bottom" },
  { id: "police-station", label: "Police Station", x: 46, y: 30, labelSide: "left" },
  { id: "hospital", label: "Hospital", x: 84, y: 28, labelSide: "left" },
  { id: "diner", label: "Margaret's Diner", x: 50, y: 48, labelSide: "top" },
  { id: "gas-station", label: "Gas Station", x: 70, y: 50, labelSide: "bottom" },
  { id: "front-yard", label: "Home", x: 16, y: 78, labelSide: "right" },
  { id: "motel", label: "Motel", x: 90, y: 64, labelSide: "left" },
  { id: "scrapyard", label: "Scrapyard", x: 40, y: 84, labelSide: "top" },
] as const;

export type MapPinId = (typeof MAP_PINS)[number]["id"];

/** Where Ethan stands when the scene is not itself a pin. */
export const MAP_MARKERS = {
  street: { x: 22, y: 62 },
  "bus-stop": { x: 36, y: 48 },
} as const;

export type MapContext = {
  originId: string;
  time: number;
  momTalked: boolean;
  lightOnTheHillActive: boolean;
  availableIds: readonly string[];
};

export type MapPinView = {
  id: MapPinId;
  label: string;
  x: number;
  y: number;
  labelSide: MapLabelSide;
  listedWalkMinutes: number;
  /** Minutes this trip actually costs from where Ethan is standing. */
  walkMinutes: number;
  here: boolean;
  open: boolean;
  thought: string | null;
};

export function markerPosition(sceneId: string) {
  const pin = MAP_PINS.find((item) => item.id === sceneId);
  if (pin) return { x: pin.x, y: pin.y };
  if (sceneId in MAP_MARKERS) return MAP_MARKERS[sceneId as keyof typeof MAP_MARKERS];
  return { x: 50, y: 50 };
}

export function mapTripChoice(
  originId: string,
  destinationId: string,
  mode: "walk" | "bus",
  availableIds: readonly string[],
): Choice | null {
  const choices = mode === "walk"
    ? createWalkingChoices(originId, availableIds)
    : createBusChoices(availableIds);
  return choices.find((choice) => choice.nextScene === destinationId) ?? null;
}

/** Open when travelDestinationIds lists it and lateNightChoiceAllowed agrees. */
export function mapPinOpen(pinId: string, ctx: MapContext) {
  if (pinId === ctx.originId) return false;
  if (!ctx.momTalked) return false;
  if (!ctx.availableIds.includes(pinId)) return false;
  const walk = mapTripChoice(ctx.originId, pinId, "walk", ctx.availableIds);
  if (!walk) return false;
  return lateNightChoiceAllowed(walk, {
    time: ctx.time,
    sceneId: ctx.originId,
    lightOnTheHillActive: ctx.lightOnTheHillActive,
  });
}

export function closedPinThought(pinId: string, ctx: MapContext): string | null {
  if (pinId === ctx.originId) return null;
  if (mapPinOpen(pinId, ctx)) return null;
  if (!ctx.momTalked) return MOM_MAP_THOUGHT;
  if (isTiredWindow(ctx.time) && pinId !== "front-yard") return LATE_NIGHT_MAP_THOUGHT;
  return CLOSED_LOCATION_THOUGHTS[pinId] ?? null;
}

export function mapPinViews(ctx: MapContext): MapPinView[] {
  return MAP_PINS.map((pin) => {
    const here = pin.id === ctx.originId;
    return {
      id: pin.id,
      label: pin.label,
      x: pin.x,
      y: pin.y,
      labelSide: pin.labelSide,
      listedWalkMinutes: listedWalkMinutes(pin.id),
      walkMinutes: here ? 0 : symmetricWalkMinutes(ctx.originId, pin.id),
      here,
      open: mapPinOpen(pin.id, ctx),
      thought: closedPinThought(pin.id, ctx),
    };
  });
}

export function mapPinsByWalkTime(pins: readonly MapPinView[]) {
  return [...pins].sort(
    (a, b) => a.walkMinutes - b.walkMinutes || a.label.localeCompare(b.label),
  );
}
