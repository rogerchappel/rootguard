import { resolve } from "node:path";
import { realpath } from "node:fs/promises";
import { normalizeRemote, readGitRemote, readGitRoot } from "./git.js";
import { InvalidManifestError, loadManifest } from "./manifest.js";
import { readPackageName } from "./package-json.js";
import type { CheckReport, Denial } from "./types.js";

export async function checkProject(cwd: string): Promise<CheckReport> {
  const resolvedCwd = resolve(cwd);
  const denials: Denial[] = [];
  let manifestContext: Awaited<ReturnType<typeof loadManifest>>;

  try {
    manifestContext = await loadManifest(resolvedCwd);
  } catch (error) {
    denials.push({
      code: error instanceof InvalidManifestError ? "manifest_invalid" : "manifest_not_found",
      message: error instanceof Error ? error.message : "RootGuard manifest was not found"
    });
    return {
      ok: false,
      cwd: resolvedCwd,
      denials,
      identity: {}
    };
  }

  const { manifest, manifestPath, projectRoot } = manifestContext;
  const [gitRoot, actualGitRemote, packageMetadata] = await Promise.all([
    readGitRoot(resolvedCwd),
    readGitRemote(resolvedCwd),
    readPackageName(projectRoot).then(
      (name) => ({ name }),
      (error: unknown) => ({ error })
    )
  ]);
  const actualPackageName = "name" in packageMetadata ? packageMetadata.name : undefined;

  if ("error" in packageMetadata) {
    denials.push({
      code: "package_metadata_unreadable",
      message: "Unable to read package.json metadata.",
      detail: {
        path: resolve(projectRoot, "package.json"),
        reason: packageMetadata.error instanceof Error ? packageMetadata.error.message : "Unknown read error"
      }
    });
  }

  const [canonicalGitRoot, canonicalProjectRoot] = await Promise.all([
    gitRoot ? canonicalPath(gitRoot) : undefined,
    canonicalPath(projectRoot)
  ]);

  if (gitRoot && canonicalGitRoot !== canonicalProjectRoot) {
    denials.push({
      code: "git_root_mismatch",
      message: "Current git root does not match the RootGuard manifest directory.",
      detail: { expected: projectRoot, actual: gitRoot }
    });
  }

  if (manifest.identity.gitRemote) {
    if (!actualGitRemote) {
      denials.push({
        code: "git_remote_missing",
        message: "Expected git remote origin is configured in the manifest, but this checkout has none."
      });
    } else if (normalizeRemote(actualGitRemote) !== normalizeRemote(manifest.identity.gitRemote)) {
      denials.push({
        code: "git_remote_mismatch",
        message: "Git remote origin does not match the RootGuard manifest.",
        detail: { expected: manifest.identity.gitRemote, actual: actualGitRemote }
      });
    }
  }

  if (
    !("error" in packageMetadata) &&
    manifest.identity.packageName &&
    actualPackageName !== manifest.identity.packageName
  ) {
    denials.push({
      code: "package_name_mismatch",
      message: "package.json name does not match the RootGuard manifest.",
      detail: { expected: manifest.identity.packageName, actual: actualPackageName }
    });
  }

  return {
    ok: denials.length === 0,
    manifestPath,
    projectRoot,
    cwd: resolvedCwd,
    denials,
    identity: {
      expectedPackageName: manifest.identity.packageName,
      actualPackageName,
      expectedGitRemote: manifest.identity.gitRemote,
      actualGitRemote,
      gitRoot
    }
  };
}

async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch {
    return resolve(path);
  }
}
