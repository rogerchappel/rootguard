import { cwd as processCwd } from "node:process";
import { readGitRemote } from "./git.js";
import { writeManifest } from "./manifest.js";
import { readPackageName } from "./package-json.js";
import type { RootGuardManifest } from "./types.js";

export interface InitOptions {
  cwd?: string;
  packageName?: string;
  gitRemote?: string;
  allow?: string[][];
}

export async function initManifest(options: InitOptions = {}): Promise<{
  manifest: RootGuardManifest;
  manifestPath: string;
}> {
  const projectRoot = options.cwd ?? processCwd();
  const [detectedPackageName, detectedGitRemote] = await Promise.all([
    readPackageName(projectRoot),
    readGitRemote(projectRoot)
  ]);

  const manifest: RootGuardManifest = {
    version: 1,
    identity: {
      packageName: options.packageName ?? detectedPackageName,
      gitRemote: options.gitRemote ?? detectedGitRemote
    },
    allow: options.allow && options.allow.length > 0 ? options.allow.map((prefix) => ({ prefix })) : defaultAllowRules()
  };

  const manifestPath = await writeManifest(projectRoot, manifest);
  return { manifest, manifestPath };
}

function defaultAllowRules() {
  return [
    { prefix: ["npm", "test"], description: "Run the package test suite." },
    { prefix: ["npm", "run", "check"], description: "Run static checks." },
    { prefix: ["npm", "run", "build"], description: "Build the package." },
    { prefix: ["npm", "run", "smoke"], description: "Run smoke checks." }
  ];
}
