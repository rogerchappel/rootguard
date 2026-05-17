export async function main(argv: string[]): Promise<void> {
  if (argv.includes("--help") || argv.length === 0) {
    process.stdout.write("rootguard <init|check|run>\n");
    return;
  }

  throw new Error(`Unknown command: ${argv[0] ?? ""}`);
}
