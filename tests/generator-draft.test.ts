import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createGeneratorDraft,
  GENERATOR_DRAFT_TTL_MS,
  normalizeDraftUploads,
  parseGeneratorDraft,
  type DraftUpload,
} from "../src/lib/generator-draft";

const now = 1_800_000_000_000;
const crowdPath = "/i-found-you-in-the-crowd";
const first: DraftUpload = {
  id: "2fd8bef7-b709-4c88-9723-0921278b21da",
  url: "/api/uploads/2fd8bef7-b709-4c88-9723-0921278b21da",
  width: 1536,
  height: 2048,
};
const second: DraftUpload = {
  id: "755be320-d98e-4536-9f76-d70382a38d34",
  url: "/api/uploads/755be320-d98e-4536-9f76-d70382a38d34",
  width: 480,
  height: 640,
};

function parse(value: unknown, path = crowdPath, time = now) {
  return parseGeneratorDraft(JSON.stringify(value), path, time);
}

describe("template navigation draft", () => {
  it("keeps the first photo and asks for a second when moving to the crowd effect", () => {
    const draft = createGeneratorDraft("crowd", [first], now);
    const restored = parse(draft);
    assert.ok(restored);
    assert.equal(restored.style, "crowd");
    assert.deepEqual(normalizeDraftUploads(restored.uploads, restored.style), [first, null]);
    assert.deepEqual(normalizeDraftUploads([null, second], "crowd"), [null, second]);
  });

  it("retains the second photo in the draft for a round trip through a one-photo template", () => {
    const home = parse(createGeneratorDraft("dance", [first, second], now), "/");
    assert.ok(home);
    assert.deepEqual(normalizeDraftUploads(home.uploads, home.style), [first]);
    const back = parse(createGeneratorDraft("crowd", home.uploads, now));
    assert.ok(back);
    assert.deepEqual(normalizeDraftUploads(back.uploads, back.style), [first, second]);
    assert.deepEqual(home.uploads, [first, second]);
  });

  it("reuses the crowd portrait for single-photo styles when the balcony slot is empty", () => {
    const uploads = [null, second];
    for (const style of ["rap", "dance", "cinematic"] as const) {
      assert.deepEqual(normalizeDraftUploads(uploads, style), [second]);
    }
    assert.deepEqual(normalizeDraftUploads(uploads, "crowd"), [null, second]);
    assert.deepEqual(uploads, [null, second]);
  });

  it("supports choosing a template before uploading any photos", () => {
    for (const style of ["rap", "dance", "cinematic", "crowd"] as const) {
      const draft = createGeneratorDraft(style, [], now);
      const restored = parse(draft, draft.targetPath);
      assert.ok(restored);
      assert.equal(restored.style, style);
      assert.deepEqual(normalizeDraftUploads(restored.uploads, style), style === "crowd" ? [null, null] : [null]);
    }
  });

  it("only copies upload references and does not carry consent, jobs, or extra image data", () => {
    const extended = { ...first, data: "private bytes", owner: "session" };
    const draft = createGeneratorDraft("crowd", [extended, second, first], now);
    assert.deepEqual(draft.uploads, [first, second]);
    assert.notEqual(draft.uploads[0], extended);
    const restored = parse({ ...draft, consent: true, job: "old job", uploads: [extended] });
    assert.deepEqual(restored, { ...draft, uploads: [first] });
  });

  it("expires handoffs after thirty minutes and rejects future or invalid timestamps", () => {
    const draft = createGeneratorDraft("crowd", [first], now);
    assert.ok(parse(draft, crowdPath, now + GENERATOR_DRAFT_TTL_MS - 1));
    assert.equal(parse(draft, crowdPath, now + GENERATOR_DRAFT_TTL_MS), null);
    assert.equal(parse(draft, crowdPath, now - 1), null);
    for (const createdAt of [-1, 1.5, "1800000000000", null]) {
      assert.equal(parse({ ...draft, createdAt }), null);
    }
  });

  it("requires the destination page and style to match the explicit handoff", () => {
    const draft = createGeneratorDraft("crowd", [first], now);
    assert.equal(parse(draft, "/"), null);
    assert.equal(parse({ ...draft, targetPath: "/" }, "/"), null);
    assert.equal(parse({ ...draft, style: "cinematic" }), null);
    assert.equal(parse({ ...draft, style: "unknown" }), null);
    assert.equal(parse(draft, "/dance-rap-video"), null);
    assert.equal(parse({ ...draft, version: 2 }), null);
  });

  it("rejects malformed storage without throwing", () => {
    for (const raw of [null, "", "{", "null", "[]", "42", '"text"', "x".repeat(4097)]) {
      assert.equal(parseGeneratorDraft(raw, crowdPath, now), null);
    }
    const draft = createGeneratorDraft("crowd", [first], now);
    for (const uploads of [null, {}, "photo", [first, second, first], [false], ["photo"]]) {
      assert.equal(parse({ ...draft, uploads }), null);
    }
  });

  it("accepts only same-origin upload paths whose ID matches the stored upload", () => {
    const draft = createGeneratorDraft("crowd", [], now);
    for (const url of [
      "https://example.com/photo.jpg",
      "//example.com/photo.jpg",
      "data:image/png;base64,AAAA",
      "javascript:alert(1)",
      second.url,
      `${first.url}?token=value`,
      `${first.url}#fragment`,
      "/api/uploads/../private",
    ]) {
      assert.equal(parse({ ...draft, uploads: [{ ...first, url }] }), null);
    }
    assert.equal(parse({ ...draft, uploads: [{ ...first, id: "not-a-uuid" }] }), null);
  });

  it("rejects impossible upload dimensions while accepting server output boundaries", () => {
    const draft = createGeneratorDraft("crowd", [], now);
    for (const dimensions of [
      { width: 0 }, { height: -1 }, { width: 2049 }, { height: 2049 },
      { width: 1.5 }, { height: "640" }, { width: null },
    ]) {
      assert.equal(parse({ ...draft, uploads: [{ ...first, ...dimensions }] }), null);
    }
    assert.ok(parse({ ...draft, uploads: [{ ...first, width: 1, height: 2048 }] }));
  });
});
