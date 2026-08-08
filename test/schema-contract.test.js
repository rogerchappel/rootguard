import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { initManifest } from "../dist/init.js";
import { isManifest } from "../dist/manifest.js";

const schema = JSON.parse(await readFile(new URL("../docs/rootguard.schema.json", import.meta.url), "utf8"));
const validateSchema = new Ajv2020({ strict: true }).compile(schema);

function assertContract(manifest, expected, label) {
  assert.equal(isManifest(manifest), expected, `${label}: runtime validation`);
  assert.equal(validateSchema(manifest), expected, `${label}: schema validation: ${JSON.stringify(validateSchema.errors)}`);
}

test("init generates a manifest accepted by runtime and schema validation", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "rootguard-schema-contract-"));
  try {
    const { manifest } = await initManifest({
      cwd: projectRoot,
      packageName: "schema-contract-fixture",
      gitRemote: "https://github.com/example/schema-contract-fixture.git"
    });

    assertContract(manifest, true, "init-generated manifest");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("runtime and schema validation share the manifest contract", () => {
  const validManifest = {
    $schema: schema.$id,
    version: 1,
    identity: { packageName: "example", gitRemote: "https://github.com/example/example.git" },
    allow: [{ prefix: ["npm", "test"], description: "Run tests." }]
  };

  assertContract(validManifest, true, "complete manifest");
  assertContract({ version: 1, identity: {}, allow: [{ prefix: ["npm", "test"] }] }, true, "optional fields omitted");

  for (const [label, manifest] of [
    ["empty allowlist", { ...validManifest, allow: [] }],
    ["empty schema reference", { ...validManifest, $schema: "" }],
    ["unknown manifest property", { ...validManifest, unexpected: true }],
    ["unknown identity property", { ...validManifest, identity: { ...validManifest.identity, unexpected: true } }],
    ["unknown allow rule property", { ...validManifest, allow: [{ ...validManifest.allow[0], unexpected: true }] }],
    ["empty command prefix", { ...validManifest, allow: [{ prefix: [] }] }]
  ]) {
    assertContract(manifest, false, label);
  }
});
