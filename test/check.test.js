import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
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

test("check passes from a nested directory inside the guarded root", async () => {
  const repo = await fixtureRepo("nested-directory", {
    remote: "https://github.com/example/nested-directory-fixture.git"
  });

  const report = await checkProject(join(repo, "packages", "app"));

  assert.equal(report.ok, true);
  assert.equal(report.projectRoot, repo);
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
