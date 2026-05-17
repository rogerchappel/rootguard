# Roadmap

RootGuard should stay small. The point is to prevent obvious wrong-root mistakes without turning local development into policy paperwork.

## Near Term

- publish 0.1.x after the CLI has been tried in real worktrees
- add shell completions for common terminals
- add manifest schema references to generated manifests
- improve command prefix parsing for quoted init input

## Later

- named allowlist profiles for CI, local development, and release flows
- optional signed manifests for teams that want tamper-evidence
- richer denial docs for agent runners
- examples for monorepos and package-manager workspaces

## Not Planned

- OS sandboxing
- network policy enforcement
- replacing containers, permissions, or package-manager security controls
