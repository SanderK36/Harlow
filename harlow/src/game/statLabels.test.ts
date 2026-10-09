import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { choiceAffordance, formatStatDelta } from "./statLabels.ts";
import { statDeltas, restAfterSleep } from "./effects.ts";
import player from "./player.ts";
import { upstairsHallway, upstairsHallwayAtticOpen, kitchen } from "./scene/home.ts";
import { frontYard } from "./scene/outdoors.ts";

describe("stat notices", () => {
  it("uses the side-panel names", () => {
    assert.equal(formatStatDelta("stamina", 5), "+5 STAM");
    assert.equal(formatStatDelta("health", -5), "-5 HP");
    assert.equal(formatStatDelta("fear", 10), "+10 FEAR");
    assert.equal(formatStatDelta("money", -7), "-$7");
    assert.equal(formatStatDelta("courage", 1), "+1 COURAGE");
  });

  it("previews coffee stats and hides minutes off the map", () => {
    const coffee = kitchen.choices.find((choice) => choice.action === "makeCoffee");
    assert.ok(coffee);
    assert.equal(choiceAffordance(coffee), "+5 STAM");
    assert.equal(choiceAffordance(coffee, { showTime: true }), "+5 STAM · 10 min");
    assert.equal(choiceAffordance({ timeCost: 0 }), "");
  });

  it("hides the clock on a move between rooms", () => {
    const yard = frontYard.choices.find((choice) => choice.action === "goBackYard");
    assert.ok(yard);
    assert.ok(yard.timeCost > 0);
    assert.equal(choiceAffordance(yard), "");
    assert.equal(choiceAffordance(yard, { showTime: true }), `${yard.timeCost} min`);
  });

  it("reports the real sleep recovery and skips a stat that did not move", () => {
    const rested = restAfterSleep(player);
    const deltas = statDeltas(player, rested);
    assert.deepEqual(
      deltas.map((entry) => entry.type === "effect" ? formatStatDelta(entry.stat, entry.amount) : ""),
      [
        formatStatDelta("health", player.maxHealth - player.health),
        formatStatDelta("stamina", player.maxStamina - player.stamina),
      ],
    );
  });
});

describe("upstairs hallway attic", () => {
  it("keeps the hatch hotspot and drops the extra attic button", () => {
    const actions = upstairsHallway.choices.map((choice) => choice.action);
    assert.ok(actions.includes("openAtticHatch"));
    assert.equal(actions.includes("goAttic"), false);
    const hatch = upstairsHallway.choices.find((choice) => choice.action === "openAtticHatch");
    assert.ok(hatch?.hotspots?.length);
  });

  it("puts the attic stairs on the open hatch as a hotspot", () => {
    const attic = upstairsHallwayAtticOpen.choices.find((choice) => choice.action === "goAttic");
    assert.ok(attic?.hotspots?.length);
    assert.equal(
      upstairsHallwayAtticOpen.choices.some((choice) => choice.action === "openAtticHatch"),
      false,
    );
  });
});
