export const manifestFileName = ".rootguard.json";

export type RootGuardOutputFormat = "text" | "json";

export interface RootGuardManifest {
  version: 1;
  identity: {
    packageName?: string;
    gitRemote?: string;
  };
  allow: CommandAllowRule[];
}

export interface CommandAllowRule {
  prefix: string[];
  description?: string;
}

export interface Denial {
  code: string;
  message: string;
  detail?: Record<string, unknown>;
}

export interface CheckReport {
  ok: boolean;
  manifestPath?: string;
  projectRoot?: string;
  cwd: string;
  denials: Denial[];
  identity: {
    expectedPackageName?: string;
    actualPackageName?: string;
    expectedGitRemote?: string;
    actualGitRemote?: string;
    gitRoot?: string;
  };
}

export interface RunReport extends CheckReport {
  command: string[];
  allowed: boolean;
  matchedRule?: CommandAllowRule;
}
