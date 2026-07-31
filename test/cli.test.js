import assert from "node:assert/strict";
import test from "node:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fixtureRepo, runCli } from "./helpers.js";

test("cli check emits machine-readable json", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });

  const result = await runCli(["check", "--json", "--cwd", repo]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(report.ok, true);
  assert.equal(report.identity.expectedPackageName, "allowed-command-fixture");
});

test("cli run executes an allowed fixture command", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });

  const result = await runCli(["run", "--cwd", repo, "--", "node", "-e", "console.log('fixture smoke')"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /RootGuard allowed/);
  assert.match(result.stdout, /fixture smoke/);
});

test("cli run refuses a disallowed fixture command", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });

  const result = await runCli(["run", "--cwd", repo, "--", "npm", "publish"]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /command_not_allowed/);
});

test("cli check reports an invalid manifest for a non-string git remote", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });
  await writeFile(
    join(repo, ".rootguard.json"),
    JSON.stringify({
      version: 1,
      identity: { gitRemote: 42 },
      allow: [{ prefix: ["node", "-e"] }]
    })
  );

  const result = await runCli(["check", "--json", "--cwd", repo]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.code, 1);
  assert.equal(report.denials[0].code, "manifest_invalid");
  assert.match(report.denials[0].message, /is not a valid RootGuard manifest/);
  assert.doesNotMatch(result.stderr, /TypeError|trim is not a function/);
});
