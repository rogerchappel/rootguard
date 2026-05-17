import type { CommandAllowRule } from "./types.js";

export function commandDisplay(command: string[]): string {
  return command.map(quoteForDisplay).join(" ");
}

export function findAllowedCommand(
  command: string[],
  rules: CommandAllowRule[]
): CommandAllowRule | undefined {
  return rules.find((rule) => commandMatchesPrefix(command, rule.prefix));
}

export function commandMatchesPrefix(command: string[], prefix: string[]): boolean {
  if (command.length < prefix.length) {
    return false;
  }

  return prefix.every((part, index) => command[index] === part);
}

function quoteForDisplay(part: string): string {
  return /^[A-Za-z0-9_./:=@+-]+$/.test(part) ? part : JSON.stringify(part);
}
