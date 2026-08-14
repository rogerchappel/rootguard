import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { RootGuardError } from "../dist/errors.js";
import { initManifest } from "../dist/init.js";
import { fixtureRepo } from "./helpers.js";

test("initManifest refuses to replace an existing manifest", async () => {
  const repo = await fixtureRepo("allowed-command");
  const manifestPath = join(repo, ".rootguard.json");
  const existing = Buffer.from('{"sentinel":"keep"}\n');
  await writeFile(manifestPath, existing);

  await assert.rejects(
    initManifest({ cwd: repo }),
    (error) =>
      error instanceof RootGuardError &&
      error.exitCode === 1 &&
      error.message ===
        `.rootguard.json already exists at ${manifestPath}; remove it before running rootguard init`
  );
  assert.deepEqual(await readFile(manifestPath), existing);
});
