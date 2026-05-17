import { spawn } from "node:child_process";
import { findAllowedCommand } from "./allowlist.js";
import { checkProject } from "./check.js";
import { loadManifest } from "./manifest.js";
import type { RunReport } from "./types.js";

export async function prepareRun(cwd: string, command: string[]): Promise<RunReport> {
  const check = await checkProject(cwd);
  let matchedRule = undefined;

  if (check.ok) {
    const { manifest } = await loadManifest(cwd);
    matchedRule = findAllowedCommand(command, manifest.allow);
    if (!matchedRule) {
      check.denials.push({
        code: "command_not_allowed",
        message: "Command does not match any RootGuard allowlist prefix.",
        detail: { command, allowedPrefixes: manifest.allow.map((rule) => rule.prefix) }
      });
    }
  }

  return {
    ...check,
    ok: check.denials.length === 0,
    command,
    allowed: !!matchedRule,
    matchedRule
  };
}

export async function executeCommand(cwd: string, command: string[]): Promise<number> {
  return await new Promise<number>((resolve) => {
    const child = spawn(command[0]!, command.slice(1), {
      cwd,
      stdio: "inherit",
      shell: false
    });

    child.on("error", (error) => {
      process.stderr.write(`${error.message}\n`);
      resolve(127);
    });

    child.on("exit", (code, signal) => {
      if (typeof code === "number") {
        resolve(code);
        return;
      }
      process.stderr.write(`Command exited from signal ${signal ?? "unknown"}\n`);
      resolve(1);
    });
  });
}
