import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function readGitRoot(cwd: string): Promise<string | undefined> {
  const result = await runGit(["rev-parse", "--show-toplevel"], cwd);
  return result.ok ? result.stdout.trim() : undefined;
}

export async function readGitRemote(cwd: string, remoteName = "origin"): Promise<string | undefined> {
  const result = await runGit(["remote", "get-url", remoteName], cwd);
  const remote = result.ok ? result.stdout.trim() : "";
  return remote.length > 0 ? remote : undefined;
}

export function normalizeRemote(remote: string | undefined): string | undefined {
  if (!remote) return undefined;
  const trimmed = remote.trim().replace(/\.git$/, "");
  const scpLike = trimmed.match(/^git@([^:]+):(.+)$/);
  if (scpLike) {
    return `https://${scpLike[1]}/${scpLike[2]}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

async function runGit(args: string[], cwd: string): Promise<{ ok: boolean; stdout: string }> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return { ok: true, stdout };
  } catch {
    return { ok: false, stdout: "" };
  }
}
