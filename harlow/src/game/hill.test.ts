import assert from "node:assert/strict";
import test from "node:test";

import { hillCheckScene, shouldNoticeHill } from "./hill.ts";
import type { QuestProgress } from "./quests.ts";

const ready: QuestProgress[] = [
  { id: "what-walter-said", status: "completed" },
  { id: "faded-poster", status: "completed" },
];
const print = { bootPrintSeen: true };
const sunday = 3;

// 17:55 in the yard, 25 minutes to the diner, arrive 18:20.
const leaveAt = 17 * 60 + 55;
const arriveAt = leaveAt + 25;

test("walking off the yard into the night checks the diner, not the yard", () => {
  assert.equal(arriveAt, 18 * 60 + 20);
  assert.equal(shouldNoticeHill("front-yard", leaveAt, ready, print, sunday), false);
  assert.equal(shouldNoticeHill("front-yard", arriveAt, ready, print, sunday), true);
  const scene = hillCheckScene("front-yard", "diner");
  assert.equal(scene, "diner");
  assert.equal(shouldNoticeHill(scene, arriveAt, ready, print, sunday), false);
});

test("waiting in the yard after dark still notices the hill", () => {
  assert.equal(hillCheckScene("front-yard", null), "front-yard");
  assert.equal(hillCheckScene("front-yard", "front-yard"), "front-yard");
  assert.equal(
    shouldNoticeHill(hillCheckScene("front-yard", null), arriveAt, ready, print, sunday),
    true,
  );
});

test("a walk that ends in the yard notices the hill there", () => {
  assert.equal(hillCheckScene("diner", "front-yard"), "front-yard");
  assert.equal(
    shouldNoticeHill(hillCheckScene("diner", "front-yard"), arriveAt, ready, print, sunday),
    true,
  );
});
