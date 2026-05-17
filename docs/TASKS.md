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

- [ ] Add a JSON schema for .rootguard.json.
- [ ] Support named allowlist profiles for CI, local, and release workflows.
- [ ] Add shell completion generation.
- [ ] Publish first npm release after external usage feedback.
- [ ] Consider signed manifest support if users need tamper-evidence.

## Release Checklist

- [ ] npm test
- [ ] npm run check
- [ ] npm run build
- [ ] npm run smoke
- [ ] bash scripts/validate.sh
- [ ] Confirm package contents with npm pack --dry-run
