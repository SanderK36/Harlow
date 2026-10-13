import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const harlowRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("public assets", () => {
  it("resolves every referenced image and sound, case-sensitively", () => {
    const result = spawnSync(process.execPath, ["scripts/check-public-assets.mjs"], {
      cwd: harlowRoot,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, `${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  });
});
