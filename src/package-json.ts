import { join } from "node:path";
import { fileExists, readJsonFile } from "./fs.js";

export async function readPackageName(projectRoot: string): Promise<string | undefined> {
  const packagePath = join(projectRoot, "package.json");
  if (!(await fileExists(packagePath))) {
    return undefined;
  }

  const parsed = await readJsonFile(packagePath);
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const name = (parsed as Record<string, unknown>).name;
  return typeof name === "string" && name.length > 0 ? name : undefined;
}
