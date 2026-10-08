import { scenes } from "@/game/scenes";

export const hotspotLabels: Record<string, string> = {
  goToSleep: "Go to sleep",
  playVinyl: "Vinyl player",
  lookAtDesk: "Desk",
  goEthanRoom: "Your room",
  goMomRoom: "Mom's room",
  goEmilyRoom: "Emily's room",
  pickUpCigarettes: "Cigarettes",
  goLivingRoom: "Living room",
  talkToMom: "Talk to Mom",
  watchTv: "Watch TV",
  relaxOnCouch: "Relax on the couch",
  goKitchen: "Kitchen",
  checkFridge: "Check the fridge",
  makeCoffee: "Make some coffee",
  lookAtGarageBench: "Workbench",
  pickUpGarageFlashlight: "Flashlight",
  goHallway: "Hallway",
  goBathroom: "Bathroom",
  openAtticHatch: "Attic hatch",
  goAttic: "Attic stairs",
  enterGasStation: "Enter gas station",
  talkToRay: "Ray",
  enterNeedleAndGroove: "Enter shop",
  talkToJohnny: "Johnny",
  enterNeedleAndGrooveBackroom: "Back room",
  enterPoliceStation: "Enter station",
  leavePoliceStation: "Go outside",
  enterHospital: "Enter hospital",
  goToMarleneCounter: "Reception desk",
  talkToMarlene: "Marlene",
  goToHospitalRoom: "Elevator",
  enterScrapyard: "Enter workshop",
  lookAtScrapyardDesk: "Workbench",
  takeScrapyardKnife: "Knife",
  leaveScrapyard: "Back to the yard",
  talkToBigRoy: "Big Roy",
  enterCemetery: "Enter church",
  goCemeteryBackside: "Back of church",
  leaveCemeteryBackside: "Go back inside",
  enterMotel: "Enter office",
  leaveMotel: "Go outside",
  goBackYard: "Backyard",
  lookAtLightPole: "Light pole",
  goHome: "Go inside",
  goToStreets: "Go to the streets",
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
  goElrodHouse: "Elrod house",
  talkToRachel: "Rachel",
  lookAtElrodTape: "Police tape",
  lookAtDinerBulletin: "Bulletin board",
  lookAtSanatoriumHill: "The hill",
  lookAtSanatoriumCigarette: "Look at the ash",
};

const sanatoriumHotspotActions: Record<string, string[]> = {
  sanatorium: ["approachSanatorium"],
  "sanatorium-entrance": ["enterSanatorium"],
  "sanatorium-main-floor": ["enterSanatoriumHallway", "leaveSanatorium"],
  "sanatorium-hallway": [
    "enterSanatoriumRoom1",
    "enterSanatoriumRoom2",
    "leaveSanatoriumHallway",
  ],
  "sanatorium-room-1": ["leaveSanatoriumRoom1"],
  "sanatorium-room-2": ["leaveSanatoriumRoom2"],
};

const ADMIN_SCENE_NAMES: Record<string, string> = {
  "elrod-house": "Elrod house",
  "ethan-room": "Ethan's room",
  "front-yard": "Front yard",
  street: "Street",
  "sheriff-office": "Sheriff's office",
  "needle-and-groove": "Needle & Groove",
  "gas-station": "Gas station",
  "police-station": "Police station",
  "sanatorium-room-2": "Sanatorium room 2",
  cementary: "Entrance",
  "cementary-inside": "Inside",
  "cementary-backside": "Behind the church",
};

function adminSceneName(id: string) {
  return (
    ADMIN_SCENE_NAMES[id]
    ?? id.replaceAll("cementary", "cemetery").replaceAll("-", " ")
  );
}

export const adminDestinations = Object.values(scenes)
  .map((scene) => ({
    id: scene.id,
    label: `${scene.location} — ${adminSceneName(scene.id)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Open-air scenes beyond the travel destinations, for rain and lightning.
export const OUTDOOR_SCENE_IDS = new Set([
  "back-yard",
  "street",
  "light-pole",
  "cementary-backside",
  "sanatorium-entrance",
  "elrod-house",
]);

/** Which cursor a hotspot gets: look, go, talk or take (see globals.css). */
export function hotspotKind(action: string) {
  if (action.startsWith("talkTo")) return "talk";
  if (action.startsWith("pickUp") || action.startsWith("take")) return "take";
  if (action === "goToSleep") return "inspect";
  if (/^(go|enter|leave|approach)/.test(action)) return "go";
  return "inspect";
}

export function hotspotActionsFor(
  sceneId: string,
  ctx: {
    lindaHere: boolean;
    momInKitchen: boolean;
    momTalked: boolean;
  },
) {
  return (
    sanatoriumHotspotActions[sceneId] ??
    (sceneId === "living-room"
      ? ctx.lindaHere
        ? ["talkToMom", "watchTv"]
        : ["relaxOnCouch", "watchTv"]
      : sceneId === "ethan-room"
        ? ["goToSleep", "playVinyl", "lookAtDesk"]
        : sceneId === "ethan-room-desk"
          ? ["pickUpCigarettes"]
          : sceneId === "hallway"
            ? ["goLivingRoom", "goKitchen", "goBathroom"]
            : sceneId === "hallway-upstairs"
              ? ["openAtticHatch"]
              : sceneId === "kitchen"
                ? [
                    ...(ctx.lindaHere ? ["talkToMom"] : []),
                    ...(ctx.momInKitchen ? [] : ctx.momTalked ? ["checkFridge"] : []),
                    ...(ctx.momInKitchen ? [] : ["makeCoffee"]),
                    ...(ctx.momInKitchen ? [] : ["goBackYard"]),
                  ]
                : sceneId === "back-yard"
                  ? ["goKitchen"]
                  : sceneId === "basement"
                    ? ["goHallway"]
                    : sceneId === "garage"
                      ? ["lookAtGarageBench", "goHallway"]
                      : sceneId === "garage-bench"
                        ? ["pickUpGarageFlashlight"]
                        : sceneId === "gas-station"
                          ? ["enterGasStation"]
                          : sceneId === "gas-station-inside"
                            ? ["talkToRay"]
                            : sceneId === "needle-and-groove"
                              ? ["enterNeedleAndGroove"]
                              : sceneId === "needle-and-groove-inside"
                                ? [
                                    "talkToJohnny",
                                    "enterNeedleAndGrooveBackroom",
                                  ]
                                : sceneId === "police-station"
                                  ? ["enterPoliceStation"]
                                  : sceneId === "police-station-inside"
                                    ? ["leavePoliceStation"]
                                    : sceneId === "hospital"
                                      ? ["enterHospital"]
                                      : sceneId === "hospital-reception"
                                        ? [
                                            "goToMarleneCounter",
                                            "talkToMarlene",
                                            "goToHospitalRoom",
                                          ]
                                        : sceneId === "scrapyard"
                                          ? ["enterScrapyard"]
                                          : sceneId === "scrapyard-inside"
                                            ? [
                                                "talkToBigRoy",
                                                "lookAtScrapyardDesk",
                                                "leaveScrapyard",
                                              ]
                                            : sceneId === "scrapyard-desk"
                                              ? ["takeScrapyardKnife"]
                                              : sceneId === "cementary"
                                                ? [
                                                    "enterCemetery",
                                                    "goCemeteryBackside",
                                                  ]
                                                : sceneId === "cementary-inside"
                                                  ? ["goCemeteryBackside"]
                                                  : sceneId === "cementary-backside"
                                                    ? ["leaveCemeteryBackside"]
                                                    : sceneId === "motel"
                                                      ? ["enterMotel"]
                                                      : sceneId === "motel-inside"
                                                        ? [
                                                            "leaveMotel",
                                                            "talkToEarl",
                                                          ]
                                                        : sceneId === "front-yard"
                                                          ? [
                                                              "goBackYard",
                                                              "enterGarage",
                                                              "goHome",
                                                              "lookAtSanatoriumHill",
                                                            ]
                                                          : sceneId === "street"
                                                            ? []
                                                            : sceneId === "light-pole"
                                                              ? [
                                                                  "chooseNeedleGrooveJob",
                                                                  "chooseGasStationJob",
                                                                  "chooseScrapyardJob",
                                                                ]
                                                              : [])
  );
}
