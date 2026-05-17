import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export async function fixtureRepo(name, options = {}) {
  const destination = await mkdtemp(join(tmpdir(), `rootguard-${name}-`));
  await cp(join(repoRoot, "test", "fixtures", name), destination, { recursive: true });
  await execFileAsync("git", ["init", "-b", "main"], { cwd: destination });
  if (options.remote) {
    await execFileAsync("git", ["remote", "add", "origin", options.remote], { cwd: destination });
  }
  return destination;
}

export function cliPath() {
  return join(repoRoot, "bin", "rootguard.js");
}

export async function runCli(args, options = {}) {
  try {
    const result = await execFileAsync(process.execPath, [cliPath(), ...args], {
      cwd: options.cwd ?? repoRoot
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? ""
    };
  }
}
