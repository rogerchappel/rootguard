export class RootGuardError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "RootGuardError";
    this.exitCode = exitCode;
  }
}
