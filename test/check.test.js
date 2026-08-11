import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { symlink, writeFile } from "node:fs/promises";
import { checkProject } from "../dist/check.js";
import { fixtureRepo } from "./helpers.js";

test("check passes for matching package and remote identity", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "git@github.com:example/allowed-command-fixture.git"
  });

  const report = await checkProject(repo);

  assert.equal(report.ok, true);
  assert.deepEqual(report.denials, []);
  assert.equal(report.identity.actualPackageName, "allowed-command-fixture");
});

test("check treats HTTPS, SCP-style, and SSH URL remotes as the same identity", async () => {
  for (const remote of [
    "https://github.com/example/allowed-command-fixture.git",
    "git@github.com:example/allowed-command-fixture.git",
    "ssh://git@github.com/example/allowed-command-fixture.git"
  ]) {
    const repo = await fixtureRepo("allowed-command", { remote });
    assert.equal((await checkProject(repo)).ok, true, remote);
  }
});

test("check preserves genuinely different remote identities", async () => {
  for (const remote of [
    "ssh://git@gitlab.com/example/allowed-command-fixture.git",
    "ssh://git@github.com/another-owner/allowed-command-fixture.git",
    "ssh://git@github.com/example/another-repository.git"
  ]) {
    const repo = await fixtureRepo("allowed-command", { remote });
    const report = await checkProject(repo);
    assert.equal(report.ok, false, remote);
    assert.equal(report.denials[0].code, "git_remote_mismatch", remote);
  }
});

test("check passes from a nested directory inside the guarded root", async () => {
  const repo = await fixtureRepo("nested-directory", {
    remote: "https://github.com/example/nested-directory-fixture.git"
  });

  const report = await checkProject(join(repo, "packages", "app"));

  assert.equal(report.ok, true);
  assert.equal(report.projectRoot, repo);
});

test("check compares git and project roots by filesystem identity", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });
  const alias = `${repo}-alias`;
  await symlink(repo, alias, "dir");

  const report = await checkProject(alias);

  assert.equal(report.ok, true);
  assert.deepEqual(report.denials, []);
});

test("check reports wrong repository identity", async () => {
  const repo = await fixtureRepo("wrong-repo", {
    remote: "https://github.com/example/actual-root.git"
  });

  const report = await checkProject(repo);

  assert.equal(report.ok, false);
  assert.deepEqual(
    report.denials.map((denial) => denial.code).sort(),
    ["git_remote_mismatch", "package_name_mismatch"]
  );
});

test("check reports missing remote when manifest expects one", async () => {
  const repo = await fixtureRepo("missing-remote");

  const report = await checkProject(repo);

  assert.equal(report.ok, false);
  assert.equal(report.denials[0].code, "git_remote_missing");
});

test("check rejects malformed identity field types before comparing a configured remote", async () => {
  const repo = await fixtureRepo("allowed-command", {
    remote: "https://github.com/example/allowed-command-fixture.git"
  });
  await writeFile(
    join(repo, ".rootguard.json"),
    JSON.stringify({
      version: 1,
      identity: { packageName: false, gitRemote: 42 },
      allow: [{ prefix: ["node", "-e"] }]
    })
  );

  const report = await checkProject(repo);

  assert.equal(report.ok, false);
  assert.equal(report.denials[0].code, "manifest_invalid");
  assert.match(report.denials[0].message, /is not a valid RootGuard manifest/);
});
