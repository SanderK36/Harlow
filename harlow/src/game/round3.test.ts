import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { walterConversation } from "./scenes.ts";
import { busStop, diner, elrodHouse, rachelElrodConversation, rachelFrontYardConversation } from "./scenes.ts";
import { conversationChoiceVisible } from "./conversationChoices.ts";
import { dialogueLineCount, shouldRevealArmedCloseup } from "./conversationCloseup.ts";
import { dialogueFocus } from "./dialogueFocus.ts";
import { questObjective } from "./quests.ts";
import { isRainPlate, sceneWeatherPlate } from "./scenePlate.ts";

const hoodLabel = "I saw someone last night. End of the street. In a hood.";

function walterChoices(
  flags: { rachelMet?: boolean },
  quests: { id: "the-tape" | "down-to-the-station"; status: "active" | "completed" }[],
  usedLabels: string[] = [],
) {
  return walterConversation.choices.filter((choice) =>
    conversationChoiceVisible(choice, {
      storyFlags: flags,
      quests,
      job: null,
      jobQuestTarget: null,
      usedLabels,
      openedAsEmployee: false,
      inventory: [],
    }),
  ).map((choice) => choice.label);
}

const asking = "I'm looking for some information.";
const emily = "Emily.";
const forget = "Forget it.";
const walterQuests = [
  { id: "the-tape" as const, status: "completed" as const },
  { id: "down-to-the-station" as const, status: "active" as const },
];

describe("Walter's first talk", () => {
  it("offers the hood line once rachelMet is set", () => {
    const labels = walterChoices({ rachelMet: true }, [
      { id: "the-tape", status: "completed" },
      { id: "down-to-the-station", status: "active" },
    ]);
    assert.ok(labels.includes(hoodLabel));
  });

  it("offers the hood line when the goodbye quest has committed and the flag has not", () => {
    const labels = walterChoices({}, [
      { id: "the-tape", status: "completed" },
      { id: "down-to-the-station", status: "active" },
    ]);
    assert.ok(labels.includes(hoodLabel));
  });

  it("hides the hood line before Rachel's goodbye", () => {
    const labels = walterChoices({}, [{ id: "the-tape", status: "active" }]);
    assert.equal(labels.includes(hoodLabel), false);
  });

  it("lists the opening replies before Ethan has asked anything", () => {
    const labels = walterChoices({ rachelMet: true }, walterQuests);
    assert.deepEqual(labels, [
      asking,
      "Anything new on Mrs. Elrod?",
      hoodLabel,
      "Never mind.",
    ]);
  });

  it("offers Emily and Forget it after he asks for information", () => {
    const labels = walterChoices({ rachelMet: true }, walterQuests, [asking]);
    assert.deepEqual(labels, [
      emily,
      forget,
      "Anything new on Mrs. Elrod?",
      hoodLabel,
      "Never mind.",
    ]);
  });

  it("drops Forget it once Emily has been said", () => {
    const labels = walterChoices({ rachelMet: true }, walterQuests, [asking, emily]);
    assert.equal(labels.includes(emily), false);
    assert.equal(labels.includes(forget), false);
    assert.ok(labels.includes(hoodLabel));
  });

  it("drops Emily and Forget it once the hood choice has been used", () => {
    const labels = walterChoices({ rachelMet: true }, walterQuests, [asking, hoodLabel]);
    assert.equal(labels.includes(emily), false);
    assert.equal(labels.includes(forget), false);
    assert.deepEqual(labels, ["...Fine"]);
  });
});

describe("Walter's file close-up", () => {
  const hood = walterConversation.choices.find((choice) => choice.label === hoodLabel);
  const openingLines = dialogueLineCount(walterConversation.opening);

  it("arms the drawer only on the line that sets the flag and the quests", () => {
    assert.ok(hood?.closeup);
    assert.deepEqual(hood.closeup.setsFlags, ["fileDrawerSeen"]);
    assert.equal(hood.completesQuest, "down-to-the-station");
    assert.equal(hood.startsQuest, "what-walter-said");
    assert.match(hood.closeup.image, /filingCabinetOpen/);
    const others = walterConversation.choices.filter((choice) => choice !== hood);
    assert.ok(others.length > 0);
    assert.equal(others.every((choice) => choice.closeup === undefined), true);
  });

  it("stays hidden on earlier beats and opens once that reply has settled", () => {
    assert.ok(hood);
    const armedAt = openingLines + dialogueLineCount(hood.response);
    assert.ok(armedAt > openingLines);
    assert.equal(shouldRevealArmedCloseup(null, armedAt), false);
    assert.equal(shouldRevealArmedCloseup({ armedAt }, openingLines), false);
    assert.equal(shouldRevealArmedCloseup({ armedAt }, armedAt - 1), false);
    assert.equal(shouldRevealArmedCloseup({ armedAt }, armedAt), true);
  });
});

describe("Rachel at the Elrod house", () => {
  it("uses the approved tape lines and leaves the flags where they were", () => {
    const who = rachelElrodConversation.choices.find((choice) => choice.label === "Who'd do this to her?");
    assert.deepEqual(
      who?.response.map((entry) => entry.type === "conversation" ? entry.text : entry.type),
      [
        "Who'd do this to her?",
        "I don't know. She never locked her door. Everyone on this street knew that.",
        "Nobody here locks anything.",
      ],
    );

    const tape = rachelElrodConversation.choices.find((choice) => choice.excludesStoryFlag === "tapeSeen");
    assert.equal(tape?.label, "Give me a minute. I want a closer look.");
    assert.equal(tape?.endsConversation, true);
    assert.equal(tape?.storyFlag, undefined);
    assert.deepEqual(
      tape?.response.map((entry) => entry.type === "conversation" ? entry.text : ""),
      [
        "Give me a minute. I want a closer look.",
        "Careful. They've been chasing people off all morning.",
        "I'll be quick.",
      ],
    );

    const stationLine =
      "I'm gonna head down to the station. See if I can get Walter to tell me anything.";
    const walter = rachelElrodConversation.choices.find((choice) => choice.storyFlag === "rachelMet");
    assert.equal(walter?.label, stationLine);
    assert.equal(walter?.requiresStoryFlag, "tapeSeen");
    assert.equal(walter?.completesQuest, "the-tape");
    assert.equal(walter?.startsQuest, "down-to-the-station");
    const spoken = walter?.response.find((entry) => entry.type === "conversation");
    assert.equal(spoken?.type === "conversation" ? spoken.text : "", stationLine);
    const goodbye = walter?.response.find((entry) => entry.type === "conversation" && entry.text.startsWith("Sure"));
    assert.equal(goodbye?.type === "conversation" ? goodbye.text : "", "Sure.");

    const memory = elrodHouse.choices.find((choice) => choice.action === "lookAtElrodTape");
    assert.equal(
      memory?.closeup?.thought,
      "The tape takes me back. Ten years ago, to the night Emily disappeared. Cops in the woods, flashlights in the trees. This feels exactly like that night.",
    );
    assert.deepEqual(memory?.setsFlags, ["tapeSeen"]);
  });

  it("capitalizes the hooded-man lines", () => {
    const hood = rachelFrontYardConversation.choices.find((choice) => choice.storyFlag && (
      Array.isArray(choice.storyFlag) ? choice.storyFlag.includes("rachelKnowsHood") : choice.storyFlag === "rachelKnowsHood"
    ));
    const lines = hood?.response.flatMap((entry) => entry.type === "conversation" ? [entry.text] : []);
    assert.equal(lines?.[2], "Yeah, I saw a man in a hood. Down by the end of the street.");
    assert.match(lines?.join(" ") ?? "", /as well/);
    assert.equal((lines?.join(" ") ?? "").includes("aswell"), false);
  });
});

describe("conversation portraits", () => {
  it("greys both sides for a thought and lights only the speaker otherwise", () => {
    assert.equal(dialogueFocus("Thought"), "thought");
    assert.equal(dialogueFocus("Ethan"), "ethan");
    assert.equal(dialogueFocus("Rachel"), "partner");
    assert.equal(dialogueFocus(null), "quiet");
  });
});

describe("Down to the Station note", () => {
  it("names the drawer only after the close-up flag", () => {
    assert.equal(
      questObjective(
        { id: "down-to-the-station", status: "completed", step: "done" },
        { storyFlags: { fileDrawerSeen: true } },
      ),
      "That file was still in his drawer. PARKER, E.",
    );
    assert.equal(
      questObjective(
        { id: "down-to-the-station", status: "completed", step: "done" },
        { storyFlags: {} },
      ),
      "Walter said go home. He knows something.",
    );
  });
});

describe("interim rain follows the plate", () => {
  it("leaves a rainy day plate alone and filters the dry night plate", () => {
    const day = sceneWeatherPlate(diner, 8 * 60 + 26, "Rainy");
    const night = sceneWeatherPlate(diner, 19 * 60, "Rainy");
    assert.equal(isRainPlate(day, diner, "Rainy"), true);
    assert.equal(isRainPlate(night, diner, "Rainy"), false);
  });

  it("filters the bus stop, and uses the Elrod rain plate by day", () => {
    const stop = sceneWeatherPlate(busStop, 21 * 60, "Rainy");
    const stopDay = sceneWeatherPlate(busStop, 10 * 60 + 35, "Rainy");
    const house = sceneWeatherPlate(elrodHouse, 8 * 60 + 16, "Rainy");
    assert.match(stop, /busStopNight\.png$/);
    assert.equal(isRainPlate(stop, busStop, "Rainy"), false);
    assert.match(stopDay, /busStopRain\.png$/);
    assert.equal(isRainPlate(stopDay, busStop, "Rainy"), true);
    assert.match(house, /ElrodHouseRainy\.png$/);
    assert.equal(isRainPlate(house, elrodHouse, "Rainy"), true);
  });
});
