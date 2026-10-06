import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  captionBoxWidth,
  placeCaption,
  type Box,
} from "./captionPlace.ts";
import { restAfterSleep } from "./effects.ts";
import {
  actionMinutes,
  waitingMinutesAllowed,
} from "./lateNight.ts";
import {
  emptyNoticeQueue,
  enqueueNoticeCard,
  noticesAreHeld,
  pauseNoticeQueue,
  pumpNoticeQueue,
  type NoticeCard,
} from "./notices.ts";
import player from "./player.ts";
import { sanatoriumShowsOneWindow } from "./scenes.ts";
import { weatherStatusLabel } from "./utils.ts";

const art: Box = { left: 0, top: 0, right: 1000, bottom: 600 };
const box = { width: 440, height: 160 };

const coffee: NoticeCard = {
  key: "lead:faded-poster",
  kind: "lead",
  label: "NEW LEAD",
  message: "Coffee for Mom",
};

describe("round 6 clock", () => {
  it("lets a walk spend its full time after 03:30", () => {
    assert.equal(actionMinutes(212, 40, true), 40);
    assert.equal(actionMinutes(200, 40, true), 40);
  });

  it("still stops the morning before Mom is talked to", () => {
    assert.equal(actionMinutes(500, 60, false), 39);
  });

  it("stops a wait at 03:30 and blocks waiting after that", () => {
    assert.equal(waitingMinutesAllowed(200, 30), 10);
    assert.equal(waitingMinutesAllowed(211, 1), 0);
    assert.equal(waitingMinutesAllowed(7 * 60, 60), 60);
  });
});

describe("round 6 captions", () => {
  it("keeps a desktop box between 280 and 440, and a phone box at the viewport minus 32", () => {
    assert.equal(captionBoxWidth(1100, 1280), 440);
    assert.equal(captionBoxWidth(400, 1280), 368);
    assert.equal(captionBoxWidth(200, 1280), 280);
    assert.equal(captionBoxWidth(390, 390), 358);
  });

  it("uses the first clear corner and never a smaller box", () => {
    assert.equal(placeCaption(art, box, []), "top-left");
    const topLeft: Box = { left: 0, top: 0, right: 500, bottom: 200 };
    assert.equal(placeCaption(art, box, [topLeft]), "top-right");
    const full: Box = { left: 0, top: 0, right: 1000, bottom: 600 };
    assert.equal(placeCaption(art, box, [full]), "below");
  });
});

describe("round 6 leads", () => {
  it("shows Coffee for Mom after the conversation that queued it closes", () => {
    const during = {
      closeupOpen: false,
      conversationActive: true,
      chapterEndOpen: false,
    };
    const queued = enqueueNoticeCard(emptyNoticeQueue(), coffee, noticesAreHeld(during));
    assert.equal(queued.showing, null);
    assert.equal(queued.queue[0]?.message, "Coffee for Mom");
    const shown = pumpNoticeQueue(queued, noticesAreHeld({ ...during, conversationActive: false }));
    assert.equal(shown.showing?.message, "Coffee for Mom");
    assert.equal(shown.queue.length, 0);
  });

  it("shows a lead after a close-up closes, including one paused off screen", () => {
    const open = { closeupOpen: true, conversationActive: false, chapterEndOpen: false };
    const queued = enqueueNoticeCard(emptyNoticeQueue(), coffee, noticesAreHeld(open));
    assert.equal(queued.showing, null);
    const shown = pumpNoticeQueue(queued, noticesAreHeld({ ...open, closeupOpen: false }));
    assert.equal(shown.showing?.message, "Coffee for Mom");

    const paused = pauseNoticeQueue(shown);
    assert.equal(paused.showing, null);
    assert.equal(paused.queue[0]?.message, "Coffee for Mom");
    const again = pumpNoticeQueue(paused, false);
    assert.equal(again.showing?.message, "Coffee for Mom");
  });
});

describe("round 6 night and sleep", () => {
  it("says Clear instead of Sunny after dark", () => {
    assert.equal(weatherStatusLabel("Sunny", 184), "Clear");
    assert.equal(weatherStatusLabel("Sunny", 18 * 60 + 14), "Clear");
    assert.equal(weatherStatusLabel("Sunny", 7 * 60), "Sunny");
    assert.equal(weatherStatusLabel("Rainy", 184), "Rainy");
  });

  it("uses the one-window plate only at night before Light on the Hill is done", () => {
    assert.equal(sanatoriumShowsOneWindow(184, false), true);
    assert.equal(sanatoriumShowsOneWindow(184, true), false);
    assert.equal(sanatoriumShowsOneWindow(7 * 60, false), false);
  });

  it("restores health and stamina on sleep", () => {
    const rested = restAfterSleep(player);
    assert.equal(rested.health, player.maxHealth);
    assert.equal(rested.stamina, player.maxStamina);
    assert.equal(rested.fear, player.fear);
  });
});
