import { access, readFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export async function findUp(fileName: string, startDirectory: string): Promise<string | undefined> {
  let current = resolve(startDirectory);
  const root = parse(current).root;

  while (true) {
    const candidate = join(current, fileName);
    if (await fileExists(candidate)) {
      return candidate;
    }

    if (current === root) {
      return undefined;
    }

    current = dirname(current);
  }
}
