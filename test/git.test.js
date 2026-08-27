import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRemote } from "../dist/git.js";

test("normalizeRemote canonicalizes supported repository URL suffixes", () => {
  const expected = "https://github.com/example/repository";
  for (const remote of [
    "https://github.com/example/repository/",
    "https://github.com/example/repository.git/",
    "git@github.com:example/repository/",
    "git@github.com:example/repository.git/",
    "ssh://git@github.com/example/repository/",
    "ssh://git@github.com/example/repository.git/"
  ]) {
    assert.equal(normalizeRemote(remote), expected, remote);
  }
});

test("normalizeRemote preserves different repository identities", () => {
  assert.notEqual(
    normalizeRemote("https://github.com/example/repository/"),
    normalizeRemote("https://gitlab.com/example/repository/")
  );
  assert.notEqual(
    normalizeRemote("git@github.com:example/repository.git/"),
    normalizeRemote("git@github.com:another/repository.git/")
  );
});
