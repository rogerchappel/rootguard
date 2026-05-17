import { commandDisplay } from "./allowlist.js";
import type { CheckReport, RootGuardOutputFormat, RunReport } from "./types.js";

export function writeReport(report: CheckReport | RunReport, format: RootGuardOutputFormat): void {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (isRunReport(report)) {
    writeRunReport(report);
    return;
  }

  writeCheckReport(report);
}

function writeCheckReport(report: CheckReport): void {
  if (report.ok) {
    process.stdout.write(`RootGuard check passed: ${report.projectRoot}\n`);
    return;
  }

  process.stderr.write("RootGuard check denied:\n");
  for (const denial of report.denials) {
    process.stderr.write(`- ${denial.code}: ${denial.message}\n`);
  }
}

function writeRunReport(report: RunReport): void {
  if (report.ok && report.allowed) {
    process.stdout.write(`RootGuard allowed: ${commandDisplay(report.command)}\n`);
    return;
  }

  process.stderr.write(`RootGuard refused: ${commandDisplay(report.command)}\n`);
  for (const denial of report.denials) {
    process.stderr.write(`- ${denial.code}: ${denial.message}\n`);
  }
}

function isRunReport(report: CheckReport | RunReport): report is RunReport {
  return "command" in report;
}
