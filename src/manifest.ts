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
    Array.isArray(candidate.allow) &&
    candidate.allow.every(isAllowRule)
  );
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

  const parsed = await readJsonFile(manifestPath);
  if (!isManifest(parsed)) {
    throw new Error(`${manifestPath} is not a valid RootGuard manifest`);
  }

  return {
    manifest: parsed,
    manifestPath,
    projectRoot: dirname(manifestPath)
  };
}

export async function writeManifest(projectRoot: string, manifest: RootGuardManifest): Promise<string> {
  const manifestPath = join(projectRoot, manifestFileName);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
  return manifestPath;
}
