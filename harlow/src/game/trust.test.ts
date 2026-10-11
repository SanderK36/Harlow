import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conversationChoiceVisible } from "./conversationChoices.ts";
import type { ConversationChoice } from "./story.ts";
import {
  momConversation,
  rachelElrodConversation,
  rachelFrontYardConversation,
  walterConversation,
} from "./scenes.ts";
import { margaretConversation } from "./scene/town.ts";
import {
  applyConversationTrust,
  applyReturnGreeting,
  buildNpcOpening,
  canAffordPricedChoice,
  clampTrust,
  defaultTrust,
  handwritingCount,
  HANDWRITING_MS,
  meetsTrust,
  migrateMet,
  migratePeopleSeen,
  migrateTrust,
  notebookLine,
  notebookPeople,
  NOTEBOOK_NAME,
  unseenNotebookPeople,
  pricedEffects,
  returnGreeting,
  shouldMarkRachelWaited,
  type TrustLedger,
  type TrustMap,
  type TrustStep,
} from "./trust.ts";

function ledger(trust: TrustMap, dayGains: TrustLedger["gainedOnDay"] = {}): TrustLedger {
  return { trust, spent: {}, gainedOnDay: dayGains };
}

function step(
  state: TrustLedger,
  change: TrustStep,
  dayNumber = 2,
) {
  return applyConversationTrust(state, change, dayNumber);
}

const coffee: TrustStep = { person: "margaret", amount: 1, oncePerDay: true };

describe("trust clamp and defaults", () => {
  it("starts Margaret at +1 and everyone else at 0", () => {
    assert.deepEqual(defaultTrust(), { rachel: 0, linda: 0, walter: 0, margaret: 1 });
  });

  it("clamps Rachel to -2..+2 and Margaret to 0..+2", () => {
    assert.equal(clampTrust("rachel", 9), 2);
    assert.equal(clampTrust("rachel", -9), -2);
    assert.equal(clampTrust("margaret", 4), 2);
    assert.equal(clampTrust("margaret", -1), 0);
    const dropped = step(ledger({ ...defaultTrust(), margaret: 0 }), {
      person: "margaret",
      amount: -1,
    });
    assert.equal(dropped.trust.margaret, 0);
    assert.equal(dropped.applied, 0);
  });
});

describe("one step per conversation", () => {
  it("caps the net at +1 when the same person is raised twice", () => {
    const first = step(ledger(defaultTrust()), { person: "linda", amount: 1 });
    const second = step(first, { person: "linda", amount: 1 });
    assert.equal(first.applied, 1);
    assert.equal(second.applied, 0);
    assert.equal(second.trust.linda, 1);
    assert.equal(second.spent.linda, 1);
  });

  it("lets Emily and the hood line cancel to net 0", () => {
    const emily = step(ledger(defaultTrust()), { person: "walter", amount: -1 });
    const hood = step(emily, { person: "walter", amount: 1 });
    assert.equal(emily.trust.walter, -1);
    assert.equal(hood.trust.walter, 0);
    assert.equal(hood.spent.walter, 0);
  });

  it("does not spend the step on a zero change", () => {
    const forgotten = step(ledger(defaultTrust()), { person: "walter", amount: 0 });
    const hood = step(forgotten, { person: "walter", amount: 1 });
    assert.equal(forgotten.trust.walter, 0);
    assert.equal(hood.trust.walter, 1);
  });
});

describe("Margaret's coffee", () => {
  it("gives at most +1 per day, so three coffees in a row cannot reach +2 from 0", () => {
    let state = ledger({ ...defaultTrust(), margaret: 0 });
    state = step(state, coffee);
    state = step(state, coffee);
    state = step(state, coffee);
    assert.equal(state.trust.margaret, 1);

    const later = step({ ...state, spent: {} }, coffee);
    assert.equal(later.trust.margaret, 1);

    const nextDay = step({ ...later, spent: {} }, coffee, 3);
    assert.equal(nextDay.trust.margaret, 2);
  });

  it("lets her first chapter 1 coffee reach +2, and the next one that day is free", () => {
    const bought = step(ledger(defaultTrust()), coffee);
    assert.equal(bought.trust.margaret, 2);
    const again = step({ ...bought, spent: {} }, coffee);
    assert.equal(again.trust.margaret, 2);
    assert.equal(pricedEffects({ price: 1, freeWhen: { person: "margaret", min: 2 } }, bought.trust), undefined);
    assert.deepEqual(
      pricedEffects({ price: 1, freeWhen: { person: "margaret", min: 2 } }, defaultTrust()),
      { money: -1 },
    );
  });
});

describe("trust gates", () => {
  const gated: ConversationChoice = {
    label: "Say it.",
    response: [],
    requiresTrust: { person: "rachel", min: 1 },
    excludesTrust: { person: "walter", min: 2 },
  };

  function visible(trust: TrustMap) {
    return conversationChoiceVisible(gated, {
      storyFlags: {},
      quests: [],
      job: null,
      jobQuestTarget: null,
      usedLabels: [],
      openedAsEmployee: false,
      inventory: [],
      trust,
      money: 10,
    });
  }

  it("requires a minimum and excludes a high score", () => {
    assert.equal(meetsTrust(defaultTrust(), { person: "rachel", min: 1 }), false);
    assert.equal(visible(defaultTrust()), false);
    assert.equal(visible({ ...defaultTrust(), rachel: 1 }), true);
    assert.equal(visible({ ...defaultTrust(), rachel: 2, walter: 2 }), false);
  });

  it("hides a priced coffee Ethan cannot buy, and keeps it once it is free", () => {
    const order = margaretConversation.choices.find((choice) => choice.label === "Coffee.");
    assert.ok(order);
    const base = {
      storyFlags: {},
      quests: [],
      job: null,
      jobQuestTarget: null,
      usedLabels: ["Coffee."],
      openedAsEmployee: false,
      inventory: [] as string[],
    };
    assert.equal(canAffordPricedChoice(order, defaultTrust(), 0), false);
    assert.equal(
      conversationChoiceVisible(order, { ...base, trust: defaultTrust(), money: 0 }),
      false,
    );
    assert.equal(
      conversationChoiceVisible(order, {
        ...base,
        trust: { ...defaultTrust(), margaret: 2 },
        money: 0,
      }),
      true,
    );
  });
});

describe("save migration", () => {
  it("gives Rachel +1 for Told her and -1 for Shut her out, and Margaret +1", () => {
    const told = migrateTrust({
      quests: [{ id: "what-walter-said", status: "completed", step: "done" }],
      storyFlags: { rachelTrusted: true },
    });
    assert.equal(told.rachel, 1);
    assert.equal(told.margaret, 1);

    const shut = migrateTrust({
      quests: [{ id: "what-walter-said", status: "completed", step: "shut" }],
      storyFlags: { rachelShutOut: true },
    });
    assert.equal(shut.rachel, -1);

    const unfinished = migrateTrust({
      quests: [{ id: "what-walter-said", status: "active" }],
      storyFlags: { rachelTrusted: true },
    });
    assert.equal(unfinished.rachel, 0);

    const kept = migrateTrust({
      trust: { rachel: -2, margaret: 2 },
      quests: [{ id: "what-walter-said", status: "completed", step: "done" }],
      storyFlags: { rachelTrusted: true },
    });
    assert.equal(kept.rachel, -2);
    assert.equal(kept.margaret, 2);
    assert.equal(kept.linda, 0);
  });

  it("infers who Ethan has met when an old save has no met list", () => {
    assert.deepEqual(
      migrateMet({
        momTalked: true,
        storyFlags: { rachelMet: true, walterStationTalk: true },
      }),
      ["linda", "rachel", "walter"],
    );
    assert.deepEqual(migrateMet({ momTalked: false, quests: [{ id: "talk-to-mom", status: "active" }] }), []);
    assert.deepEqual(migrateMet({ met: ["margaret", "linda", "linda"] }), ["margaret", "linda"]);
  });
});

describe("return greetings", () => {
  it("keeps the written opening on a first meeting and at trust 0", () => {
    assert.equal(returnGreeting("margaret", 1, false), null);
    assert.equal(returnGreeting("linda", 0, true), null);
    const first = buildNpcOpening({
      opening: margaretConversation.opening,
      person: "margaret",
      trust: 1,
      returning: false,
    });
    assert.equal(first.gossipShown, false);
    assert.equal(
      first.opening[0]?.type === "conversation" ? first.opening[0].text : "",
      "Ethan, there you are. Sit wherever you like, honey. It's quiet enough that I can keep an eye on you.",
    );
  });

  it("uses the trust line on a return visit and says Margaret's gossip once", () => {
    assert.equal(returnGreeting("rachel", 2, true), "Ethan. Good. I was hoping you'd come by.");
    assert.equal(returnGreeting("rachel", 1, true), "Hey, you. Any news?");
    assert.equal(returnGreeting("rachel", -1, true), "Oh. It's you.");
    assert.equal(returnGreeting("rachel", -2, true), "What do you want, Ethan?");
    assert.equal(returnGreeting("linda", 2, true), "There's my boy. Come sit with me a minute.");
    assert.equal(returnGreeting("linda", 1, true), "Hey, honey. You eat anything today?");
    assert.equal(returnGreeting("linda", -1, true), "Oh. Hi, honey.");
    assert.equal(returnGreeting("linda", -2, true), "Not now, honey. I'm tired.");
    assert.equal(returnGreeting("walter", 2, true), "Shut the door, kid.");
    assert.equal(returnGreeting("walter", 1, true), "Ethan. Sit down.");
    assert.equal(returnGreeting("walter", -1, true), "You again. Make it quick.");
    assert.equal(returnGreeting("walter", -2, true), "Back again? Funny how you keep showing up.");
    assert.equal(returnGreeting("margaret", 1, true), "Ethan! Your usual's already on.");
    assert.equal(
      returnGreeting("margaret", 2, true),
      "There he is. Sit, this one's on me. And you didn't hear this from me…",
    );

    const question = rachelFrontYardConversation.opening[0];
    const prepended = applyReturnGreeting(
      rachelFrontYardConversation.opening,
      "Rachel",
      "Hey, you. Any news?",
      "prepend",
    );
    assert.equal(prepended[0]?.type === "conversation" ? prepended[0].text : "", "Hey, you. Any news?");
    assert.equal(prepended[1], question);
    assert.equal(
      rachelFrontYardConversation.opening[0]?.type === "conversation"
        ? rachelFrontYardConversation.opening[0].text
        : "",
      "Been out here an hour. What'd Walter say?",
    );

    const gossip = buildNpcOpening({
      opening: margaretConversation.opening,
      person: "margaret",
      trust: 2,
      returning: true,
    });
    assert.equal(gossip.gossipShown, true);
    const lines = gossip.opening.flatMap((entry) => entry.type === "conversation" ? [entry.text] : []);
    assert.deepEqual(lines, [
      "There he is. Sit, this one's on me. And you didn't hear this from me…",
      "Mrs. Elrod sat right there Tuesday. Said somebody kept leaving her gate open at night. I told her it was the wind.",
      "Did she tell Walter?",
      "Honey, she told everybody. Nobody listened.",
    ]);
    const again = buildNpcOpening({
      opening: margaretConversation.opening,
      person: "margaret",
      trust: 2,
      returning: true,
      gossipHeard: true,
    });
    assert.equal(again.gossipShown, false);
    assert.equal(again.opening.length, 1);
  });
});

describe("notebook lines", () => {
  it("uses Ethan's handwritten line for each level", () => {
    assert.equal(notebookLine("rachel", 2), "She tells me things. I owe her the same.");
    assert.equal(notebookLine("rachel", 1), "Still the girl from down the street. Still on my side.");
    assert.equal(notebookLine("rachel", 0), "Lives a few houses down. Remembers Emily.");
    assert.equal(notebookLine("rachel", -1), "She asked. I didn't answer.");
    assert.equal(notebookLine("rachel", -2), "She's stopped asking.");
    assert.equal(notebookLine("linda", 2), "She almost said Emily's name today.");
    assert.equal(notebookLine("linda", 1), "She smiled. First time in a while.");
    assert.equal(notebookLine("linda", 0), "Covering everything. Says she's fine.");
    assert.equal(notebookLine("linda", -1), "She changes the subject faster than I can bring it up.");
    assert.equal(notebookLine("linda", -2), "We live in the same house. That's about it.");
    assert.equal(notebookLine("walter", 2), "He looks at me like I might be useful.");
    assert.equal(notebookLine("walter", 1), "Walter listened. Didn't say much. Didn't throw me out either.");
    assert.equal(notebookLine("walter", 0), "Sheriff. Knew Dad, back before Dad left.");
    assert.equal(notebookLine("walter", -1), "He watched me leave. All the way to the corner.");
    assert.equal(notebookLine("walter", -2), "Walter's keeping an eye on me. I'd better keep one on him.");
    assert.equal(notebookLine("margaret", 0), "Runs the diner. Never takes anything down.");
    assert.equal(notebookLine("margaret", 1), "She knows how I take my coffee.");
    assert.equal(notebookLine("margaret", 2), "Coffee's on the house. So is the gossip.");
  });

  it("puts the full name on the card and leaves it out of the trust-0 line", () => {
    assert.equal(NOTEBOOK_NAME.rachel, "Rachel Bennett");
    assert.equal(NOTEBOOK_NAME.linda, "Mom");
    assert.equal(NOTEBOOK_NAME.walter, "Walter Harrington");
    assert.equal(NOTEBOOK_NAME.margaret, "Margaret");
    assert.equal(
      `${NOTEBOOK_NAME.rachel}. ${notebookLine("rachel", 0)}`,
      "Rachel Bennett. Lives a few houses down. Remembers Emily.",
    );
    assert.equal(
      `${NOTEBOOK_NAME.walter}. ${notebookLine("walter", 0)}`,
      "Walter Harrington. Sheriff. Knew Dad, back before Dad left.",
    );
    assert.equal(
      `${NOTEBOOK_NAME.linda}. ${notebookLine("linda", 0)}`,
      "Mom. Covering everything. Says she's fine.",
    );
    assert.equal(
      `${NOTEBOOK_NAME.margaret}. ${notebookLine("margaret", 0)}`,
      "Margaret. Runs the diner. Never takes anything down.",
    );
  });

  it("always shows Mom, then people met outside the family", () => {
    assert.deepEqual(notebookPeople([]), ["linda"]);
    assert.deepEqual(notebookPeople(["rachel"]), ["linda", "rachel"]);
    assert.deepEqual(notebookPeople(["linda", "rachel", "walter"]), ["linda", "rachel", "walter"]);
    assert.deepEqual(notebookPeople(["margaret", "linda"]), ["linda", "margaret"]);
  });

  it("marks the notebook only after a trust step, not for a starting score", () => {
    const started = defaultTrust();
    const seenStart = migratePeopleSeen(null, started);
    assert.equal(seenStart.margaret, 1);
    assert.deepEqual(unseenNotebookPeople(notebookPeople([]), started, seenStart), []);

    const migrated = migrateTrust({
      quests: [{ id: "what-walter-said", status: "completed", step: "done" }],
      storyFlags: { rachelTrusted: true },
    });
    const seenMigrated = migratePeopleSeen({}, migrated);
    assert.equal(migrated.rachel, 1);
    assert.deepEqual(
      unseenNotebookPeople(notebookPeople(["linda", "rachel"]), migrated, seenMigrated),
      [],
    );

    const afterStep = { ...seenMigrated, rachel: migrated.rachel + 1 };
    const trustAfter = { ...migrated, rachel: migrated.rachel + 1 };
    assert.deepEqual(
      unseenNotebookPeople(notebookPeople(["rachel"]), trustAfter, seenMigrated),
      ["rachel"],
    );
    assert.deepEqual(
      unseenNotebookPeople(notebookPeople(["rachel"]), trustAfter, afterStep),
      [],
    );
  });

  it("writes a changed line across 600ms and skips that under reduced motion", () => {
    const line = notebookLine("linda", 0);
    assert.equal(handwritingCount(line.length, 0, false), 0);
    assert.equal(handwritingCount(line.length, HANDWRITING_MS / 2, false) > 0, true);
    assert.equal(handwritingCount(line.length, HANDWRITING_MS, false), line.length);
    assert.equal(handwritingCount(line.length, 0, true), line.length);
  });
});

describe("rachelWaited", () => {
  it("is set only when he sleeps before the second talk", () => {
    assert.equal(shouldMarkRachelWaited({ rachelComebackAsked: true }), true);
    assert.equal(shouldMarkRachelWaited({ rachelComebackAsked: true, rachelFollowedUp: true }), false);
    assert.equal(shouldMarkRachelWaited({}), false);
    const sure = rachelElrodConversation.choices.find((choice) =>
      choice.storyFlag
      && (Array.isArray(choice.storyFlag)
        ? choice.storyFlag.includes("rachelComebackAsked")
        : choice.storyFlag === "rachelComebackAsked"),
    );
    const spoken = sure?.response.find((entry) => entry.type === "conversation" && entry.text === "Sure.");
    assert.equal(spoken?.type === "conversation" ? spoken.text : "", "Sure.");
    assert.equal(sure?.trust, undefined);
  });
});

describe("chapter 1 trust choices", () => {
  it("moves trust only on the written replies", () => {
    const rachel = (label: string) =>
      rachelFrontYardConversation.choices.find((choice) => choice.label === label);
    assert.deepEqual(rachel("I told him about the hooded man.")?.trust, { person: "rachel", amount: 1 });
    assert.deepEqual(rachel("There was a file. PARKER, E. Still in his drawer.")?.trust, { person: "rachel", amount: 1 });
    assert.deepEqual(rachel("I can't tell you, Rach.")?.trust, { person: "rachel", amount: -1 });

    const help = momConversation.choices.find((choice) => choice.label === "I'll find a way to help.");
    assert.deepEqual(help?.trust, { person: "linda", amount: 1 });
    const coffees = momConversation.choices.filter((choice) => choice.label === "Got your coffee.");
    assert.equal(coffees.length, 2);
    assert.ok(coffees.every((choice) => choice.trust?.person === "linda" && choice.trust.amount === 1));
    const posters = momConversation.choices.filter((choice) => choice.label === "I found Emily's poster at the diner.");
    assert.ok(posters.every((choice) => {
      const flags = choice.storyFlag;
      const list = !flags ? [] : Array.isArray(flags) ? flags : [flags];
      return list.includes("lindaPosterRaised");
    }));
    const posterOnly = posters.filter((choice) => choice.trust?.amount === 0);
    assert.equal(posterOnly.length, 3);
    const posterAndCoffee = posters.find((choice) => choice.trust?.amount === 1);
    assert.ok(posterAndCoffee?.removesItem === "Coffee");

    const walter = (label: string) =>
      walterConversation.choices.find((choice) => choice.label === label);
    assert.deepEqual(walter("Emily.")?.trust, { person: "walter", amount: -1 });
    assert.deepEqual(walter("Forget it.")?.trust, { person: "walter", amount: 0 });
    assert.deepEqual(
      walter("I saw someone last night. End of the street. In a hood.")?.trust,
      { person: "walter", amount: 1 },
    );

    const order = margaretConversation.choices.find((choice) => choice.label === "Coffee.");
    assert.deepEqual(order?.trust, { person: "margaret", amount: 1, oncePerDay: true });
    assert.equal(order?.price, 1);
    assert.deepEqual(order?.freeWhen, { person: "margaret", min: 2 });
  });
});
