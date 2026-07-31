import assert from "node:assert/strict";
import test from "node:test";
import { isManifest } from "../dist/manifest.js";

const validManifest = {
  version: 1,
  identity: {
    packageName: "example-package",
    gitRemote: "https://github.com/example/example-package.git"
  },
  allow: [{ prefix: ["npm", "test"] }]
};

test("manifest accepts configured and omitted optional identity strings", () => {
  assert.equal(isManifest(validManifest), true);
  assert.equal(isManifest({ ...validManifest, identity: {} }), true);
});

test("manifest rejects non-string and empty identity fields", () => {
  for (const [field, values] of Object.entries({
    packageName: [false, 42, null, {}, [], ""],
    gitRemote: [false, 42, null, {}, [], ""]
  })) {
    for (const value of values) {
      assert.equal(
        isManifest({ ...validManifest, identity: { ...validManifest.identity, [field]: value } }),
        false,
        `${field} accepted ${JSON.stringify(value)}`
      );
    }
  }
});
