import { RootGuardError } from "./errors.js";
import { initManifest } from "./init.js";
import { writeReport } from "./output.js";
import { executeCommand, prepareRun } from "./run.js";
import { checkProject } from "./check.js";
import type { RootGuardOutputFormat } from "./types.js";

export async function main(argv: string[]): Promise<void> {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    writeHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    process.stdout.write("rootguard 0.1.0\n");
    return;
  }

  try {
    if (command === "init") {
      await initCommand(argv.slice(1));
      return;
    }

    if (command === "check") {
      await checkCommand(argv.slice(1));
      return;
    }

    if (command === "run") {
      await runCommand(argv.slice(1));
      return;
    }

    throw new RootGuardError(`Unknown command: ${command}`, 2);
  } catch (error) {
    if (error instanceof RootGuardError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
      return;
    }

    throw error;
  }
}

async function initCommand(argv: string[]): Promise<void> {
  const parsed = parseCommonOptions(argv);
  const allow: string[][] = [];
  let packageName: string | undefined;
  let gitRemote: string | undefined;

  for (let index = 0; index < parsed.rest.length; index += 1) {
    const part = parsed.rest[index];
    if (part === "--package") {
      packageName = requireValue(parsed.rest, index, "--package");
      index += 1;
    } else if (part === "--remote") {
      gitRemote = requireValue(parsed.rest, index, "--remote");
      index += 1;
    } else if (part === "--allow") {
      allow.push(splitCommandPrefix(requireValue(parsed.rest, index, "--allow")));
      index += 1;
    } else {
      throw new RootGuardError(`Unknown init option: ${part}`, 2);
    }
  }

  const result = await initManifest({
    cwd: parsed.cwd,
    packageName,
    gitRemote,
    allow
  });

  const payload = { ok: true, manifestPath: result.manifestPath, manifest: result.manifest };
  if (parsed.format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(`RootGuard manifest written: ${result.manifestPath}\n`);
}

async function checkCommand(argv: string[]): Promise<void> {
  const parsed = parseCommonOptions(argv);
  if (parsed.rest.length > 0) {
    throw new RootGuardError(`Unknown check option: ${parsed.rest[0]}`, 2);
  }

  const report = await checkProject(parsed.cwd);
  writeReport(report, parsed.format);
  process.exitCode = report.ok ? 0 : 1;
}

async function runCommand(argv: string[]): Promise<void> {
  const separatorIndex = argv.indexOf("--");
  if (separatorIndex === -1) {
    throw new RootGuardError("Usage: rootguard run [--json] [--cwd <path>] -- <command>", 2);
  }

  const parsed = parseCommonOptions(argv.slice(0, separatorIndex));
  const command = argv.slice(separatorIndex + 1);
  if (command.length === 0) {
    throw new RootGuardError("No command provided after --", 2);
  }

  const report = await prepareRun(parsed.cwd, command);
  writeReport(report, parsed.format);
  if (!report.ok || !report.allowed) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = await executeCommand(parsed.cwd, command);
}

function parseCommonOptions(argv: string[]): {
  cwd: string;
  format: RootGuardOutputFormat;
  rest: string[];
} {
  let cwd = process.cwd();
  let format: RootGuardOutputFormat = "text";
  const rest: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (part === "--json") {
      format = "json";
    } else if (part === "--cwd") {
      cwd = requireValue(argv, index, "--cwd");
      index += 1;
    } else {
      rest.push(part);
    }
  }

  return { cwd, format, rest };
}

function requireValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new RootGuardError(`${option} requires a value`, 2);
  }
  return value;
}

function splitCommandPrefix(value: string): string[] {
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    throw new RootGuardError("--allow requires at least one command token", 2);
  }
  return parts;
}

function writeHelp(): void {
  process.stdout.write(`RootGuard guards repo-local commands.

Usage:
  rootguard init [--package <name>] [--remote <url>] [--allow "npm test"]
  rootguard check [--json] [--cwd <path>]
  rootguard run [--json] [--cwd <path>] -- <command>

Commands are allowed only when the repo identity matches .rootguard.json and
the command starts with an explicit allowlist prefix.
`);
}
