import type { Choice } from "../choices";

// Listed times feed the town map and the walk and bus choices.
// Add an exterior scene here after it has been added to `scenes`.
const exteriorDestinations = [
  { id: "front-yard", label: "your house", walkMinutes: 30 },
  { id: "needle-and-groove", label: "Needle & Groove", walkMinutes: 30 },
  { id: "gas-station", label: "the gas station", walkMinutes: 30 },
  { id: "police-station", label: "the police station", walkMinutes: 30 },
  { id: "hospital", label: "the hospital", walkMinutes: 35 },
  { id: "motel", label: "the motel", walkMinutes: 40 },
  { id: "cementary", label: "the cemetery", walkMinutes: 35 },
  { id: "diner", label: "the diner", walkMinutes: 25 },
  { id: "scrapyard", label: "the scrapyard", walkMinutes: 40 },
  { id: "sanatorium", label: "the sanatorium", walkMinutes: 40 },
];

export function isExteriorScene(sceneId: string): boolean {
  // Used by the page to decide whether to show travel controls.
  return (
    sceneId === "bus-stop" ||
    sceneId === "street" ||
    exteriorDestinations.some((destination) => destination.id === sceneId)
  );
}

export function listedWalkMinutes(sceneId: string) {
  return exteriorDestinations.find((destination) => destination.id === sceneId)?.walkMinutes ?? 0;
}

/** Each pair uses the longer of the two listed times, so the walk back matches. */
export function symmetricWalkMinutes(originId: string, destinationId: string) {
  return Math.max(listedWalkMinutes(originId), listedWalkMinutes(destinationId));
}

export function createWalkingChoices(
  originId: string,
  availableDestinationIds: readonly string[],
): Choice[] {
  // Generates choices instead of repeating travel links in every exterior scene.
  return exteriorDestinations
    .filter(
      (destination) =>
        destination.id !== originId &&
        availableDestinationIds.includes(destination.id),
    )
    .map((destination) => {
      const minutes = symmetricWalkMinutes(originId, destination.id);
      return {
        label: `Walk to ${destination.label} (${minutes} min)`,
        action: `walkTo${destination.id}`,
        nextScene: destination.id,
        timeCost: minutes,
        travel: true,
      };
    });
}

export function createBusChoices(
  availableDestinationIds: readonly string[],
): Choice[] {
  // Bus pricing and travel time are defined here for every destination.
  return exteriorDestinations
    .filter((destination) => availableDestinationIds.includes(destination.id))
    .map((destination) => ({
      label: `Take the bus to ${destination.label} ($7, 10 min)`,
      action: `takeBusTo${destination.id}`,
      nextScene: destination.id,
      timeCost: 10,
      travel: true,
      effects: { money: -7 },
      requirements: { money: 7 },
    }));
}
