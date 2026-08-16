import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile, rm, writeFile } from "node:fs/promises";
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

test("cli init writes a checkout-independent schema reference", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });
  await rm(join(repo, ".rootguard.json"));

  const result = await runCli(["init", "--cwd", repo]);
  const manifest = JSON.parse(await readFile(join(repo, ".rootguard.json"), "utf8"));
  const schemaUrl = new URL(manifest.$schema);

  assert.equal(result.code, 0);
  assert.equal(schemaUrl.protocol, "https:");
  assert.equal(schemaUrl.hostname, "raw.githubusercontent.com");
  await assert.rejects(access(join(repo, "docs", "rootguard.schema.json")));
});

test("cli init refuses to replace an existing manifest", async () => {
  const repo = await fixtureRepo("allowed-command");
  const manifestPath = join(repo, ".rootguard.json");
  const existing = Buffer.from('{"sentinel":"keep"}\n');
  await writeFile(manifestPath, existing);

  const result = await runCli(["init", "--cwd", repo]);

  assert.equal(result.code, 1);
  assert.equal(
    result.stderr,
    `.rootguard.json already exists at ${manifestPath}; remove it before running rootguard init\n`
  );
  assert.equal(result.stdout, "");
  assert.deepEqual(await readFile(manifestPath), existing);
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
