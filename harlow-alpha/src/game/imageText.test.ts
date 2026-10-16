import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IMAGE_TEXT_DEMO, inscriptionPresentation } from "../components/ImageText/imageText.ts";

describe("text on images", () => {
  it("prints headlines in the body serif and writes captions and notes by hand", () => {
    const headline = inscriptionPresentation("headline");
    assert.equal(headline.font, "body");
    assert.equal(headline.fontFamily, "var(--font-body)");
    assert.equal(headline.weight, 600);
    assert.equal(headline.blend, "multiply");
    assert.ok(headline.rotate < 0 && headline.rotate > -8);

    const caption = inscriptionPresentation("caption");
    const note = inscriptionPresentation("note");
    assert.equal(caption.font, "handwriting");
    assert.equal(caption.fontFamily, "var(--font-handwriting)");
    assert.equal(note.font, "handwriting");
    assert.equal(caption.blend, "multiply");
    assert.equal(note.blend, "multiply");
    assert.notEqual(caption.rotate, note.rotate);

    const engraved = inscriptionPresentation("engraved");
    assert.equal(engraved.font, "body");
    assert.equal(engraved.fontFamily, "var(--font-body)");
    assert.equal(engraved.blend, "multiply");
    assert.equal(engraved.rotate, 0);
  });

  it("demo covers a newspaper headline, a photo caption, and a note", () => {
    assert.deepEqual(
      IMAGE_TEXT_DEMO.map((item) => item.kind).sort(),
      ["caption", "headline", "note"],
    );
    for (const item of IMAGE_TEXT_DEMO) {
      assert.ok(item.text.length > 0);
    }
  });
});
