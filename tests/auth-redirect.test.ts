import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAuthReturnPath } from "../src/lib/auth-redirect";

describe("Google login return destination", () => {
  it("keeps a local page, query, and anchor", () => {
    assert.equal(safeAuthReturnPath("/rap-video?style=dance#generator"), "/rap-video?style=dance#generator");
  });
  it("rejects external, protocol-relative, and malformed destinations", () => {
    for (const path of ["https://evil.example", "//evil.example", "/\\evil.example", "/%2f%2fevil.example", "/%5cevil.example", "javascript:alert(1)", "/bad%", "/\n/evil.example", undefined, ["/rap-video"]]) {
      assert.equal(safeAuthReturnPath(path), "/");
    }
  });
  it("rejects authentication loops and API paths after normalization", () => {
    for (const path of ["/login", "/login?returnTo=/login", "/login/", "/api/auth/sign-out", "/x/../api/me", "/%61pi/me"]) {
      assert.equal(safeAuthReturnPath(path), "/");
    }
  });
});
