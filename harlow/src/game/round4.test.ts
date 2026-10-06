import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conversationChoiceVisible } from "./conversationChoices.ts";
import { questObjective, questTitle } from "./quests.ts";
import { dinerInside, momConversation } from "./scenes.ts";

const momCtx = {
  storyFlags: {} as Record<string, boolean>,
  quests: [
    { id: "talk-to-mom" as const, status: "completed" as const },
    { id: "the-tape" as const, status: "active" as const },
  ],
  job: null,
  jobQuestTarget: null,
  usedLabels: [] as string[],
  openedAsEmployee: false,
  inventory: ["House key"],
};

function momLabels(overrides: Partial<typeof momCtx> = {}) {
  const ctx = { ...momCtx, ...overrides };
  return momConversation.choices
    .filter((choice) => conversationChoiceVisible(choice, ctx))
    .map((choice) => choice.label);
}

describe("lead titles", () => {
  it("names the coffee errand Coffee for Mom until the poster is found", () => {
    assert.equal(
      questTitle({ id: "faded-poster", status: "active" }, { storyFlags: {} }),
      "Coffee for Mom",
    );
    assert.equal(
      questTitle("find-a-job"),
      "Find a Job",
    );
  });

  it("renames to Faded Poster once the poster is found, without a second start", () => {
    assert.equal(
      questTitle(
        { id: "faded-poster", status: "active" },
        { storyFlags: { posterFound: true } },
      ),
      "Faded Poster",
    );
    assert.equal(
      questTitle(
        { id: "faded-poster", status: "active" },
        { inventory: ["Missing Poster"] },
      ),
      "Faded Poster",
    );
  });
});

describe("Find a Job starts on the pledge", () => {
  it("does not start the quest on Mom's worry line", () => {
    const worry = momConversation.choices.find((choice) => choice.label === "How's it going at work?");
    const pledge = momConversation.choices.find((choice) => choice.label === "I'll find a way to help.");
    assert.equal(worry?.startsQuest, undefined);
    assert.equal(worry?.storyFlag, "momJobConcern");
    assert.equal(pledge?.startsQuest, "find-a-job");
    assert.equal(pledge?.requiresStoryFlag, "momJobConcern");
  });

  it("hides the pledge until she has said work is thin", () => {
    assert.equal(momLabels().includes("I'll find a way to help."), false);
    assert.equal(
      momLabels({ storyFlags: { momJobConcern: true } }).includes("I'll find a way to help."),
      true,
    );
  });
});

describe("coffee without the poster", () => {
  it("has Linda ask about Margaret's board", () => {
    const lines = momConversation.choices.find(
      (choice) =>
        choice.label === "Got your coffee."
        && !choice.requiresStoryFlag,
    );
    assert.ok(lines);
    assert.deepEqual(
      lines.response.map((entry) => entry.type === "conversation" ? entry.text : ""),
      [
        "Got your coffee.",
        "Thanks, honey. Did Margaret ever take that old board down?",
        "Don't think so.",
        "No. She wouldn't.",
      ],
    );
  });

  it("keeps the short thanks once the poster is found", () => {
    const visible = momConversation.choices.filter((choice) =>
      choice.label === "Got your coffee."
      && conversationChoiceVisible(choice, {
        ...momCtx,
        storyFlags: { posterFound: true },
        inventory: ["Coffee"],
      }),
    );
    assert.equal(visible.length, 1);
    const last = visible[0]?.response.at(-1);
    assert.equal(last?.type === "conversation" ? last.text : "", "Thanks, honey.");
  });

  it("notes the board in the notebook when the coffee went home first", () => {
    assert.equal(
      questObjective(
        { id: "faded-poster", status: "active" },
        { storyFlags: { coffeeDelivered: true }, inventory: [] },
      ),
      "Coffee's with Mom. She asked about Margaret's board.",
    );
    assert.equal(
      questObjective(
        { id: "faded-poster", status: "active" },
        { storyFlags: { coffeeDelivered: true, posterFound: true }, inventory: [] },
      ),
      "Emily. Missing. Show Mom.",
    );
  });
});

describe("diner bulletin choice", () => {
  it("stays in the scene data until posterFound", () => {
    const board = dinerInside.choices.find((choice) => choice.action === "lookAtDinerBulletin");
    assert.equal(board?.label, "Look at the bulletin board");
    assert.equal(board?.excludesStoryFlag, "posterFound");
    assert.equal(dinerInside.captionPosition, "bottom");
    assert.ok(board?.hotspots?.length);
  });
});
