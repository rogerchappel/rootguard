import assert from "node:assert/strict";
import test from "node:test";
import { fixtureRepo } from "./helpers.js";
import { prepareRun } from "../dist/run.js";

test("run preparation allows explicit command prefix", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });

  const report = await prepareRun(repo, ["node", "-e", "console.log('ok')"]);

  assert.equal(report.ok, true);
  assert.equal(report.allowed, true);
  assert.deepEqual(report.matchedRule.prefix, ["node", "-e"]);
});

test("run preparation denies commands outside the allowlist", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });

  const report = await prepareRun(repo, ["npm", "publish"]);

  assert.equal(report.ok, false);
  assert.equal(report.allowed, false);
  assert.equal(report.denials.at(-1).code, "command_not_allowed");
});
