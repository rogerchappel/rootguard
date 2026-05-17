# RootGuard Orchestration

RootGuard is built for humans and agents working in busy local workspaces. The contract is intentionally small:

1. Find .rootguard.json from the current directory upward.
2. Treat the manifest directory as the intended project root.
3. Verify configured identity signals before any command runs.
4. Execute only commands that match an explicit prefix in allow.

## Agent Usage

Use rootguard check --json before planning a mutating command. Use rootguard run --json -- <command> when executing a command that changes files, installs dependencies, starts a release, or talks to package tooling.

RootGuard is not a sandbox. It is a local tripwire for wrong-directory mistakes.

## Denial Handling

Agents should treat any non-zero exit code as a hard stop and surface the denial code. The useful codes are:

- manifest_not_found: no project policy was found from the current directory.
- git_root_mismatch: the manifest directory is not the active git root.
- git_remote_missing: the manifest expects an origin remote but none is set.
- git_remote_mismatch: origin points somewhere else.
- package_name_mismatch: package.json disagrees with the manifest.
- command_not_allowed: identity passed, but the command prefix is not allowed.

## Operational Notes

- Keep allowlists short and boring.
- Prefer exact package-manager scripts over broad prefixes.
- Add release commands only when the repository already has a reviewed release process.
- Use JSON output in automation; use text output in terminals.
