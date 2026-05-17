import { resolve } from "node:path";
import { normalizeRemote, readGitRemote, readGitRoot } from "./git.js";
import { loadManifest } from "./manifest.js";
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
      code: "manifest_not_found",
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
  const [gitRoot, actualGitRemote, actualPackageName] = await Promise.all([
    readGitRoot(resolvedCwd),
    readGitRemote(resolvedCwd),
    readPackageName(projectRoot)
  ]);

  if (gitRoot && resolve(gitRoot) !== resolve(projectRoot)) {
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

  if (manifest.identity.packageName && actualPackageName !== manifest.identity.packageName) {
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
