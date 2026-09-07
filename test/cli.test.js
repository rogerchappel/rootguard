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

test("cli check accepts an equivalent trailing-slash remote", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "git@github.com:example/allowed-command-fixture.git/"
  });

  const result = await runCli(["check", "--json", "--cwd", repo]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(report.ok, true);
  assert.deepEqual(report.denials, []);
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

test("cli init preserves exact allowlist argv token boundaries", async () => {
  const repo = await fixtureRepo("allowed-command");
  await rm(join(repo, ".rootguard.json"));
  const script = "console.log('hello world')";

  const init = await runCli([
    "init", "--cwd", repo, "--allow", "npm test",
    "--allow-argv", JSON.stringify([process.execPath, "-e", script])
  ]);
  const manifest = JSON.parse(await readFile(join(repo, ".rootguard.json"), "utf8"));

  assert.equal(init.code, 0);
  assert.deepEqual(manifest.allow.map((rule) => rule.prefix), [
    ["npm", "test"],
    [process.execPath, "-e", script]
  ]);

  const allowed = await runCli(["run", "--cwd", repo, "--", process.execPath, "-e", script]);
  assert.equal(allowed.code, 0);
  assert.match(allowed.stdout, /hello world/);

  const denied = await runCli(["run", "--cwd", repo, "--", process.execPath, "-e", "console.log('hello  world')"]);
  assert.equal(denied.code, 1);
  assert.match(denied.stderr, /command_not_allowed/);
});

test("cli init rejects malformed allowlist argv", async () => {
  const repo = await fixtureRepo("allowed-command");
  await rm(join(repo, ".rootguard.json"));

  const malformed = await runCli(["init", "--cwd", repo, "--allow-argv", "not-json"]);
  assert.equal(malformed.code, 2);
  assert.match(malformed.stderr, /JSON array of command tokens/);

  const invalid = await runCli(["init", "--cwd", repo, "--allow-argv", '["node",""]']);
  assert.equal(invalid.code, 2);
  assert.match(invalid.stderr, /non-empty JSON array of non-empty strings/);
});

test("cli help documents argument-safe allowlists", async () => {
  const result = await runCli(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--allow-argv/);
  assert.match(result.stdout, /token contains whitespace/);
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

test("cli check emits a JSON denial for malformed package metadata", async () => {
  const repo = await fixtureRepo("allowed-command");
  await writeFile(join(repo, "package.json"), "{invalid");

  const result = await runCli(["check", "--json", "--cwd", repo]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.code, 1);
  assert.equal(report.denials[0].code, "package_metadata_unreadable");
  assert.equal(result.stderr, "");
});

test("cli run denies malformed package metadata without executing the command", async () => {
  const repo = await fixtureRepo("allowed-command");
  const marker = join(repo, "command-ran");
  await writeFile(join(repo, "package.json"), "{invalid");

  const result = await runCli([
    "run", "--json", "--cwd", repo, "--", process.execPath, "-e",
    `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'ran')`
  ]);
  const report = JSON.parse(result.stdout);

  assert.equal(result.code, 1);
  assert.equal(report.allowed, false);
  assert.equal(report.denials[0].code, "package_metadata_unreadable");
  await assert.rejects(access(marker));
});

test("cli text output concisely reports malformed package metadata", async () => {
  const repo = await fixtureRepo("allowed-command");
  await writeFile(join(repo, "package.json"), "{invalid");

  const result = await runCli(["check", "--cwd", repo]);

  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^RootGuard check denied:\n- package_metadata_unreadable: Unable to read package\.json metadata/);
  assert.doesNotMatch(result.stderr, /SyntaxError|at JSON\.parse/);
});
