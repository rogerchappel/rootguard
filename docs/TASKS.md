# RootGuard Tasks

## MVP

- [x] Initialize a TypeScript CLI package with a rootguard bin.
- [x] Add .rootguard.json manifest loading and validation.
- [x] Implement rootguard init.
- [x] Implement rootguard check.
- [x] Implement rootguard run -- <command>.
- [x] Require matching package identity when configured.
- [x] Require matching git origin remote when configured.
- [x] Allow nested directories inside the same git root.
- [x] Deny missing remotes, wrong repos, and commands outside the allowlist.
- [x] Emit text output for humans and JSON output for agents.
- [x] Add focused fixtures for allowed commands, wrong repo, nested directory, and missing remote.
- [x] Add a real CLI smoke using fixtures.

## Next

- [x] Add a JSON schema for .rootguard.json.
- [ ] Support named allowlist profiles for CI, local, and release workflows.
- [ ] Add shell completion generation.
- [ ] Publish first npm release after external usage feedback.
- [ ] Consider signed manifest support if users need tamper-evidence.

## Release Checklist

Validation recorded from a clean isolated checkout of `origin/main` at `6e415f3f093be6a7449b6ed3d8167f3430fd0e16` on 2026-10-02 (Node/npm versions were those provided by the runner):

- [x] `npm ci` — passed (8 packages installed; npm reported 1 moderate audit finding).
- [x] `npm test` — passed (32 tests).
- [x] `npm run check` — passed.
- [x] `npm run build` — passed.
- [x] `npm run smoke` — passed.
- [x] `bash scripts/validate.sh` — passed (optional `agent-qc` was unavailable and skipped).
- [x] `npm run release:check` — passed (including all 32 tests and package smoke).
- [x] `npm run release:pack -- /private/tmp/oss-worker-80edeb84/release-artifact` — passed; produced `rootguard-0.1.0.tgz`.

These checks validate packaging only; no package was published.
