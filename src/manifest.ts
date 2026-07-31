import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { findUp, readJsonFile } from "./fs.js";
import { manifestFileName, type CommandAllowRule, type RootGuardManifest } from "./types.js";

export function isManifest(value: unknown): value is RootGuardManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const identity = candidate.identity as Record<string, unknown> | undefined;
  return (
    candidate.version === 1 &&
    (candidate.$schema === undefined || typeof candidate.$schema === "string") &&
    !!identity &&
    typeof identity === "object" &&
    !Array.isArray(identity) &&
    isOptionalNonEmptyString(identity.packageName) &&
    isOptionalNonEmptyString(identity.gitRemote) &&
    Array.isArray(candidate.allow) &&
    candidate.allow.every(isAllowRule)
  );
}

function isOptionalNonEmptyString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.length > 0);
}

function isAllowRule(value: unknown): value is CommandAllowRule {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.prefix) &&
    candidate.prefix.length > 0 &&
    candidate.prefix.every((part) => typeof part === "string" && part.length > 0) &&
    (candidate.description === undefined || typeof candidate.description === "string")
  );
}

export async function loadManifest(startDirectory: string): Promise<{
  manifest: RootGuardManifest;
  manifestPath: string;
  projectRoot: string;
}> {
  const manifestPath = await findUp(manifestFileName, startDirectory);
  if (!manifestPath) {
    throw new Error(`No ${manifestFileName} found from ${startDirectory}`);
  }

  let parsed: unknown;
  try {
    parsed = await readJsonFile(manifestPath);
  } catch {
    throw new InvalidManifestError(manifestPath);
  }
  if (!isManifest(parsed)) {
    throw new InvalidManifestError(manifestPath);
  }

  return {
    manifest: parsed,
    manifestPath,
    projectRoot: dirname(manifestPath)
  };
}

export class InvalidManifestError extends Error {
  constructor(manifestPath: string) {
    super(`${manifestPath} is not a valid RootGuard manifest`);
    this.name = "InvalidManifestError";
  }
}

export async function writeManifest(projectRoot: string, manifest: RootGuardManifest): Promise<string> {
  const manifestPath = join(projectRoot, manifestFileName);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
  return manifestPath;
}
